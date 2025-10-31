import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user data with subscription and usage info
    const userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { id: 'desc' },
        },
        usageTracking: {
          take: 1,
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const subscription = userData.subscriptions[0];
    const usage = userData.usageTracking[0];

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || "user",
        created_at: userData.created_at.toISOString(),
      },
      subscription: {
        plan: subscription?.plan || "Free",
        status: subscription?.status || "active",
        current_period_start: subscription?.current_period_start?.toISOString() || null,
        current_period_end: subscription?.current_period_end?.toISOString() || null,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
      },
      usage: {
        messages_used: usage?.messages_used || 0,
        messages_limit: usage?.messages_limit || 5,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Account fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
