import { config as loadEnv } from "dotenv";
loadEnv();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rating = process.argv[2] === "positive" ? "positive" : "negative";

const rows = await prisma.messageFeedback.findMany({
  where: { rating },
  orderBy: { submitted_at: "desc" },
  take: 25,
});

const total = await prisma.messageFeedback.count({ where: { rating } });
console.log(`Total ${rating} in message_feedback: ${total}\n`);

for (const r of rows) {
  console.log(`${r.submitted_at.toISOString()} [${r.rating}]`);
  console.log(`  user: ${r.user_name ?? "(unknown)"} <${r.user_email ?? "n/a"}>`);
  if (r.user_prompt) {
    console.log(`  prompt: ${r.user_prompt.slice(0, 200)}${r.user_prompt.length > 200 ? "..." : ""}`);
  }
  console.log(
    `  reply: ${r.assistant_content.slice(0, 280)}${r.assistant_content.length > 280 ? "..." : ""}\n`,
  );
}

await prisma.$disconnect();
