// One-off: scan the whole `messages` table and populate `profanity_flags`.
// Idempotent - safe to re-run. Uses the same word list and regex as the
// daily cron (app/api/cron/scan-profanity/route.ts).
//
// Usage:  node scripts/backfill-profanity.mjs

import { config as loadEnv } from "dotenv";
loadEnv();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORDS = [
  "fuck", "shit", "cunt", "bitch", "bastard", "wanker", "twat",
  "bollocks", "prick", "dick", "piss", "arsehole", "asshole",
  "motherfucker", "fucker", "cock", "slag", "slut", "whore",
  "nigger", "faggot", "retard",
];
const SUFFIX = "(s|es|er|ers|ed|ing|y|in')?";
const WORD_RE = new RegExp(`\\b(${WORDS.join("|")})${SUFFIX}\\b`, "gi");

async function main() {
  const messages = await prisma.message.findMany({
    where: { role: "user" },
    select: {
      id: true,
      conversation_id: true,
      content: true,
      timestamp: true,
      conversation: {
        select: { user: { select: { id: true, email: true, name: true } } },
      },
    },
    orderBy: { timestamp: "asc" },
  });

  let scanned = 0, flagged = 0, skipped = 0;

  for (const msg of messages) {
    scanned++;
    const hits = new Set();
    WORD_RE.lastIndex = 0;
    let m;
    while ((m = WORD_RE.exec(msg.content)) !== null) {
      hits.add(m[1].toLowerCase());
    }
    if (hits.size === 0) continue;

    const user = msg.conversation?.user;
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
      flagged++;
    } catch (err) {
      if (err?.code === "P2002") skipped++;
      else throw err;
    }
  }

  console.log(JSON.stringify({ scanned, flagged, skipped_duplicates: skipped }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
