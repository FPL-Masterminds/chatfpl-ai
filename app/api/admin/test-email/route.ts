import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wrapEmailContent } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, email: true, name: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "chatfplai@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_APT_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing Resend API key configuration" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const content = `
      <h2 style="color: #2E0032;">✅ ChatFPL AI Admin Test Email</h2>
      <p>This is a manual test from the <strong>/api/admin/test-email</strong> endpoint.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Triggered by:</strong> ${user.name || "Admin User"}</p>
        <p style="margin: 8px 0;"><strong>Admin email target:</strong> ${adminEmail}</p>
        <p style="margin: 8px 0;"><strong>Triggered at:</strong> ${new Date().toISOString()}</p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        If you received this, Resend + env configuration is working for admin notifications.
      </p>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
      to: adminEmail,
      subject: "✅ ChatFPL AI Admin Test Email",
      html: wrapEmailContent(content),
    });

    return NextResponse.json(
      { success: true, sentTo: adminEmail, resend: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin test email failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}

