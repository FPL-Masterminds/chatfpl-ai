import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { normalizeEmail } from "@/lib/email-utils";
import { wrapEmailContent } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Debug logging
    console.log("Forgot password request for:", email);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_API_KEY starts with re_:", process.env.RESEND_API_KEY?.startsWith("re_"));
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email to match signup normalization
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with that email, we've sent a reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    // Send email
    console.log("Attempting to send email to:", email);
    console.log("From address:", process.env.EMAIL_FROM);
    
    const emailContent = `
      <h2 style="color: #2E0032;">Reset Your Password</h2>
      <p>Hi${user.name ? ` ${user.name}` : ""},</p>
      <p>We received a request to reset your ChatFPL AI password. Click the button below to choose a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
      <p><strong>⏰ This link will expire in 1 hour.</strong></p>
      <p style="color: #999; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
      <p style="margin-top: 30px;">Thanks,<br><strong>The ChatFPL AI Team</strong></p>
    `;

    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Reset Your ChatFPL AI Password",
      html: wrapEmailContent(emailContent),
    });

    console.log("Resend API response:", JSON.stringify(emailResponse, null, 2));

    return NextResponse.json(
      { message: "If an account exists with that email, we've sent a reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

