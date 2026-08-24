// Audit the remaining nudge cohort: eligibility, bonus top-up status, plan.
import { config } from "dotenv";
import fs from "node:fs";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REMAINING_FILE = "scripts/data/campaign-2026-08-22-remaining.txt";

const emails = fs
  .readFileSync(REMAINING_FILE, "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const users = await prisma.user.findMany({
  where: { email: { in: emails, mode: "insensitive" } },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    emailVerified: true,
    marketing_opt_out: true,
    unsubscribe_token: true,
    bonus_topup_at: true,
    bonus_topup_amount: true,
    subscriptions: { select: { plan: true, status: true }, orderBy: { id: "desc" } },
    usageTracking: { select: { messages_used: true, messages_limit: true }, orderBy: { id: "desc" }, take: 1 },
  },
});

const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

const buckets = {
  sendAndMaybeTopup: [],
  skipAlreadyToppedUp: [],
  skipNotFree: [],
  skipAdmin: [],
  skipOptOut: [],
  skipUnverified: [],
  skipNotFound: [],
  skipNoToken: [],
};

for (const email of emails) {
  const u = byEmail.get(email);
  if (!u) {
    buckets.skipNotFound.push(email);
    continue;
  }
  if (!u.emailVerified) {
    buckets.skipUnverified.push(u.email);
    continue;
  }
  if (u.role === "admin") {
    buckets.skipAdmin.push(u.email);
    continue;
  }
  if (u.marketing_opt_out) {
    buckets.skipOptOut.push(u.email);
    continue;
  }
  if (!u.unsubscribe_token) {
    buckets.skipNoToken.push(u.email);
    continue;
  }

  const latestSub = u.subscriptions[0];
  const plan = latestSub?.plan ?? "Unknown";
  const isFree = plan === "Free";

  if (!isFree) {
    buckets.skipNotFree.push({ email: u.email, plan });
    continue;
  }

  const usage = u.usageTracking[0];
  const entry = {
    email: u.email,
    bonus_topup_at: u.bonus_topup_at,
    usage: usage ? `${usage.messages_used}/${usage.messages_limit}` : "no row",
    needsTopup: !u.bonus_topup_at,
  };

  if (u.bonus_topup_at) {
    buckets.skipAlreadyToppedUp.push(entry);
    // Still eligible for EMAIL if they never got it - they need the email not duplicate topup
    buckets.sendAndMaybeTopup.push({ ...entry, needsTopup: false });
  } else {
    buckets.sendAndMaybeTopup.push(entry);
  }
}

console.log("Remaining file:", emails.length);
console.log("\nEligible to EMAIL (free, verified, not opted out):", buckets.sendAndMaybeTopup.length);
console.log("  of which need +20 top-up still:", buckets.sendAndMaybeTopup.filter((e) => e.needsTopup).length);
console.log("  already have bonus_topup_at (email only):", buckets.sendAndMaybeTopup.filter((e) => !e.needsTopup).length);
console.log("\nSkip - not found:", buckets.skipNotFound.length, buckets.skipNotFound);
console.log("Skip - unverified:", buckets.skipUnverified.length);
console.log("Skip - admin:", buckets.skipAdmin.length);
console.log("Skip - opted out:", buckets.skipOptOut.length);
console.log("Skip - no unsubscribe token:", buckets.skipNoToken.length);
console.log("Skip - paid/non-free:", buckets.skipNotFree.length, buckets.skipNotFree);

const toSend = buckets.sendAndMaybeTopup.map((e) => e.email);
const toTopup = buckets.sendAndMaybeTopup.filter((e) => e.needsTopup).map((e) => e.email);

fs.writeFileSync("scripts/data/campaign-2026-08-22-send-now.txt", toSend.join("\n") + "\n");
fs.writeFileSync("scripts/data/campaign-2026-08-22-topup-now.txt", toTopup.join("\n") + "\n");
console.log("\nWrote scripts/data/campaign-2026-08-22-send-now.txt (" + toSend.length + ")");
console.log("Wrote scripts/data/campaign-2026-08-22-topup-now.txt (" + toTopup.length + ")");

await prisma.$disconnect();
