import { Resend } from "resend"

import { buildVipGrantContent } from "@/lib/email-content"
import { wrapEmailContent } from "@/lib/email-templates"

/** Matches /api/admin/make-vip usage limit. */
export const VIP_GRANT_MESSAGES_PER_MONTH = 100

export async function sendVipGrantEmail(opts: {
  to: string
  name?: string | null
  unsubscribeToken?: string | null
  messagesPerMonth?: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_APT_KEY
  if (!resendApiKey) {
    return { ok: false, error: "Missing Resend API key" }
  }

  const messagesPerMonth = opts.messagesPerMonth ?? VIP_GRANT_MESSAGES_PER_MONTH
  const { subject, content } = buildVipGrantContent({
    name: opts.name,
    messagesPerMonth,
  })

  const resend = new Resend(resendApiKey)
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
    to: opts.to,
    subject,
    html: wrapEmailContent(content, { unsubscribeToken: opts.unsubscribeToken }),
  })

  if (result.error) {
    return { ok: false, error: result.error.message || "Resend send failed" }
  }

  return { ok: true }
}
