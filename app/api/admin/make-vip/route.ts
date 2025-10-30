import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email-utils";

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

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
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
      include: { subscriptions: true }
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
          messages_limit: 100,
          messages_used: 0 // Reset their usage
        }
      });
    }

    return NextResponse.json({
      message: `${targetUser.name || targetUser.email} has been granted VIP access!`,
      user: {
        name: targetUser.name,
        email: targetUser.email,
        plan: "VIP",
        messages: 100
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

