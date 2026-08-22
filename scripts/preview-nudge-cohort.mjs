// Reports the cohort we'd nudge + top-up, without doing anything.
//
// Cohort proposal: verified users on the Free plan who have NOT opted out
// of marketing emails and are not admins. Paid users aren't in scope for
// the "we fixed the pay flow + here's 20 apology messages" campaign - they
// already paid and the message wouldn't land right.
//
// Usage: node scripts/preview-nudge-cohort.mjs [--exclude email1,email2]

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const exIdx = args.indexOf("--exclude");
const excludeList = exIdx >= 0 ? (args[exIdx + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : [];
const writeIdx = args.indexOf("--write");
const writePath = writeIdx >= 0 ? args[writeIdx + 1] : null;

const users = await prisma.user.findMany({
  where: {
    emailVerified: { not: null },
    marketing_opt_out: false,
    role: { not: "admin" },
    subscriptions: { some: { plan: "Free" } },
    email: { notIn: excludeList },
  },
  select: {
    id: true,
    email: true,
    name: true,
    created_at: true,
    bonus_topup_at: true,
    subscriptions: { select: { plan: true }, take: 1 },
    usageTracking: { select: { messages_used: true, messages_limit: true }, orderBy: { id: "desc" }, take: 1 },
  },
});

console.log(`\nCohort size: ${users.length}\n`);
console.log(`Excluded:    ${excludeList.length ? excludeList.join(", ") : "(none)"}\n`);

const already = users.filter((u) => u.bonus_topup_at);
const noRow = users.filter((u) => !u.usageTracking.length);
const paidRows = users.filter((u) => u.usageTracking.length && u.subscriptions[0]?.plan !== "Free");

console.log(`Already got bonus_topup_at (would be skipped by top-up script): ${already.length}`);
console.log(`Have no usage_tracking row yet (never chatted): ${noRow.length}`);
console.log();

const sample = users.slice(0, 5);
console.log(`Sample first 5:`);
for (const u of sample) {
  const usage = u.usageTracking[0];
  const state = usage ? `${usage.messages_used}/${usage.messages_limit}` : "no row";
  console.log(`  ${u.email.padEnd(38)}  ${state.padEnd(10)}  signed up ${u.created_at.toISOString().slice(0, 10)}`);
}

if (writePath) {
  const lines = users.map((u) => u.email).join("\n") + "\n";
  fs.writeFileSync(writePath, lines);
  console.log(`\nWrote ${users.length} emails to ${writePath}`);
}

await prisma.$disconnect();
