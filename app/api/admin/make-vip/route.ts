import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email-utils";
import { isSiteOwner } from "@/lib/god-mode";
import { sendVipGrantEmail, VIP_GRANT_MESSAGES_PER_MONTH } from "@/lib/vip-grant-email";

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isSiteOwner(session.user.email)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get email from request
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Find the user
    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { subscriptions: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must sign up first." },
        { status: 404 }
      );
    }

    // Update their subscription to VIP
    const subscription = targetUser.subscriptions[0];

    if (!subscription) {
      return NextResponse.json(
        { error: "User has no subscription record" },
        { status: 400 }
      );
    }

    // Set up VIP subscription with monthly reset
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: "VIP",
        status: "active",
        current_period_start: now,
        current_period_end: oneMonthLater,
      }
    });

    // Update their usage tracking to 100 messages
    const usage = await prisma.usageTracking.findFirst({
      where: { user_id: targetUser.id },
      orderBy: { id: 'desc' }
    });

    if (usage) {
      await prisma.usageTracking.update({
        where: { id: usage.id },
        data: {
          messages_limit: VIP_GRANT_MESSAGES_PER_MONTH,
          messages_used: 0 // Reset their usage
        }
      });
    }

    let emailSent = false
    try {
      const sendResult = await sendVipGrantEmail({
        to: targetUser.email,
        name: targetUser.name,
        unsubscribeToken: targetUser.unsubscribe_token,
      })
      emailSent = sendResult.ok
      if (!sendResult.ok) {
        console.error("VIP grant email failed:", sendResult.error)
      }
    } catch (emailError) {
      console.error("VIP grant email failed:", emailError)
    }

    return NextResponse.json({
      message: `${targetUser.name || targetUser.email} has been granted VIP access!${emailSent ? " Welcome email sent." : ""}`,
      user: {
        name: targetUser.name,
        email: targetUser.email,
        plan: "VIP",
        messages: VIP_GRANT_MESSAGES_PER_MONTH,
        emailSent,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Make VIP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

