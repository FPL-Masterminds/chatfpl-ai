import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const email = process.argv[2];
const value = process.argv[3] === "true";
if (!email) { console.error("usage: node scripts/set-opt-out.mjs <email> <true|false>"); process.exit(1); }
const u = await prisma.user.update({
  where: { email },
  data: { marketing_opt_out: value },
  select: { email: true, marketing_opt_out: true },
});
console.log(JSON.stringify(u, null, 2));
await prisma.$disconnect();
