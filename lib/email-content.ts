/**
 * Shared HTML bodies for every email ChatFPL sends.
 * Used by API routes and the private /devemails preview gallery.
 */

const SITE_URL = "https://www.chatfpl.ai"

export const SAMPLE_PREVIEW = {
  name: "Alex",
  firstName: "Alex",
  email: "alex@example.com",
  verificationUrl: `${SITE_URL}/api/verify-email?token=sample-verification-token`,
  resetUrl: `${SITE_URL}/reset-password?token=sample-reset-token`,
  unsubscribeToken: "sample-unsubscribe-token",
  adminEmail: "chatfplai@gmail.com",
  triggeredAt: "2026-09-06T12:00:00.000Z",
}

export function buildSignupVerificationContent(opts: {
  name: string
  verificationUrl: string
}) {
  return `
    <h2 style="color: #2E0032;">Welcome to ChatFPL AI, ${opts.name}! 🎉</h2>
    <p>Thanks for signing up. Please verify your email address to start using your <strong>20 free messages</strong>.</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">✅ <strong>Your Free Trial Includes:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
        <li>20 AI-powered FPL messages</li>
        <li>Live data access</li>
        <li>Earn more messages by sharing</li>
      </ul>
    </div>
    <p>Click the button below to verify your email and start chatting:</p>
    <div style="text-align: center;">
      <a href="${opts.verificationUrl}" class="button">Verify Email & Start Chatting</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #666; font-size: 14px; word-break: break-all;">${opts.verificationUrl}</p>
    <p style="color: #999; font-size: 12px; margin-top: 30px;">⏰ This link will expire in 24 hours.</p>
    <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
  `
}

export function buildResendVerificationContent(opts: { verificationUrl: string }) {
  return `
    <h2 style="color: #2E0032;">Verify Your Email</h2>
    <p>You requested a new verification link for your ChatFPL AI account.</p>
    <p>Click the button below to verify your email and start chatting:</p>
    <div style="text-align: center;">
      <a href="${opts.verificationUrl}" class="button">Verify Email & Start Chatting</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #666; font-size: 14px; word-break: break-all;">${opts.verificationUrl}</p>
    <p style="color: #999; font-size: 12px; margin-top: 30px;">⏰ This link will expire in 24 hours.</p>
    <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
  `
}

export function buildPasswordResetContent(opts: { name?: string | null; resetUrl: string }) {
  return `
    <h2 style="color: #2E0032;">Reset Your Password</h2>
    <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
    <p>We received a request to reset your ChatFPL AI password. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="${opts.resetUrl}" class="button">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px;">${opts.resetUrl}</p>
    <p><strong>⏰ This link will expire in 1 hour.</strong></p>
    <p style="color: #999; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
    <p style="margin-top: 30px;">Thanks,<br><strong>The ChatFPL AI Team</strong></p>
  `
}

export function buildAdminSignupNotificationContent(opts: {
  userName?: string | null
  userEmail: string
  plan: "Free" | "Premium" | "Elite" | string
}) {
  const plan = opts.plan
  let subjectEmoji = "👤"
  let message = "A new user has signed up."

  if (plan === "Free") {
    subjectEmoji = "🆓"
    message = "A new user has signed up for the Free trial (20 messages)."
  } else if (plan === "Premium") {
    subjectEmoji = "💰"
    message = "A new user has subscribed to the Premium plan (£7.99/month, 100 messages)."
  } else if (plan === "Elite") {
    subjectEmoji = "🏆"
    message = "A new user has subscribed to the Elite plan (£14.99/month, 500 messages)."
  }

  const subjectLabel =
    plan === "Free"
      ? "New Free User Signup"
      : plan === "Premium"
        ? "New Premium Subscriber!"
        : plan === "Elite"
          ? "New Elite Subscriber!"
          : "New User Signup"

  return {
    subject: `${subjectEmoji} ${subjectLabel}`,
    content: `
      <h2 style="color: #2E0032;">${subjectEmoji} ${subjectLabel}</h2>
      <p>${message}</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">User Details</h3>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${opts.userName || "Not provided"}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${opts.userEmail}</p>
        <p style="margin: 8px 0;"><strong>Plan:</strong> ${plan}</p>
        ${plan !== "Free" ? `<p style="margin: 8px 0;"><strong>💵 Revenue Impact:</strong> +£${plan === "Premium" ? "7.99" : "14.99"}/month</p>` : ""}
      </div>

      ${plan !== "Free"
        ? `
      <div style="background: linear-gradient(135deg, #00FF86 0%, #00FFFF 100%); padding: 15px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #2E0032; font-size: 18px; font-weight: bold;">
          💰 New Revenue: £${plan === "Premium" ? "7.99" : "14.99"}/month
        </p>
      </div>
      `
        : ""}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${SITE_URL}/admin" 
           style="display: inline-block; background-color: #00FF86; color: #2E0032; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Admin Dashboard
        </a>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This is an automated notification from ChatFPL.ai.
      </p>
    `,
  }
}

