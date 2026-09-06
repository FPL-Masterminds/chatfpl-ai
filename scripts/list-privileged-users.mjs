import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: {
    email: true,
    name: true,
    role: true,
    subscriptions: { take: 1, orderBy: { id: "desc" }, select: { plan: true } },
    usageTracking: { take: 1, orderBy: { id: "desc" }, select: { messages_limit: true, messages_used: true } },
  },
  orderBy: { email: "asc" },
});

const interesting = users.filter((u) => {
  const plan = u.subscriptions[0]?.plan ?? "";
  const limit = u.usageTracking[0]?.messages_limit ?? 0;
  return u.role === "admin" || plan.toLowerCase() === "admin" || plan.toLowerCase() === "vip" || limit === 100;
});

console.log(`Privileged / VIP-style users: ${interesting.length}\n`);
for (const u of interesting) {
  const plan = u.subscriptions[0]?.plan ?? "?";
  const usage = u.usageTracking[0];
  console.log(
    `${u.email} | role=${u.role} | plan=${plan} | ${usage?.messages_used ?? 0}/${usage?.messages_limit ?? "?"} msgs`,
  );
}

await prisma.$disconnect();
