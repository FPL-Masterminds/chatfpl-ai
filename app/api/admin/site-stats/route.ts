// Admin-only operational stats panel.
//
// Returns:
//   - sitemap.total_urls: live count from /sitemap.xml (parsed on the fly)
//   - indexing.submitted_today: rows in indexing_log with status='submitted'
//     from midnight UTC
//   - indexing.last_7d: date/count pairs for the last 7 days
//   - indexing.total_ever: lifetime submitted count
//   - activity.valid_sessions: NextAuth sessions with expires > now.
//     NOTE: sessions default to 30 days, so this is a very generous
//     "logged in at some point recently" number, not "online right now".
//   - activity.active_chatters_15m: distinct users who sent a chat message
//     in the last 15 minutes. Best cheap proxy for "actually using the site".
//   - activity.unique_users_24h: distinct users active in the last 24 hours.
//
// Auth: session must be role === "admin". Returns 403 otherwise.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://chatfpl.ai";

async function fetchSitemapUrlCount(): Promise<number | null> {
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`, {
      // Cache-buster - we always want live numbers on the admin panel
      cache: "no-store",
      headers: { "User-Agent": "ChatFPL-Admin-Stats/1.0" },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    // Naive but correct - <url> is only used inside a <urlset> per the
    // sitemap protocol, so a simple regex match is enough.
    const matches = xml.match(/<url>/g);
    return matches?.length ?? 0;
  } catch (err) {
    console.warn("site-stats: sitemap fetch failed", err);
    return null;
  }
}

export async function GET() {
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

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setUTCDate(startOf7DaysAgo.getUTCDate() - 6);
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    sitemapCount,
    submittedToday,
    submittedTotal,
    submitted7dRaw,
    validSessions,
    chatters15mRaw,
    chatters24hRaw,
  ] = await Promise.all([
    fetchSitemapUrlCount(),
    prisma.indexingLog.count({
      where: { submitted_at: { gte: startOfToday }, status: "submitted" },
    }),
    prisma.indexingLog.count({ where: { status: "submitted" } }),
    // 7-day trend - group by date in JS to avoid Postgres date-trunc noise
    prisma.indexingLog.findMany({
      where: { submitted_at: { gte: startOf7DaysAgo }, status: "submitted" },
      select: { submitted_at: true },
    }),
    prisma.session.count({ where: { expires: { gt: now } } }),
    prisma.message.findMany({
      where: {
        role: "user",
        timestamp: { gte: fifteenMinAgo },
      },
      select: { conversation: { select: { user_id: true } } },
      distinct: ["conversation_id"],
    }),
    prisma.message.findMany({
      where: {
        role: "user",
        timestamp: { gte: oneDayAgo },
      },
      select: { conversation: { select: { user_id: true } } },
      distinct: ["conversation_id"],
    }),
  ]);

  // Build 7-day trend, filling zeros for empty days
  const dayBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setUTCDate(d.getUTCDate() - i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of submitted7dRaw) {
    const key = row.submitted_at.toISOString().slice(0, 10);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const last_7d = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));

  // Reduce chatters to unique user_ids
  const uniqueUsers15m = new Set(chatters15mRaw.map((r) => r.conversation?.user_id).filter(Boolean));
  const uniqueUsers24h = new Set(chatters24hRaw.map((r) => r.conversation?.user_id).filter(Boolean));

  return NextResponse.json({
    sitemap: {
      total_urls: sitemapCount,
      source_url: `${SITE_URL}/sitemap.xml`,
    },
    indexing: {
      submitted_today: submittedToday,
      submitted_total: submittedTotal,
      last_7d,
    },
    activity: {
      valid_sessions: validSessions,
      active_chatters_15m: uniqueUsers15m.size,
      unique_users_24h: uniqueUsers24h.size,
    },
    fetched_at: now.toISOString(),
  });
}
