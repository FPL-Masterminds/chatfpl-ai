// Applies a one-off message top-up (bonus_topup_amount) to specific users
// by bumping usage_tracking.messages_limit by that amount for the current
// row. Records the top-up on users.bonus_topup_at + users.bonus_topup_amount
// so we can audit AND guarantee idempotency.
//
// SAFETY GUARANTEES (why this cannot recur monthly):
//   1. Paid users: on next Stripe subscription renewal / plan change, the
//      Stripe webhook overwrites messages_limit to the plan default (100
//      for Premium, 500 for Elite). The +N bonus is wiped.
//   2. Free users: on next free-tier reset (lib/reset-free-messages.ts),
//      messages_limit is SET to 20. The +N bonus is wiped.
//   3. No code path anywhere reads bonus_topup_at except this script -
//      it exists purely to stop us double-applying.
//
// Usage:
//   node scripts/apply-bonus-topup.mjs --dry-run <email1> [email2 ...]
//   node scripts/apply-bonus-topup.mjs [--amount 20] <email1> [email2 ...]
//   node scripts/apply-bonus-topup.mjs [--amount 20] --all-free
//   node scripts/apply-bonus-topup.mjs --force <email>   # re-apply
//
// The default amount is 20. Users with bonus_topup_at already set are
// skipped unless --force is passed.

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const args = process.argv.slice(2);

const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const allFree = args.includes("--all-free");

const amtIdx = args.indexOf("--amount");
const amount = amtIdx >= 0 ? parseInt(args[amtIdx + 1], 10) : 20;
const fileIdx = args.indexOf("--file");
const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;
if (!Number.isFinite(amount) || amount <= 0 || amount > 500) {
  console.error(`Invalid --amount: ${amount}. Must be 1-500.`);
  process.exit(1);
}

const flagSet = new Set(["--dry-run", "--force", "--all-free", "--amount", String(amount), "--file", filePath ?? ""]);
let emails = args.filter((a) => !flagSet.has(a) && !a.startsWith("--"));

if (filePath) {
  const fromFile = fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  emails = emails.concat(fromFile);
}

if (!emails.length && !allFree) {
  console.error("usage: node scripts/apply-bonus-topup.mjs [--dry-run] [--force] [--amount N] <email...>");
  console.error("       node scripts/apply-bonus-topup.mjs [--dry-run] [--amount N] --all-free");
  console.error("       node scripts/apply-bonus-topup.mjs [--dry-run] --file cohort.txt");
  process.exit(1);
}

async function candidateUsers() {
  if (allFree) {
    return prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        subscriptions: { some: { plan: "Free" } },
      },
      select: { id: true, email: true, name: true, bonus_topup_at: true, bonus_topup_amount: true },
    });
  }
  return prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, name: true, bonus_topup_at: true, bonus_topup_amount: true },
  });
}

function pad(n, w = 4) { return String(n).padStart(w); }

const users = await candidateUsers();

if (!users.length) {
  console.log("No matching users.");
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`Candidates: ${users.length}`);
console.log(`Amount:     +${amount}`);
console.log(`Mode:       ${dryRun ? "DRY RUN" : "APPLY"}${force ? " (force)" : ""}\n`);

const results = { applied: [], skipped: [], failed: [] };

for (const u of users) {
  if (u.bonus_topup_at && !force) {
    results.skipped.push({ email: u.email, reason: `already topped up on ${u.bonus_topup_at.toISOString()} (+${u.bonus_topup_amount ?? "?"})` });
    continue;
  }

  const usage = await prisma.usageTracking.findFirst({
    where: { user_id: u.id },
    orderBy: { id: "desc" },
  });

  const beforeUsed = usage?.messages_used ?? 0;
  const beforeLimit = usage?.messages_limit ?? null;
  const afterLimit = (beforeLimit ?? 20) + amount;

  console.log(`${u.email.padEnd(40)} used=${pad(beforeUsed)}/${pad(beforeLimit ?? "N/A")}  ->  ${pad(beforeUsed)}/${pad(afterLimit)}`);

  if (dryRun) { results.applied.push({ email: u.email, dry: true }); continue; }

  try {
    if (usage) {
      await prisma.usageTracking.update({
        where: { id: usage.id },
        data: { messages_limit: usage.messages_limit + amount },
      });
    } else {
      // No usage row yet - seed one with base plan default + bonus so
      // the very first chat request doesn't overwrite our top-up.
      const now = new Date();
      const sub = await prisma.subscription.findFirst({
        where: { user_id: u.id },
        orderBy: { id: "desc" },
      });
      const planBase = sub?.plan === "Elite" ? 500 : sub?.plan === "Premium" ? 100 : 20;
      await prisma.usageTracking.create({
        data: {
          user_id: u.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          messages_used: 0,
          messages_limit: planBase + amount,
        },
      });
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        bonus_topup_at: new Date(),
        bonus_topup_amount: amount,
      },
    });

    results.applied.push({ email: u.email });
  } catch (err) {
    console.error(`  FAILED for ${u.email}:`, err?.message ?? err);
    results.failed.push({ email: u.email, error: err?.message ?? String(err) });
  }
}

await prisma.$disconnect();

console.log("\n===== summary =====");
console.log(`applied: ${results.applied.length}${dryRun ? " (dry run)" : ""}`);
console.log(`skipped: ${results.skipped.length}`);
console.log(`failed:  ${results.failed.length}`);
if (results.skipped.length) console.log("skipped:", results.skipped);
if (results.failed.length) console.log("failed:", results.failed);
