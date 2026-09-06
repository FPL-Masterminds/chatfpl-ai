// Preview who would receive a marketing e-shot (GDPR/PECR safe cohort).
//
// Usage:
//   node scripts/preview-marketing-cohort.mjs
//   node scripts/preview-marketing-cohort.mjs --export cohort.txt
//
// Includes only users who:
//   - verified their email
//   - have marketing_opt_out = false
//   - have an unsubscribe_token (required for one-click footer)

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const exportPath = process.argv.includes("--export")
  ? process.argv[process.argv.indexOf("--export") + 1]
  : null;

const users = await prisma.user.findMany({
  where: {
    emailVerified: { not: null },
    marketing_opt_out: false,
    unsubscribe_token: { not: null },
  },
  select: {
    email: true,
    name: true,
    role: true,
    created_at: true,
    subscriptions: { select: { plan: true }, orderBy: { id: "desc" }, take: 1 },
  },
  orderBy: { created_at: "asc" },
});

const optedOut = await prisma.user.count({ where: { marketing_opt_out: true } });
const unverified = await prisma.user.count({ where: { emailVerified: null } });
const missingToken = await prisma.user.count({
  where: { unsubscribe_token: null, marketing_opt_out: false },
});

console.log("Marketing cohort preview");
console.log("========================");
console.log(`Eligible (verified + opted in + token): ${users.length}`);
console.log(`Opted out: ${optedOut}`);
console.log(`Unverified accounts: ${unverified}`);
console.log(`Opted-in but missing unsubscribe token: ${missingToken}`);
console.log("");

for (const user of users.slice(0, 50)) {
  const plan = user.subscriptions[0]?.plan ?? "Unknown";
  console.log(`${user.email} | ${user.name ?? "(no name)"} | ${plan}`);
}

if (users.length > 50) {
  console.log(`... and ${users.length - 50} more`);
}

if (exportPath) {
  fs.writeFileSync(exportPath, users.map((u) => u.email).join("\n") + "\n", "utf8");
  console.log(`\nExported ${users.length} emails to ${exportPath}`);
}

await prisma.$disconnect();
