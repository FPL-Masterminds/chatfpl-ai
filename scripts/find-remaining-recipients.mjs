// Reconciles the cohort file against Resend's send history to work out
// who has NOT yet received the campaign email.

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import fs from "node:fs";

const apiKey = process.env.RESEND_API_KEY;
const CAMPAIGN_SUBJECT = "20 free ChatFPL AI messages on the house, and a quick fix update";

// Fetch all emails from Resend (paginate through pages if needed).
const allSent = [];
let cursor = null;
for (let i = 0; i < 20; i++) {
  const url = new URL("https://api.resend.com/emails");
  url.searchParams.set("limit", "100");
  if (cursor) url.searchParams.set("after", cursor);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) { console.error(`HTTP ${res.status}: ${await res.text()}`); break; }
  const body = await res.json();
  const items = body?.data ?? [];
  if (!items.length) break;
  allSent.push(...items);
  const last = items[items.length - 1];
  if (!last?.id) break;
  cursor = last.id;
  if (items.length < 100) break;
}

const today = new Date().toISOString().slice(0, 10);
const sentToday = allSent.filter((e) => (e.created_at ?? "").startsWith(today) && e.subject === CAMPAIGN_SUBJECT);
const recipientsSent = new Set();
for (const e of sentToday) {
  const to = Array.isArray(e.to) ? e.to[0] : e.to;
  if (to) recipientsSent.add(to.toLowerCase());
}

const cohort = fs
  .readFileSync("scripts/data/campaign-2026-08-22.txt", "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const remaining = cohort.filter((e) => !recipientsSent.has(e));

console.log(`Cohort:    ${cohort.length}`);
console.log(`Sent today (this subject): ${recipientsSent.size}`);
console.log(`Remaining: ${remaining.length}`);

fs.writeFileSync("scripts/data/campaign-2026-08-22-remaining.txt", remaining.join("\n") + "\n");
console.log(`\nWrote scripts/data/campaign-2026-08-22-remaining.txt`);