export function buildRewardClaimNotificationContent(opts: {
  userName?: string | null
  userEmail: string
  actionType: string
  rewardMessages: number
  proofUrl?: string | null
}) {
  const actionLabel = opts.actionType.charAt(0).toUpperCase() + opts.actionType.slice(1)

  return {
    subject: `🎁 New Reward Claim: ${opts.actionType} (${opts.rewardMessages} messages)`,
    content: `
      <h2 style="color: #2E0032;">🎁 New Reward Claim Submitted</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">User Details</h3>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${opts.userName || "Not provided"}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${opts.userEmail}</p>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">Claim Details</h3>
        <p style="margin: 8px 0;"><strong>Action Type:</strong> ${actionLabel}</p>
        <p style="margin: 8px 0;"><strong>Reward Amount:</strong> ${opts.rewardMessages} messages</p>
        ${opts.proofUrl ? `<p style="margin: 8px 0;"><strong>Proof URL:</strong> <a href="${opts.proofUrl}" target="_blank" style="color: #00FF86; word-break: break-all;">${opts.proofUrl}</a></p>` : ""}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${SITE_URL}/admin" class="button">
          Review in Admin Dashboard
        </a>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This is an automated notification from ChatFPL.ai. Log into your admin dashboard to approve or reject this claim.
      </p>
    `,
  }
}

export function buildAdminTestEmailContent(opts: {
  adminName?: string | null
  adminEmail: string
  triggeredAt: string
}) {
  return `
    <h2 style="color: #2E0032;">✅ ChatFPL AI Admin Test Email</h2>
    <p>This is a manual test from the <strong>/api/admin/test-email</strong> endpoint.</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Triggered by:</strong> ${opts.adminName || "Admin User"}</p>
      <p style="margin: 8px 0;"><strong>Admin email target:</strong> ${opts.adminEmail}</p>
      <p style="margin: 8px 0;"><strong>Triggered at:</strong> ${opts.triggeredAt}</p>
    </div>
    <p style="color: #999; font-size: 12px; margin-top: 30px;">
      If you received this, Resend + env configuration is working for admin notifications.
    </p>
  `
}

