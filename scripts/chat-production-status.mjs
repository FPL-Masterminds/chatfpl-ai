#!/usr/bin/env node
/**
 * Production chat status for humans and Cursor agents.
 * Usage: node scripts/chat-production-status.mjs
 * Optional: CHAT_HEALTH_URL=https://www.chatfpl.ai/api/health/chat
 */

const HEALTH_URL =
  process.env.CHAT_HEALTH_URL ?? "https://www.chatfpl.ai/api/health/chat";

const DEPLOY_WAIT_MS = Number(process.env.CHAT_HEALTH_WAIT_MS ?? "0");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (DEPLOY_WAIT_MS > 0) {
    console.log(`Waiting ${DEPLOY_WAIT_MS}ms for Vercel deploy...`);
    await sleep(DEPLOY_WAIT_MS);
  }

  let res;
  try {
    res = await fetch(HEALTH_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Status: Chat Offline");
    console.log(`Reason: health request failed (${message})`);
    console.log(`URL: ${HEALTH_URL}`);
    process.exit(1);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    console.log("Status: Chat Offline");
    console.log(`Reason: health returned non-JSON (HTTP ${res.status})`);
    process.exit(1);
  }

  const label = data.label ?? (data.status === "online" ? "Chat Online" : "Chat Offline");
  const line = data.status === "online" ? "Status: Chat Online" : "Status: Chat Offline";

  console.log(line);
  console.log(`HTTP ${res.status} | ${label} | deep=${Boolean(data.deep)}`);
  console.log(`Checked: ${data.checked_at ?? "unknown"}`);

  if (data.failed_checks?.length) {
    console.log(`Failed checks: ${data.failed_checks.join(", ")}`);
  }
  for (const [name, result] of Object.entries(data.checks ?? {})) {
    if (!result?.ok) {
      console.log(`  - ${name}: ${result.detail ?? "failed"}`);
    }
  }

  if (data.status !== "online") {
    process.exit(1);
  }
}

main();
