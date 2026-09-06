import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { normalizeEmail } from "@/lib/email-utils";
import { wrapEmailContent } from "@/lib/email-templates";
import { buildResendVerificationContent } from "@/lib/email-content";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email to match signup normalization
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json(
        { message: "If an account exists with this email, a verification link has been sent." },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. You can log in." },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiry,
      },
    });

    // Send verification email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://chatfpl.ai'}/api/verify-email?token=${verificationToken}`;

      const emailContent = buildResendVerificationContent({ verificationUrl });

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
        to: email,
        subject: "Verify your ChatFPL AI email",
        html: wrapEmailContent(emailContent, {
          unsubscribeToken: user.unsubscribe_token,
        }),
      });

      return NextResponse.json(
        { message: "Verification email sent successfully." },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

