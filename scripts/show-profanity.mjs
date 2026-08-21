import { config as loadEnv } from "dotenv";
loadEnv();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rows = await prisma.profanityFlag.findMany({
  orderBy: { message_at: "desc" },
  take: 25,
});

console.log(`Total in profanity_flags: ${await prisma.profanityFlag.count()}\n`);
for (const r of rows) {
  console.log(`— ${r.message_at.toISOString()}`);
  console.log(`  user: ${r.user_name ?? "(unknown)"} <${r.user_email ?? "n/a"}>`);
  console.log(`  words: ${r.words_matched.join(", ")}`);
  console.log(`  content: ${r.content.slice(0, 240)}${r.content.length > 240 ? "…" : ""}\n`);
}

await prisma.$disconnect();
