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
const FALLBACK_PROPERTIES = [
  "sc-domain:chatfpl.ai",
  "https://www.chatfpl.ai/",
  "https://chatfpl.ai/",
];

type GoogleApiError = {
  reason?: string;
  message?: string;
  activationUrl?: string;
};

function parseGoogleError(raw: string): GoogleApiError {
  try {
    const parsed = JSON.parse(raw);
    const detail = parsed?.error?.details?.[0] ?? parsed?.error;
    const reason =
      detail?.reason ??
      parsed?.error?.errors?.[0]?.reason ??
      parsed?.error?.status;
    const message =
      detail?.message ??
      parsed?.error?.message ??
      parsed?.error?.errors?.[0]?.message;
    const activationUrl =
      detail?.metadata?.activationUrl ??
      parsed?.error?.details?.find((d: any) => d?.metadata?.activationUrl)?.metadata
        ?.activationUrl;
    return { reason, message, activationUrl };
  } catch {
    return { message: raw };
  }
}

function buildGscFailureHint(
  attempts: { property: string; status: number; error: string; parsed: GoogleApiError }[],
  serviceAccount: string,
  projectId?: string,
): { error: string; hint: string; steps: string[] } {
  const parsed = attempts.map((a) => a.parsed);
  const serviceDisabled = parsed.some(
    (p) =>
      p.reason === "accessNotConfigured" ||
      p.reason === "SERVICE_DISABLED" ||
      p.message?.includes("Search Console API has not been used") ||
      p.message?.includes("API has not been enabled"),
  );
  const permissionDenied = parsed.some(
    (p) =>
      p.reason === "forbidden" ||
      p.message?.includes("does not have sufficient permission"),
  );

  if (serviceDisabled) {
    const activation =
      parsed.find((p) => p.activationUrl)?.activationUrl ??
      (projectId
        ? `https://console.cloud.google.com/apis/library/searchconsole.googleapis.com?project=${projectId}`
        : "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com");
    return {
      error: "Google Search Console API is not enabled for the indexing project",
      hint:
        "The daily indexing cron uses a different API. Search Analytics needs the Search Console API enabled separately in Google Cloud.",
      steps: [
        `Open ${activation} and click Enable.`,
        "Wait 2-5 minutes for Google to propagate the change.",
        `Confirm ${serviceAccount} is listed on the chatfpl.ai property in Search Console with Full permission (Restricted often blocks API reads).`,
        "Refresh this panel.",
      ],
    };
  }

  if (permissionDenied) {
    return {
      error: "Search Console returned 403 for every property variant",
      hint:
        "The service account can submit URLs for indexing but cannot read Search Analytics yet.",
      steps: [
        "Open Google Search Console for chatfpl.ai: Settings > Users and permissions.",
        `Find ${serviceAccount} and change permission from Restricted to Full.`,
        "If it is already Full, remove and re-add the user, then wait 15-30 minutes.",
        "Refresh this panel.",
      ],
    };
  }

  return {
    error: "Failed to query Search Console",
    hint: "Check the attempts array in the server response for upstream details.",
    steps: [
      `Confirm ${serviceAccount} is on the chatfpl.ai property in Search Console.`,
      "Enable the Search Console API in the chatfpl-indexing Google Cloud project.",
      "Try again after 15-30 minutes if you just changed permissions.",
    ],
  };
}

async function listGscSites(
  token: string,
): Promise<{ ok: true; sites: string[] } | { ok: false; status: number; error: string; parsed: GoogleApiError }> {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, error: raw, parsed: parseGoogleError(raw) };
  }
  const body = JSON.parse(raw);
  const sites = (body.siteEntry ?? [])
    .map((entry: { siteUrl?: string }) => entry.siteUrl)
    .filter(Boolean);
  return { ok: true, sites };
}

async function queryGsc(
  token: string,
  property: string,
  startDate: string,
  endDate: string,
  rowLimit: number,
): Promise<
  | { ok: true; body: any }
  | { ok: false; status: number; error: string; parsed: GoogleApiError }
> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
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
    const error = await res.text();
    return { ok: false, status: res.status, error, parsed: parseGoogleError(error) };
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

    const serviceAccount = credentials.client_email ?? "unknown service account";
    const projectId = credentials.project_id;

    const siteList = await listGscSites(token);
    const candidateProperties = [
      ...(siteList.ok ? siteList.sites : []),
      ...FALLBACK_PROPERTIES,
    ].filter((property, index, all) => all.indexOf(property) === index);

    // Try each candidate in turn. First 200 wins. Collect the failures
    // so if all miss we can return a diagnostic instead of a black box.
    const attempts: {
      property: string;
      status: number;
      error: string;
      parsed: GoogleApiError;
    }[] = [];
    let property: string | null = null;
    let body: any = null;
    for (const candidate of candidateProperties) {
      const result = await queryGsc(token, candidate, startDate, endDate, limit);
      if (result.ok) {
        property = candidate;
        body = result.body;
        break;
      }
      attempts.push({
        property: candidate,
        status: result.status,
        error: result.error,
        parsed: result.parsed,
      });
    }

    if (!property) {
      const failure = buildGscFailureHint(attempts, serviceAccount, projectId);
      const has403 = attempts.some((a) => a.status === 403);
      return NextResponse.json({
        error: failure.error,
        hint: failure.hint,
        steps: failure.steps,
        serviceAccount,
        siteList: siteList.ok ? siteList.sites : null,
        siteListError: siteList.ok ? null : siteList.parsed,
        attempts: attempts.map((a) => ({
          property: a.property,
          status: a.status,
          reason: a.parsed.reason,
          message: a.parsed.message,
        })),
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
