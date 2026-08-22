// Backfill unsubscribe_token for existing users that don't have one.
// Idempotent - skips users that already have a token.
//
// Usage:  node scripts/backfill-unsubscribe-tokens.mjs

import { config as loadEnv } from "dotenv";
loadEnv();
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  where: { unsubscribe_token: null },
  select: { id: true, email: true },
});

console.log(`Backfilling ${users.length} users...`);

let filled = 0;
for (const u of users) {
  const token = crypto.randomBytes(24).toString("hex"); // 48 chars
  await prisma.user.update({
    where: { id: u.id },
    data: { unsubscribe_token: token },
  });
  filled++;
}

console.log(`Filled ${filled}.`);
await prisma.$disconnect();
