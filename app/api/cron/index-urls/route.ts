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
  const res = await fetch(`${SITE}/sitemap.xml`, {
    headers: { "User-Agent": "ChatFPL-IndexingCron/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Sitemap fetch failed: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const matches = xml.match(/<loc>(.*?)<\/loc>/g) ?? [];
  if (matches.length === 0) {
    throw new Error("Sitemap returned no <loc> entries");
  }
  return matches.map((m) => m.replace(/<\/?loc>/g, "").trim());
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

    // Get every previous submission with its timestamp so we can decide
    // whether high-value hubs are due a weekly refresh.
    const submitted = await prisma.indexingLog.findMany({
      select: { url: true, submitted_at: true },
    });
    const submittedAt = new Map<string, Date>();
    for (const r of submitted) submittedAt.set(r.url, r.submitted_at);

    // High-value hubs get re-signalled weekly since their content changes
    // materially each gameweek (new injuries, transfers, DGW/BGW schedule).
    // Everything else stays "submit once" and lets Google's own crawler
    // handle refreshes.
    const HUB_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
    const isHubDueRefresh = (url: string) => {
      if (!PRIORITY_URLS.includes(url)) return false;
      const last = submittedAt.get(url);
      return !last || Date.now() - last.getTime() >= HUB_REFRESH_MS;
    };

    // Build candidate list: priority hubs first, then sitemap
    const sitemapUrls = await getSitemapUrls();
    const allUrls = [
      ...PRIORITY_URLS,
      ...sitemapUrls.filter((u) => !PRIORITY_URLS.includes(u)),
    ];

    // Keep any URL never submitted, plus hubs whose last submission is
    // older than a week.
    const unsubmittedPool = allUrls.filter(
      (u) => !submittedAt.has(u) || isHubDueRefresh(u)
    );
    const toSubmit = unsubmittedPool.slice(0, DAILY_LIMIT);

    const hubRefreshCount = toSubmit.filter((u) => PRIORITY_URLS.includes(u)).length;
    console.log(
      `Google Indexing cron: sitemap=${sitemapUrls.length}, alreadySubmitted=${submittedAt.size}, queueRemaining=${unsubmittedPool.length}, willSubmitNow=${toSubmit.length} (${hubRefreshCount} hub refresh)`
    );

    if (toSubmit.length === 0) {
      console.warn("Google Indexing cron: queue empty - nothing to submit today");
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
      total_submitted_ever: submittedAt.size + results.submitted,
      urls_submitted: results.urls,
    });
  } catch (err: any) {
    console.error("Indexing cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
