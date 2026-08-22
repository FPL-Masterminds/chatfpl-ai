// Sets the current usage_tracking row for one or more users to 999999.
// Belt-and-braces alongside the isAdmin bypass in /api/chat and /api/devchat.
//
// Usage: node scripts/set-admin-unlimited.mjs <email1> [email2 ...]

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const emails = process.argv.slice(2);
if (!emails.length) { console.error("usage: node scripts/set-admin-unlimited.mjs <email...>"); process.exit(1); }

for (const email of emails) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) { console.log(`skip ${email}: not found`); continue; }

  const usage = await prisma.usageTracking.findFirst({
    where: { user_id: user.id },
    orderBy: { id: "desc" },
  });

  if (usage) {
    await prisma.usageTracking.update({
      where: { id: usage.id },
      data: { messages_limit: 999999 },
    });
    console.log(`${email}: updated row ${usage.id} -> limit 999999 (used ${usage.messages_used})`);
  } else {
    const now = new Date();
    const created = await prisma.usageTracking.create({
      data: {
        user_id: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        messages_used: 0,
        messages_limit: 999999,
      },
    });
    console.log(`${email}: created row ${created.id} -> limit 999999`);
  }
}

await prisma.$disconnect();
