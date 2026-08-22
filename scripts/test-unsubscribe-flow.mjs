// End-to-end test for the unsubscribe flow.
//
// Confirms:
//   - New signups get an unsubscribe_token generated
//   - Existing users are backfilled (assumed done separately)
//   - Hitting /api/unsubscribe?token=<x> flips marketing_opt_out
//   - Hitting a bogus/empty token doesn't blow up
//   - Idempotent - re-hitting the same token is safe
//
// Requires `next dev` running on http://localhost:3000.

import { config as loadEnv } from "dotenv";
loadEnv();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const TEST_EMAIL = `unsub-test-${Date.now()}@chatfpl.test`;

function pass(msg) { console.log(`  \u001b[32m✓\u001b[0m ${msg}`); }
function fail(msg) { console.log(`  \u001b[31m✗\u001b[0m ${msg}`); process.exitCode = 1; }

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

async function run() {
  console.log(`\nTesting unsubscribe for ${TEST_EMAIL}\n`);
  await cleanup();

  // 1. Signup → token should be generated
  const signupRes = await fetch(`${BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: "Password12345!",
      name: "Unsub Test",
    }),
  });
  if (!signupRes.ok) { fail(`signup HTTP ${signupRes.status}`); await cleanup(); return; }
  pass(`signup returned ${signupRes.status}`);

  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) { fail("user not found"); await cleanup(); return; }

  if (user.unsubscribe_token && user.unsubscribe_token.length >= 32) {
    pass(`unsubscribe_token generated (${user.unsubscribe_token.length} chars)`);
  } else {
    fail(`unsubscribe_token missing or too short: ${JSON.stringify(user.unsubscribe_token)}`);
  }

  if (user.marketing_opt_out === false) pass(`marketing_opt_out defaults to false`);
  else fail(`marketing_opt_out unexpected: ${user.marketing_opt_out}`);

  // 2. Hit /api/unsubscribe with the token
  console.log(`\nGET /api/unsubscribe?token=<x>`);
  const unsubRes = await fetch(`${BASE}/api/unsubscribe?token=${user.unsubscribe_token}`, {
    redirect: "manual",
  });
  if (unsubRes.status === 302 || unsubRes.status === 307) pass(`redirect ${unsubRes.status}`);
  else fail(`expected 302/307, got ${unsubRes.status}`);

  const loc = unsubRes.headers.get("location");
  if (loc && new URL(loc, BASE).pathname === "/unsubscribe") pass(`redirects to /unsubscribe`);
  else fail(`unexpected redirect location: ${loc}`);

  const afterUnsub = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (afterUnsub?.marketing_opt_out === true) pass(`marketing_opt_out flipped to true`);
  else fail(`marketing_opt_out still ${afterUnsub?.marketing_opt_out}`);

  // 3. Idempotent - hit the same token again
  const unsubRes2 = await fetch(`${BASE}/api/unsubscribe?token=${user.unsubscribe_token}`, {
    redirect: "manual",
  });
  if (unsubRes2.status === 302 || unsubRes2.status === 307) pass(`second hit also redirects (idempotent)`);
  else fail(`idempotent hit failed: ${unsubRes2.status}`);

  // 4. Bogus token - shouldn't crash, still redirects
  const badRes = await fetch(`${BASE}/api/unsubscribe?token=doesnotexist`, { redirect: "manual" });
  if (badRes.status === 302 || badRes.status === 307) pass(`unknown token redirects gracefully (${badRes.status})`);
  else fail(`unknown token returned ${badRes.status}`);

  // 5. No token - shouldn't crash
  const noRes = await fetch(`${BASE}/api/unsubscribe`, { redirect: "manual" });
  if (noRes.status === 302 || noRes.status === 307) pass(`missing token redirects gracefully`);
  else fail(`missing token returned ${noRes.status}`);

  await cleanup();
  console.log(`\n  cleaned up test user`);
}

run()
  .catch(async (err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(process.exitCode ? "\nFAILED\n" : "\nAll checks passed\n");
  });
