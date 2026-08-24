// One-off "we fixed the upgrade flow" nudge.
//
// Usage:
//   node scripts/send-upgrade-nudge.mjs <email1> [email2 ...]           # send
//   node scripts/send-upgrade-nudge.mjs --dry-run <email1> [email2 ...] # preview
//
// Rules baked in so this is safe to reuse for a broader campaign later:
//   - Skips any recipient whose users.marketing_opt_out is true
//   - Skips anyone without an unsubscribe_token (backfill if you see this)
//   - Passes the recipient's token to wrapEmailContent so the footer
//     renders a one-click Unsubscribe link (PECR requirement)
//   - Uses first name in the greeting when available, "there" as fallback

import { config } from "dotenv";
// Load in order of preference: .env.local overrides .env.vercel.prod overrides .env.
// Resend/Stripe keys live in .env.vercel.prod locally.
config({ path: ".env.vercel.prod" });
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import fs from "node:fs";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Inline copy of lib/email-templates.wrapEmailContent so this script can
// run under plain node without a TS loader. Kept in sync manually.
const LOGO_URL = "https://chatfpl.ai/ChatFPL_AI_Logo.png";
const SITE_URL = "https://chatfpl.ai";
function wrapEmailContent(content, opts) {
  const unsubscribeUrl = opts?.unsubscribeToken
    ? `${SITE_URL}/api/unsubscribe?token=${opts.unsubscribeToken}`
    : `${SITE_URL}/account`;
  const unsubscribeLabel = opts?.unsubscribeToken ? "Unsubscribe" : "Manage email preferences";
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #00FF87; color: #2E0032; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div style="background: #FFFFFF; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="${LOGO_URL}" alt="ChatFPL AI" style="height: 50px; margin-bottom: 15px;" />
    </div>
    <div class="content">${content}</div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0;">
      <p>&copy; 2026 ChatFPL.ai - AI-Powered Fantasy Premier League Assistant</p>
      <p style="margin-top: 10px;">
        <a href="${SITE_URL}" style="color: #00FF86; text-decoration: none;">Visit Website</a> |
        <a href="${SITE_URL}/terms" style="color: #00FF86; text-decoration: none;">Terms</a> |
        <a href="${SITE_URL}/privacy" style="color: #00FF86; text-decoration: none;">Privacy</a> |
        <a href="${unsubscribeUrl}" style="color: #00FF86; text-decoration: none;">${unsubscribeLabel}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileIdx = args.indexOf("--file");
const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;

const flagSet = new Set(["--dry-run", "--file", filePath ?? ""]);
let emails = args.filter((a) => !flagSet.has(a) && !a.startsWith("--"));

if (filePath) {
  const fromFile = fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  emails = emails.concat(fromFile);
}

if (!emails.length) {
  console.error("usage: node scripts/send-upgrade-nudge.mjs [--dry-run] <email> [email2 ...]");
  console.error("       node scripts/send-upgrade-nudge.mjs [--dry-run] --file cohort.txt");
  process.exit(1);
}

function buildContent(firstName) {
  const hi = firstName ? firstName : "there";
  return `
    <h2 style="color: #2E0032; margin-top: 0;">Quick heads-up, ${hi}</h2>
    <p>When you signed up to ChatFPL AI, something wasn't working the way it should. The "Upgrade to Premium" and "Upgrade to Elite" buttons were quietly bouncing members to the sign-up page instead of the Upgrade page. That's now fixed.</p>
    <p style="background: #F0FFF6; border-left: 3px solid #00FF87; padding: 12px 16px; margin: 20px 0; color: #2E0032;">
      As a small apology for the inconvenience, we've added <strong>20 free ChatFPL AI messages</strong> to your account. They sit on top of whatever you've already got, so if you've used them all you now have 20 fresh ones, and if you've barely used them you've got 20 extra.
    </p>
    <p>If you'd been running on the free plan and were thinking about going deeper, here's the lay of the land:</p>
    <p style="margin: 20px 0 4px;"><strong>Premium - £7.99 / month</strong></p>
    <ul style="margin: 0 0 16px 20px; padding: 0; color: #333;">
      <li>100 AI messages per month</li>
      <li>Live FPL data plugged into every reply</li>
      <li>Full dashboard access - your team, mini-leagues and chip tracker</li>
    </ul>
    <p style="margin: 20px 0 4px;"><strong>Elite - £14.99 / month</strong></p>
    <ul style="margin: 0 0 16px 20px; padding: 0; color: #333;">
      <li>500 AI messages per month</li>
      <li>Priority AI, on top of everything in Premium</li>
      <li>Built for anyone running multiple teams or a serious mini-league</li>
    </ul>
    <p>You can grab either plan from your account page in one click:</p>
    <div style="text-align: center;">
      <a href="https://chatfpl.ai/admin" class="button">Take me to my account</a>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 24px;">You're always in control - manage or change your plan whenever you like from your account.</p>
    <p style="margin-top: 24px;">Cheers,<br/><strong>The ChatFPL AI team</strong></p>
  `;
}

const results = { sent: [], skipped: [], failed: [] };

for (const email of emails) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      role: true,
      marketing_opt_out: true,
      unsubscribe_token: true,
      emailVerified: true,
      subscriptions: { select: { plan: true }, orderBy: { id: "desc" }, take: 1 },
    },
  });

  if (!user) { results.skipped.push({ email, reason: "not found" }); continue; }
  if (!user.emailVerified) { results.skipped.push({ email, reason: "unverified" }); continue; }
  if (user.role === "admin") { results.skipped.push({ email, reason: "admin" }); continue; }
  const plan = user.subscriptions[0]?.plan ?? "Unknown";
  if (plan !== "Free") { results.skipped.push({ email, reason: `plan=${plan}` }); continue; }
  if (user.marketing_opt_out) { results.skipped.push({ email, reason: "opted out" }); continue; }
  if (!user.unsubscribe_token) { results.skipped.push({ email, reason: "no token - run backfill" }); continue; }

  const firstName = user.name?.split(" ")[0] ?? null;
  const html = wrapEmailContent(buildContent(firstName), {
    unsubscribeToken: user.unsubscribe_token,
  });

  if (dryRun) {
    console.log(`--- DRY RUN: would send to ${email} (${firstName ?? "no name"}) ---`);
    console.log(html.slice(0, 400) + "...\n");
    results.sent.push({ email, id: "dry-run" });
    continue;
  }

  try {
    const r = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
      to: email,
      subject: "20 free ChatFPL AI messages on the house, and a quick fix update",
      html,
    });
    if (r?.error) throw r.error;
    console.log(`sent to ${email} (id: ${r?.data?.id ?? "unknown"})`);
    results.sent.push({ email, id: r?.data?.id });
  } catch (err) {
    console.error(`FAILED for ${email}:`, err?.message ?? err);
    results.failed.push({ email, error: err?.message ?? String(err) });
  }
}

await prisma.$disconnect();
console.log("\n===== summary =====");
console.log(`sent:    ${results.sent.length}`);
console.log(`skipped: ${results.skipped.length}`);
console.log(`failed:  ${results.failed.length}`);
if (results.skipped.length) console.log("skipped:", results.skipped);
if (results.failed.length) console.log("failed:", results.failed);
