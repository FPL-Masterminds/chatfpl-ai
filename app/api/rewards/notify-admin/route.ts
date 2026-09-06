import { NextResponse } from "next/server";
import { Resend } from "resend";
import { wrapEmailContent } from "@/lib/email-templates";
import { buildRewardClaimNotificationContent } from "@/lib/email-content";

/**
 * Internal API endpoint to send admin notification emails
 * Called when users submit reward claims
 */
export async function POST(request: Request) {
  try {
    const { userName, userEmail, actionType, rewardMessages, proofUrl } = await request.json();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "chatfplai@gmail.com";

    const { subject, content } = buildRewardClaimNotificationContent({
      userName,
      userEmail,
      actionType,
      rewardMessages,
      proofUrl,
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
      to: adminEmail,
      subject,
      html: wrapEmailContent(content),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    // Don't fail the reward claim if email fails
    return NextResponse.json({ success: false, error: "Email failed" }, { status: 500 });
  }
}
