// ─── Google Indexing API cron job ─────────────────────────────────────────────
// Runs daily via Vercel Cron. Fetches sitemap, picks up to 200 unsubmitted
// URLs (hubs first, then pSEO pages), submits to Google Indexing API, and
// logs results to the indexing_log table in Neon.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "https://www.chatfpl.ai";
const DAILY_LIMIT = 200;

// High-priority hub pages always submitted first
const PRIORITY_URLS = [
  `${SITE}/fpl/captains`,
  `${SITE}/fpl/differentials`,
  `${SITE}/fpl/comparisons`,
  `${SITE}/`,
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_INDEXING_KEY;
  if (!keyJson) throw new Error("GOOGLE_INDEXING_KEY not set");

  const credentials = JSON.parse(keyJson);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to get access token");
  return tokenResponse.token;
}

// ─── Submit single URL ────────────────────────────────────────────────────────

async function submitUrl(url: string, token: string): Promise<"submitted" | "error"> {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });

  return res.ok ? "submitted" : "error";
}

// ─── Fetch sitemap URLs ───────────────────────────────────────────────────────

async function getSitemapUrls(): Promise<string[]> {
  try {
    const res = await fetch(`${SITE}/sitemap.xml`);
    const xml = await res.text();
    const matches = xml.match(/<loc>(.*?)<\/loc>/g) ?? [];
    return matches.map((m) => m.replace(/<\/?loc>/g, "").trim());
  } catch {
    return [];
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron (or us manually)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getAccessToken();

    // Get all already-submitted URLs
    const submitted = await prisma.indexingLog.findMany({
      select: { url: true },
    });
    const submittedSet = new Set(submitted.map((r) => r.url));

    // Build candidate list: priority hubs first, then sitemap
    const sitemapUrls = await getSitemapUrls();
    const allUrls = [
      ...PRIORITY_URLS,
      ...sitemapUrls.filter((u) => !PRIORITY_URLS.includes(u)),
    ];

    // Filter to unsubmitted only, cap at daily limit
    const toSubmit = allUrls
      .filter((u) => !submittedSet.has(u))
      .slice(0, DAILY_LIMIT);

    if (toSubmit.length === 0) {
      return NextResponse.json({ message: "All known URLs already submitted", submitted: 0 });
    }

    // Submit and log
    const results = { submitted: 0, errors: 0, urls: [] as string[] };

    for (const url of toSubmit) {
      const status = await submitUrl(url, token);

      await prisma.indexingLog.upsert({
        where: { url },
        update: { submitted_at: new Date(), status },
        create: { url, status },
      });

      if (status === "submitted") {
        results.submitted++;
        results.urls.push(url);
      } else {
        results.errors++;
      }

      // Small delay to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`Google Indexing cron: submitted ${results.submitted}, errors ${results.errors}`);

    return NextResponse.json({
      submitted: results.submitted,
      errors: results.errors,
      total_submitted_ever: submittedSet.size + results.submitted,
      sample_urls: results.urls.slice(0, 5),
    });
  } catch (err: any) {
    console.error("Indexing cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
