// Admin-only: top pages by Google Search traffic (clicks) over a window.
//
// Uses the same GoogleAuth service account that the indexing cron uses,
// but expanded to include the webmasters.readonly scope so we can hit
// Search Console's Search Analytics API.
//
// Requirements:
//   - GOOGLE_INDEXING_KEY env var (existing) - service account JSON blob
//   - The service account must be added as a "Full user" or "Restricted user"
//     on the Search Console property https://www.chatfpl.ai/
//     (Search Console → Settings → Users and permissions → Add user)
//   - If it isn't, the API returns 403 and we surface a helpful message.
//
// Query params:
//   ?days=28    Window size in days (7, 28, 90). Default 28.
//   ?limit=25   Max rows to return. Default 25.
//
// Response:
//   { rows: [{ page, clicks, impressions, ctr, position }, ...],
//     totals: { clicks, impressions }, days, fetched_at, source: "gsc" }

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Search Console distinguishes between URL-prefix properties (each variation
// of https/http/www is a separate property) and domain properties (which
// cover every URL on the apex domain, keyed as "sc-domain:<domain>").
//
// We can't reliably discover which one the account has access to because
// GSC's sites.list endpoint returns empty for service accounts in many
// cases even when they can query specific properties. Instead we just try
// each candidate directly with the actual query and use the first that
// returns 200.
const CANDIDATE_PROPERTIES = [
  "sc-domain:chatfpl.ai",
  "https://www.chatfpl.ai/",
  "https://chatfpl.ai/",
];

async function queryGsc(
  token: string,
  property: string,
  startDate: string,
  endDate: string,
  rowLimit: number,
): Promise<{ ok: true; body: any } | { ok: false; status: number; error: string }> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit,
    }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return { ok: true, body: await res.json() };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const daysRaw = parseInt(url.searchParams.get("days") ?? "28", 10);
  const days = [7, 28, 90].includes(daysRaw) ? daysRaw : 28;
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "25", 10);
  const limit = Math.min(Math.max(limitRaw, 5), 100);

  if (!process.env.GOOGLE_INDEXING_KEY) {
    return NextResponse.json(
      { error: "Server missing GOOGLE_INDEXING_KEY env var" },
      { status: 500 },
    );
  }

  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  const startDate = start.toISOString().slice(0, 10);
  // GSC data is typically 2-3 days behind. Using yesterday as endDate
  // gives us the freshest complete data.
  const endDateD = new Date(now);
  endDateD.setUTCDate(endDateD.getUTCDate() - 1);
  const endDate = endDateD.toISOString().slice(0, 10);

  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_INDEXING_KEY);
  } catch {
    return NextResponse.json({ error: "Malformed GOOGLE_INDEXING_KEY" }, { status: 500 });
  }

  try {
    const gAuth = new GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/indexing",
        "https://www.googleapis.com/auth/webmasters.readonly",
      ],
    });
    const client = await gAuth.getClient();
    const token = (await client.getAccessToken()).token;
    if (!token) throw new Error("No access token from GoogleAuth");

    // Try each candidate in turn. First 200 wins. Collect the failures
    // so if all miss we can return a diagnostic instead of a black box.
    const attempts: { property: string; status: number; error: string }[] = [];
    let property: string | null = null;
    let body: any = null;
    for (const candidate of CANDIDATE_PROPERTIES) {
      const result = await queryGsc(token, candidate, startDate, endDate, limit);
      if (result.ok) {
        property = candidate;
        body = result.body;
        break;
      }
      attempts.push({ property: candidate, status: result.status, error: result.error });
    }

    if (!property) {
      // All candidates failed. The most likely 403 means the service account
      // isn't yet visible to Search Console for this property, which usually
      // means "we just added it and Google hasn't propagated" (5-30 min) or
      // the wrong property variant is registered.
      const has403 = attempts.some((a) => a.status === 403);
      return NextResponse.json({
        error: has403
          ? "Search Console returned 403 for every property variant"
          : "Failed to query Search Console",
        hint: has403
          ? "The service account should be listed on the chatfpl.ai property in Search Console. If you just added it, wait 15-30 minutes for Google to propagate. Otherwise the property might be registered under a variant we don't know about - check Search Console's property selector for the exact spelling."
          : "Check server logs for the upstream error.",
        attempts,
      }, { status: has403 ? 403 : 502 });
    }

    const rows = (body.rows ?? []).map((r: any) => ({
      page: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));

    const totals = rows.reduce(
      (acc: { clicks: number; impressions: number }, r: any) => ({
        clicks: acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
      }),
      { clicks: 0, impressions: 0 },
    );

    return NextResponse.json({
      rows,
      totals,
      days,
      startDate,
      endDate,
      fetched_at: now.toISOString(),
      source: "gsc",
      property,
    });
  } catch (err: any) {
    console.error("top-pages GSC fetch failed", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
