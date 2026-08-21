// ─── Profanity scanning cron ─────────────────────────────────────────────────
// Runs daily via Vercel Cron. Scans user messages from the last ~25 hours
// (small overlap to catch late timestamps), matches against a curated word
// list with strict word boundaries, and records hits in profanity_flags.
//
// The unique index on message_id keeps the job idempotent - re-running is
// safe and will only insert new matches.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

// Curated list. "arse" is deliberately excluded to avoid Arsenal false
// positives - our earlier ad-hoc scan showed this was noisy even with
// word-boundary regex.
const WORDS = [
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "bastard",
  "wanker",
  "twat",
  "bollocks",
  "prick",
  "dick",
  "piss",
  "arsehole",
  "asshole",
  "motherfucker",
  "fucker",
  "cock",
  "slag",
  "slut",
  "whore",
  "nigger",
  "faggot",
  "retard",
] as const;

// Case-insensitive word-boundary regex, tolerant of common suffixes.
// eg. matches "fuck", "fucks", "fucking", "fucked", "fucker(s)".
const SUFFIX = "(s|es|er|ers|ed|ing|y|in')?";
const WORD_RE = new RegExp(
  `\\b(${WORDS.join("|")})${SUFFIX}\\b`,
  "gi",
);

// Scan window: 25 hours to give the daily 09:15 UTC cron a bit of overlap
// with anything logged just before the previous run.
const WINDOW_MS = 25 * 60 * 60 * 1000;

// Backfill mode: hit /api/cron/scan-profanity?backfill=1 (with correct
// bearer token) to scan the entire message history in one go.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const backfill = url.searchParams.get("backfill") === "1";
  const since = backfill ? new Date(0) : new Date(Date.now() - WINDOW_MS);

  try {
    // Pull candidate user messages in the window. We only flag `role = 'user'`
    // - AI responses aren't going to swear.
    const messages = await prisma.message.findMany({
      where: {
        role: "user",
        timestamp: { gte: since },
      },
      select: {
        id: true,
        conversation_id: true,
        content: true,
        timestamp: true,
        conversation: {
          select: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    let scanned = 0;
    let flagged = 0;
    let skipped = 0;

    for (const msg of messages) {
      scanned += 1;
      const hits = new Set<string>();
      // Reset regex state between messages (global flag).
      WORD_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = WORD_RE.exec(msg.content)) !== null) {
        hits.add(match[1].toLowerCase());
      }
      if (hits.size === 0) continue;

      const user = msg.conversation?.user;
      // Cap stored content to 2k chars - plenty of context, no runaway rows.
      const content = msg.content.length > 2000
        ? msg.content.slice(0, 2000) + "…"
        : msg.content;

      try {
        await prisma.profanityFlag.create({
          data: {
            message_id: msg.id,
            conversation_id: msg.conversation_id,
            user_id: user?.id ?? null,
            user_email: user?.email ?? null,
            user_name: user?.name ?? null,
            words_matched: Array.from(hits),
            content,
            message_at: msg.timestamp,
          },
        });
        flagged += 1;
      } catch (err: any) {
        // P2002 = unique constraint violation on message_id. Expected on
        // re-runs; treat as a skip, not a failure.
        if (err?.code === "P2002") {
          skipped += 1;
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      backfill,
      window_start: since.toISOString(),
      scanned,
      flagged,
      skipped_duplicates: skipped,
    });
  } catch (err: any) {
    console.error("scan-profanity failed", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
