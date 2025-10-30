import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { normalizeEmail } from "@/lib/email-utils";
import { wrapEmailContent } from "@/lib/email-templates";

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

      const emailContent = `
        <h2 style="color: #2E0032;">Verify Your Email</h2>
        <p>You requested a new verification link for your ChatFPL account.</p>
        <p>Click the button below to verify your email and start chatting:</p>
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email & Start Chatting</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">⏰ This link will expire in 24 hours.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "ChatFPL <noreply@chatfpl.ai>",
        to: email,
        subject: "Verify your ChatFPL email",
        html: wrapEmailContent(emailContent),
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

