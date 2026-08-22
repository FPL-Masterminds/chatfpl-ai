// Fetches today's Resend send history to see what burned the daily quota.

import { config } from "dotenv";
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error("No RESEND_API_KEY"); process.exit(1); }

// Resend list endpoint: GET /emails
// Returns up to 100 per page by default
const res = await fetch("https://api.resend.com/emails?limit=100", {
  headers: { Authorization: `Bearer ${apiKey}` },
});

if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const body = await res.json();
const items = body?.data ?? body ?? [];
console.log(`Total returned: ${items.length}`);

const today = new Date().toISOString().slice(0, 10);
const todaysItems = items.filter((e) => (e.created_at ?? "").startsWith(today));

console.log(`\nToday (${today}) count: ${todaysItems.length}`);
const bySubject = {};
for (const e of todaysItems) {
  bySubject[e.subject ?? "?"] = (bySubject[e.subject ?? "?"] ?? 0) + 1;
}
console.log(`\nBreakdown by subject:`);
for (const [s, n] of Object.entries(bySubject).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${s}`);
}
