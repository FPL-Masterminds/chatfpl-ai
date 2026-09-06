import { NextResponse } from "next/server";
import { Resend } from "resend";
import { wrapEmailContent } from "@/lib/email-templates";
import { buildAdminSignupNotificationContent } from "@/lib/email-content";

/**
 * Internal API endpoint to notify admin of new user signups
 */
export async function POST(request: Request) {
  try {
    const { userName, userEmail, plan } = await request.json();
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "chatfplai@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_APT_KEY;

    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "Missing Resend API key" }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const { subject, content } = buildAdminSignupNotificationContent({
      userName,
      userEmail,
      plan: plan || "Unknown",
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
      to: adminEmail,
      subject,
      html: wrapEmailContent(content),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send admin signup notification:", error);
    return NextResponse.json({ success: false, error: "Email failed" }, { status: 500 });
  }
}
