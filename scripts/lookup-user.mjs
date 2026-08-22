import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) { console.error("usage: node scripts/lookup-user.mjs <email>"); process.exit(1); }

const u = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true, email: true, name: true, role: true,
    emailVerified: true, marketing_opt_out: true,
    unsubscribe_token: true, created_at: true,
    subscriptions: {
      select: { plan: true, status: true, current_period_end: true },
      take: 1,
    },
  },
});

console.log(JSON.stringify(u, null, 2));
await prisma.$disconnect();
