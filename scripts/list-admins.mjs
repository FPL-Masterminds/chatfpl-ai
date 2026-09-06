import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const admins = await prisma.user.findMany({
  where: { role: "admin" },
  select: {
    email: true,
    name: true,
    role: true,
    subscriptions: { take: 1, orderBy: { id: "desc" }, select: { plan: true } },
    usageTracking: { take: 1, orderBy: { id: "desc" }, select: { messages_limit: true } },
  },
  orderBy: { email: "asc" },
});

console.log(`Users with role=admin: ${admins.length}\n`);
for (const u of admins) {
  console.log(
    `${u.email} | ${u.name ?? "(no name)"} | plan=${u.subscriptions[0]?.plan ?? "?"} | limit=${u.usageTracking[0]?.messages_limit ?? "?"}`,
  );
}

await prisma.$disconnect();
