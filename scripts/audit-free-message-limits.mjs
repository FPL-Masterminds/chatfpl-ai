// Sanity check: does usage_tracking.messages_used actually match the
// lifetime count of messages a free user has sent?
//
// If free users have been silently getting a monthly refresh (which
// they shouldn't per the "20 lifetime" model), we'd see:
//   actual_lifetime_messages > messages_used
// on multiple users.

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// All free users with a usage_tracking row
const users = await prisma.user.findMany({
  where: {
    subscriptions: { some: { plan: "Free" } },
    role: { not: "admin" },
  },
  select: {
    id: true, email: true, created_at: true,
    subscriptions: { select: { plan: true, current_period_start: true, current_period_end: true }, take: 1 },
    usageTracking: { select: { id: true, messages_used: true, messages_limit: true, month: true, year: true }, orderBy: { id: "desc" } },
  },
});

console.log(`Auditing ${users.length} free users...\n`);

let discrepancies = [];
let multiRows = [];
let overLimit = [];
let matches = 0;

for (const u of users) {
  // Count actual user-role messages sent by this user across ALL conversations
  const lifetime = await prisma.message.count({
    where: {
      role: "user",
      conversation: { user_id: u.id },
    },
  });

  const rows = u.usageTracking;
  const latest = rows[0];
  const trackedUsed = latest?.messages_used ?? 0;

  // Note: the topup we just ran increased messages_limit by 20 for these
  // users. So "expected limit" is base 20 + 20 topup = 40. Anything else
  // gets flagged.
  const expectedLimit = 40; // post-topup

  if (rows.length > 1) {
    multiRows.push({ email: u.email, rowCount: rows.length, rows: rows.map(r => ({ id: r.id, used: r.messages_used, limit: r.messages_limit, month: r.month, year: r.year })) });
  }

  if (latest && latest.messages_limit !== expectedLimit) {
    overLimit.push({ email: u.email, limit: latest.messages_limit });
  }

  // The key check: does the tracked counter match reality?
  // Allow a small tolerance for concurrency edge cases.
  if (Math.abs(lifetime - trackedUsed) > 1) {
    discrepancies.push({
      email: u.email,
      lifetime_actual: lifetime,
      messages_used_tracked: trackedUsed,
      delta: lifetime - trackedUsed,
      rowCount: rows.length,
    });
  } else {
    matches += 1;
  }
}

console.log(`\n===== RESULTS =====\n`);
console.log(`Users where tracked = actual (within 1):  ${matches}`);
console.log(`Users with DISCREPANCY (tracker < reality): ${discrepancies.length}`);
console.log(`Users with >1 usage_tracking rows:         ${multiRows.length}`);
console.log(`Users with unexpected messages_limit:      ${overLimit.length}`);

if (discrepancies.length) {
  console.log(`\n--- Discrepancies (top 20 by delta) ---`);
  discrepancies.sort((a, b) => b.delta - a.delta);
  for (const d of discrepancies.slice(0, 20)) {
    console.log(`  ${d.email.padEnd(38)}  actual=${d.lifetime_actual}  tracked=${d.messages_used_tracked}  delta=+${d.delta}  rows=${d.rowCount}`);
  }
}

if (multiRows.length) {
  console.log(`\n--- Users with multiple usage_tracking rows (top 10) ---`);
  for (const m of multiRows.slice(0, 10)) {
    console.log(`  ${m.email}  (${m.rowCount} rows)`);
    for (const r of m.rows) {
      console.log(`    row ${r.id}: used=${r.used}/${r.limit}  month=${r.month}/${r.year}`);
    }
  }
}

if (overLimit.length) {
  console.log(`\n--- Users with unexpected messages_limit (top 10) ---`);
  for (const o of overLimit.slice(0, 10)) {
    console.log(`  ${o.email}  limit=${o.limit}`);
  }
}

await prisma.$disconnect();