export function buildUpgradeNudgeContent(firstName: string | null) {
  const hi = firstName ? firstName : "there"
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
      <a href="${SITE_URL}/admin" class="button">Take me to my account</a>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 24px;">You're always in control - manage or change your plan whenever you like from your account.</p>
    <p style="margin-top: 24px;">Cheers,<br/><strong>The ChatFPL AI team</strong></p>
  `
}

/** Draft template for product update / feature announcement campaigns. */
export function buildProductUpdateContent(firstName: string | null) {
  const hi = firstName ? firstName : "there"
  return `
    <h2 style="color: #2E0032; margin-top: 0;">ChatFPL AI keeps getting better, ${hi}</h2>
    <p>Since we launched in 2025, we've been shipping improvements every week. Here's what's new on <a href="${SITE_URL}" style="color: #00FF86;">ChatFPL AI</a>:</p>

    <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-weight: bold; color: #2E0032;">Smarter chat experience</p>
      <ul style="margin: 0; padding-left: 20px; color: #444;">
        <li>Copy, share, rate, and read replies aloud on every assistant message</li>
        <li>Voice input and read-aloud for hands-free FPL planning</li>
        <li>Cleaner formatting for Reddit threads, comparisons, and player photos</li>
      </ul>
    </div>

    <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-weight: bold; color: #2E0032;">More ways to research your team</p>
      <ul style="margin: 0; padding-left: 20px; color: #444;">
        <li>Redesigned Teams hub with live form and fixture context</li>
        <li>Season Story recaps for your mini-leagues</li>
        <li>Expanded player, captain, differential, and comparison pages</li>
      </ul>
    </div>

    <p>If you haven't logged in for a while, your account is still there with your message balance. Jump back in and try a question:</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}/chat" class="button">Open ChatFPL AI</a>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 24px;">Want more messages each month? Premium and Elite plans are one click away from your account page.</p>
    <p style="margin-top: 24px;">Cheers,<br/><strong>The ChatFPL AI team</strong></p>
  `
}

export type EmailPreviewGroup = "user" | "admin" | "marketing"

export type EmailPreviewItem = {
  id: string
  group: EmailPreviewGroup
  label: string
  description: string
  subject: string
  audience: string
  respectsOptOut: boolean
  includeUnsubscribe: boolean
  html: string
}

export type EmailPreviewDefinition = EmailPreviewItem & {
  buildBody: () => string
}

export const EMAIL_PREVIEW_DEFINITIONS: EmailPreviewDefinition[] = [
  {
    id: "signup-verification",
    group: "user",
    label: "Signup verification",
    description: "Sent immediately after a new user creates an account.",
    subject: "Welcome to ChatFPL AI - Verify Your Email 🎉",
    audience: "New user",
    respectsOptOut: false,
    includeUnsubscribe: true,
    buildBody: () =>
      buildSignupVerificationContent({
        name: SAMPLE_PREVIEW.name,
        verificationUrl: SAMPLE_PREVIEW.verificationUrl,
      }),
  },
  {
    id: "resend-verification",
    group: "user",
    label: "Resend verification",
    description: "Sent when a user requests a fresh verification link.",
    subject: "Verify your ChatFPL AI email",
    audience: "Unverified user",
    respectsOptOut: false,
    includeUnsubscribe: true,
    buildBody: () =>
      buildResendVerificationContent({
        verificationUrl: SAMPLE_PREVIEW.verificationUrl,
      }),
  },
  {
    id: "password-reset",
    group: "user",
    label: "Password reset",
    description: "Sent when a user submits the forgot-password form.",
    subject: "Reset Your ChatFPL AI Password",
    audience: "Existing user",
    respectsOptOut: false,
    includeUnsubscribe: true,
    buildBody: () =>
      buildPasswordResetContent({
        name: SAMPLE_PREVIEW.name,
        resetUrl: SAMPLE_PREVIEW.resetUrl,
      }),
  },
  {
    id: "admin-signup-free",
    group: "admin",
    label: "Admin: free signup",
    description: "Internal alert when someone joins on the Free plan.",
    subject: "🆓 New Free User Signup",
    audience: "Site owner",
    respectsOptOut: false,
    includeUnsubscribe: false,
    buildBody: () =>
      buildAdminSignupNotificationContent({
        userName: SAMPLE_PREVIEW.name,
        userEmail: SAMPLE_PREVIEW.email,
        plan: "Free",
      }).content,
  },
  {
    id: "admin-signup-premium",
    group: "admin",
    label: "Admin: Premium signup",
    description: "Internal alert when someone subscribes to Premium.",
    subject: "💰 New Premium Subscriber!",
    audience: "Site owner",
    respectsOptOut: false,
    includeUnsubscribe: false,
    buildBody: () =>
      buildAdminSignupNotificationContent({
        userName: SAMPLE_PREVIEW.name,
        userEmail: SAMPLE_PREVIEW.email,
        plan: "Premium",
      }).content,
  },
  {
    id: "admin-signup-elite",
    group: "admin",
    label: "Admin: Elite signup",
    description: "Internal alert when someone subscribes to Elite.",
    subject: "🏆 New Elite Subscriber!",
    audience: "Site owner",
    respectsOptOut: false,
    includeUnsubscribe: false,
    buildBody: () =>
      buildAdminSignupNotificationContent({
        userName: SAMPLE_PREVIEW.name,
        userEmail: SAMPLE_PREVIEW.email,
        plan: "Elite",
      }).content,
  },
  {
    id: "admin-reward-claim",
    group: "admin",
    label: "Admin: reward claim",
    description: "Internal alert when a user submits a bonus-messages reward claim.",
    subject: "🎁 New Reward Claim: reddit (5 messages)",
    audience: "Site owner",
    respectsOptOut: false,
    includeUnsubscribe: false,
    buildBody: () =>
      buildRewardClaimNotificationContent({
        userName: SAMPLE_PREVIEW.name,
        userEmail: SAMPLE_PREVIEW.email,
        actionType: "reddit",
        rewardMessages: 5,
        proofUrl: "https://www.reddit.com/r/FantasyPL/comments/example",
      }).content,
  },
  {
    id: "admin-test",
    group: "admin",
    label: "Admin: test email",
    description: "Manual Resend smoke test from /api/admin/test-email.",
    subject: "✅ ChatFPL AI Admin Test Email",
    audience: "Site owner",
    respectsOptOut: false,
    includeUnsubscribe: false,
    buildBody: () =>
      buildAdminTestEmailContent({
        adminName: "John",
        adminEmail: SAMPLE_PREVIEW.adminEmail,
        triggeredAt: SAMPLE_PREVIEW.triggeredAt,
      }),
  },
  {
    id: "marketing-upgrade-nudge",
    group: "marketing",
    label: "Marketing: upgrade nudge",
    description: "One-off campaign script (scripts/send-upgrade-nudge.mjs).",
    subject: "20 free ChatFPL AI messages on the house, and a quick fix update",
    audience: "Verified Free users who opted in",
    respectsOptOut: true,
    includeUnsubscribe: true,
    buildBody: () => buildUpgradeNudgeContent(SAMPLE_PREVIEW.firstName),
  },
  {
    id: "marketing-product-update",
    group: "marketing",
    label: "Marketing: product update (draft)",
    description: "Draft template for a feature announcement e-shot. Edit before sending.",
    subject: "What's new on ChatFPL AI",
    audience: "Verified users who opted in to product emails",
    respectsOptOut: true,
    includeUnsubscribe: true,
    buildBody: () => buildProductUpdateContent(SAMPLE_PREVIEW.firstName),
  },
]
