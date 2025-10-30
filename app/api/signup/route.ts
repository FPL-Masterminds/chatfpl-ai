import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { normalizeEmail, isDisposableEmail } from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

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

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail, // Store normalized email in database
        password_hash: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiry,
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

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "ChatFPL <noreply@chatfpl.ai>",
        to: email, // Send to original email (user's actual address)
        subject: "Verify your ChatFPL email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E0032;">Welcome to ChatFPL, ${name}!</h2>
            <p>Thanks for signing up. Please verify your email address to start using ChatFPL.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #00FF86; color: #2E0032; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup if email fails - user can request a new one
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
