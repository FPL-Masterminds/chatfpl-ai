import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwner } from "@/lib/god-mode";

export async function GET() {
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

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get active paid subscriptions (Premium, Elite, VIP - not Free or Admin)
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "active",
        plan: {
          in: ["Premium", "Elite", "VIP"]
        }
      }
    });

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count messages sent today
    const messagesToday = await prisma.message.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Count all time messages
    const allTimeMessages = await prisma.message.count();

    // Count conversations (chat sessions)
    const chatSessionsToday = await prisma.conversation.count({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      messagesToday,
      chatSessionsToday,
      allTimeMessages
    }, { status: 200 });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

