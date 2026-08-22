import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const email = process.argv[2];
const u = await p.user.findUnique({
  where: { email },
  select: {
    email: true, bonus_topup_at: true, bonus_topup_amount: true,
    usageTracking: { orderBy: { id: "desc" }, take: 1, select: { messages_used: true, messages_limit: true } },
  },
});

console.log(JSON.stringify(u, null, 2));
await p.$disconnect();
