import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wrapEmailContent } from "@/lib/email-templates";
import { buildAdminTestEmailContent } from "@/lib/email-content";

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

    const content = buildAdminTestEmailContent({
      adminName: user.name,
      adminEmail,
      triggeredAt: new Date().toISOString(),
    });

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

