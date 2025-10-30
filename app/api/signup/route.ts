import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { normalizeEmail, isDisposableEmail } from "@/lib/email-utils";
import { wrapEmailContent } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { email, password, name, referralCode } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Normalize email to prevent abuse (removes +aliases and Gmail dots)
    const normalizedEmail = normalizeEmail(email);

    // Block disposable email providers
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Disposable email addresses are not allowed" },
        { status: 400 }
      );
    }

    // Check if user already exists (using normalized email)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // Decode referral code if provided
    let referrerId: string | null = null;
    if (referralCode) {
      try {
        referrerId = Buffer.from(referralCode, 'base64').toString('utf-8');
        // Verify the referrer exists
        const referrer = await prisma.user.findUnique({
          where: { id: referrerId },
          select: { id: true }
        });
        if (!referrer) {
          referrerId = null; // Invalid referrer ID, ignore it
        }
      } catch (error) {
        console.error("Invalid referral code:", error);
        referrerId = null; // Invalid referral code, ignore it
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail, // Store normalized email in database
        password_hash: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiry,
        referred_by: referrerId,
        subscriptions: {
          create: {
            plan: "Free",
            status: "active",
            current_period_start: now,
            current_period_end: oneMonthLater,
          },
        },
        usageTracking: {
          create: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            messages_used: 0,
            messages_limit: 5,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Send verification email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://chatfpl.ai'}/api/verify-email?token=${verificationToken}`;

      const emailContent = `
        <h2 style="color: #2E0032;">Welcome to ChatFPL, ${name}! 🎉</h2>
        <p>Thanks for signing up. Please verify your email address to start using your <strong>5 free messages</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">✅ <strong>Your Free Trial Includes:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
            <li>5 AI-powered FPL messages</li>
            <li>Live data access</li>
            <li>Earn more messages by sharing</li>
          </ul>
        </div>
        <p>Click the button below to verify your email and start chatting:</p>
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email & Start Chatting</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">⏰ This link will expire in 24 hours.</p>
        <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "ChatFPL <noreply@chatfpl.ai>",
        to: email,
        subject: "Welcome to ChatFPL - Verify Your Email 🎉",
        html: wrapEmailContent(emailContent),
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup if email fails - user can request a new one
    }

    // Notify admin of new signup (fire and forget)
    try {
      fetch(`${process.env.NEXTAUTH_URL || 'https://chatfpl.ai'}/api/admin/notify-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: name,
          userEmail: email,
          plan: "Free"
        })
      }).catch(err => console.error("Admin signup notification failed:", err));
    } catch (err) {
      console.error("Failed to send admin signup notification:", err);
    }

    return NextResponse.json(
      { 
        message: "User created successfully. Please check your email to verify your account.", 
        user: newUser,
        requiresVerification: true 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
