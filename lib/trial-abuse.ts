import type { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

import {
  buildTrialAbuseSuspicionNotificationContent,
  type TrialAbuseReasonCode,
} from "@/lib/email-content"
import {
  emailLooksAliasHeavy,
  normalizeEmailForAbuseCheck,
} from "@/lib/email-utils"
import type { ClientRequestMeta } from "@/lib/client-request-meta"
import { wrapEmailContent } from "@/lib/email-templates"

const LOOKBACK_DAYS = 120

type SuspectInput = {
  userId: string
  email: string
  normalizedEmail: string
  meta: ClientRequestMeta
}

async function sendAdminTrialAbuseEmail(payload: {
  suspectId: string
  email: string
  normalizedEmail: string | null
  ipAddress: string | null
  reasonCode: TrialAbuseReasonCode
  reasonDetail: string
  relatedUserIds: string[]
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_APT_KEY
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "chatfplai@gmail.com"

  if (!resendApiKey) {
    console.error("Trial abuse alert skipped: missing Resend API key")
    return
  }

  const { subject, content } = buildTrialAbuseSuspicionNotificationContent(payload)
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
    to: adminEmail,
    subject,
    html: wrapEmailContent(content),
  })
}

async function createSuspectIfNew(
  prisma: PrismaClient,
  input: SuspectInput & {
    reasonCode: TrialAbuseReasonCode
    reasonDetail: string
    relatedUserIds: string[]
  },
): Promise<void> {
  const recentDuplicate = await prisma.trialAbuseSuspect.findFirst({
    where: {
      user_id: input.userId,
      reason_code: input.reasonCode,
      created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  if (recentDuplicate) return

  const row = await prisma.trialAbuseSuspect.create({
    data: {
      user_id: input.userId,
      email: input.email,
      normalized_email: input.normalizedEmail,
      ip_address: input.meta.ipAddress,
      reason_code: input.reasonCode,
      reason_detail: input.reasonDetail,
      related_user_ids: input.relatedUserIds.length
        ? JSON.stringify(input.relatedUserIds)
        : null,
      status: "pending",
    },
  })

  try {
    await sendAdminTrialAbuseEmail({
      suspectId: row.id,
      email: input.email,
      normalizedEmail: input.normalizedEmail,
      ipAddress: input.meta.ipAddress,
      reasonCode: input.reasonCode,
      reasonDetail: input.reasonDetail,
      relatedUserIds: input.relatedUserIds,
    })
  } catch (err) {
    console.error("Failed to send trial abuse admin email:", err)
  }
}

/**
 * Log signup metadata and flag likely trial re-registration abuse for manual review.
 * Mirrors FPLEI trial_abuse_suspects rules (no auto-ban).
 */
export async function recordSignupAndEvaluateTrialAbuse(
  prisma: PrismaClient,
  userId: string,
  email: string,
  meta: ClientRequestMeta,
): Promise<void> {
  const normalizedEmail = normalizeEmailForAbuseCheck(email)
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  await prisma.userRegistrationEvent.create({
    data: {
      user_id: userId,
      email,
      normalized_email: normalizedEmail,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    },
  })

  const base: SuspectInput = { userId, email, normalizedEmail, meta }

  const priorByNormalized = await prisma.userRegistrationEvent.findMany({
    where: {
      normalized_email: normalizedEmail,
      user_id: { not: userId },
      created_at: { gte: since },
    },
    select: { user_id: true },
    distinct: ["user_id"],
    take: 20,
  })

  if (priorByNormalized.length > 0) {
    const related = priorByNormalized.map((r) => r.user_id)
    await createSuspectIfNew(prisma, {
      ...base,
      reasonCode: "normalized_email_match",
      reasonDetail:
        `Another account registered recently with the same canonical email (${normalizedEmail}). ` +
        `This often means Gmail dot/plus aliases or the same person signing up again for another 20 free messages.`,
      relatedUserIds: related,
    })
  }

  if (meta.ipAddress) {
    const priorByIp = await prisma.userRegistrationEvent.findMany({
      where: {
        ip_address: meta.ipAddress,
        user_id: { not: userId },
        created_at: { gte: since },
      },
      select: { user_id: true, email: true },
      distinct: ["user_id"],
      take: 20,
    })

    if (priorByIp.length > 0) {
      const related = priorByIp.map((r) => r.user_id)
      const otherEmails = priorByIp.map((r) => r.email).join(", ")
      await createSuspectIfNew(prisma, {
        ...base,
        reasonCode: "same_ip_reregistration",
        reasonDetail:
          `This signup IP (${meta.ipAddress}) was used for ${priorByIp.length} other account(s) in the last ${LOOKBACK_DAYS} days: ${otherEmails}.`,
        relatedUserIds: related,
      })
    }
  }

  if (emailLooksAliasHeavy(email)) {
    await createSuspectIfNew(prisma, {
      ...base,
      reasonCode: "alias_style_email",
      reasonDetail:
        `Signup email uses common alias patterns (plus-tag or Gmail dots). Canonical form: ${normalizedEmail}.`,
      relatedUserIds: [],
    })
  }

  const otherUserIds = await prisma.userRegistrationEvent.findMany({
    where: { normalized_email: normalizedEmail, user_id: { not: userId } },
    select: { user_id: true },
    distinct: ["user_id"],
    take: 20,
  })

  if (otherUserIds.length > 0) {
    const ids = otherUserIds.map((r) => r.user_id)
    const subs = await prisma.subscription.findMany({
      where: {
        user_id: { in: ids },
        OR: [
          { plan: "Free" },
          {
            status: {
              in: [
                "canceled",
                "past_due",
                "unpaid",
                "incomplete",
                "incomplete_expired",
              ],
            },
          },
        ],
      },
      include: { user: { select: { email: true } } },
    })

    if (subs.length > 0) {
      const related = subs.map((s) => s.user_id)
      const summary = subs
        .map((s) => `${s.user.email ?? "unknown"} (${s.plan}, ${s.status})`)
        .join("; ")
      await createSuspectIfNew(prisma, {
        ...base,
        reasonCode: "repeat_trial_identity",
        reasonDetail:
          `Canonical email matches account(s) that already had a free trial or lapsed paid subscription: ${summary}.`,
        relatedUserIds: related,
      })
    }
  }
}
