// End-to-end test for the cross-device pending_upgrade payment flow.
//
// Simulates: user clicks Premium/Elite on homepage → signup → verify email
// on a different device (no localStorage) → confirms the intent survives
// via the users.pending_upgrade DB column and shows up as ?upgrade= in the
// login redirect.
//
// Requires `next dev` running on http://localhost:3000.
//
// Usage:  node scripts/test-pending-upgrade-flow.mjs

import { config as loadEnv } from "dotenv";
loadEnv();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const TEST_EMAIL = `pending-upgrade-test-${Date.now()}@chatfpl.test`;
const TEST_NAME = "Pending Upgrade Test";
const TEST_PASSWORD = "Password12345!";

function pass(msg) { console.log(`  \u001b[32m✓\u001b[0m ${msg}`); }
function fail(msg) { console.log(`  \u001b[31m✗\u001b[0m ${msg}`); process.exitCode = 1; }

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

async function run() {
  console.log(`\nTesting flow for ${TEST_EMAIL}\n`);

  // Make sure a previous failed run isn't lingering.
  await cleanup();

  // 1. Signup with upgrade=Premium
  console.log("1. POST /api/signup with upgrade='Premium'");
  const signupRes = await fetch(`${BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
      upgrade: "Premium",
    }),
  });
  if (!signupRes.ok) {
    const t = await signupRes.text();
    fail(`signup HTTP ${signupRes.status}: ${t}`);
    await cleanup();
    return;
  }
  pass(`signup returned ${signupRes.status}`);

  // 2. Verify pending_upgrade was persisted
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) { fail("user not found in DB"); await cleanup(); return; }
  if (user.pending_upgrade === "Premium") {
    pass(`users.pending_upgrade = "Premium" persisted`);
  } else {
    fail(`users.pending_upgrade expected "Premium", got ${JSON.stringify(user.pending_upgrade)}`);
  }
  if (!user.emailVerificationToken) {
    fail("no verification token generated");
    await cleanup();
    return;
  }
  pass(`verification token generated`);

  // 3. Hit the verify-email endpoint (simulates the user clicking the link
  //    in the email, potentially on a different device with no localStorage).
  console.log("\n2. GET /api/verify-email?token=<x>  (simulates cross-device click)");
  const verifyRes = await fetch(`${BASE}/api/verify-email?token=${user.emailVerificationToken}`, {
    redirect: "manual",
  });
  const location = verifyRes.headers.get("location");
  if (verifyRes.status !== 302 && verifyRes.status !== 307) {
    fail(`expected 302/307, got ${verifyRes.status}`);
  } else {
    pass(`verify-email returned ${verifyRes.status}`);
  }
  if (!location) {
    fail("no Location header");
    await cleanup();
    return;
  }
  pass(`redirect Location: ${location}`);

  const url = new URL(location, BASE);
  if (url.pathname !== "/login") fail(`expected /login, got ${url.pathname}`);
  else pass(`redirect targets /login`);

  const upgradeParam = url.searchParams.get("upgrade");
  if (upgradeParam === "Premium") {
    pass(`redirect includes upgrade=Premium (the whole point of this feature)`);
  } else {
    fail(`redirect missing upgrade=Premium, got ${JSON.stringify(upgradeParam)}`);
  }

  // 4. Confirm email is now marked verified but pending_upgrade is still set
  //    (it's cleared later, at Stripe checkout time, not at verify time).
  const afterVerify = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (afterVerify?.emailVerified) pass(`emailVerified was set`);
  else fail(`emailVerified was not set`);

  if (afterVerify?.pending_upgrade === "Premium") {
    pass(`pending_upgrade still set post-verify (will be consumed by checkout)`);
  } else {
    fail(`pending_upgrade was ${JSON.stringify(afterVerify?.pending_upgrade)}, expected "Premium"`);
  }

  // 5. Belt-and-braces: signup without upgrade param should NOT set the field.
  console.log("\n3. Regression: signup without upgrade= should leave pending_upgrade null");
  const controlEmail = `pending-upgrade-control-${Date.now()}@chatfpl.test`;
  const controlRes = await fetch(`${BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: controlEmail,
      password: TEST_PASSWORD,
      name: "Control",
    }),
  });
  if (!controlRes.ok) fail(`control signup HTTP ${controlRes.status}`);
  const control = await prisma.user.findUnique({ where: { email: controlEmail } });
  if (control?.pending_upgrade == null) pass(`control user has pending_upgrade = null`);
  else fail(`control user has pending_upgrade = ${JSON.stringify(control?.pending_upgrade)}`);

  // 6. Malicious payload check: only "Premium" or "Elite" should be accepted.
  console.log("\n4. Security: an unexpected upgrade value must be rejected");
  const badEmail = `pending-upgrade-bad-${Date.now()}@chatfpl.test`;
  await fetch(`${BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: badEmail,
      password: TEST_PASSWORD,
      name: "Bad",
      upgrade: "Enterprise", // not a real plan
    }),
  });
  const bad = await prisma.user.findUnique({ where: { email: badEmail } });
  if (bad?.pending_upgrade == null) pass(`bogus upgrade value ignored`);
  else fail(`bogus upgrade stored as ${JSON.stringify(bad?.pending_upgrade)}`);

  // Clean up all three test users
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_EMAIL, controlEmail, badEmail] } },
  });
  console.log(`\n  cleaned up 3 test users`);
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
