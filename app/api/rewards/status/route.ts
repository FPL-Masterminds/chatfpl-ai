import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { id: 'desc' }
        },
        socialActions: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is on Free tier
    const subscription = user.subscriptions[0];
    const userPlan = subscription?.plan?.toLowerCase() || "free";
    
    if (userPlan !== "free") {
      return NextResponse.json(
        { error: "Rewards are only available for Free tier users. As a paying member, you already have access to your plan's message allocation!" },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before claiming rewards" },
        { status: 403 }
      );
    }

    // Calculate total earned messages from verified rewards
    const totalEarned = user.socialActions
      .filter(action => action.status === "verified")
      .reduce((sum, action) => sum + action.reward_messages, 0);

    // Check which rewards are still available
    const claimedTypes = user.socialActions.map(action => action.action_type);
    const availableRewards = {
      twitter: !claimedTypes.includes("twitter"),
      reddit: !claimedTypes.includes("reddit"),
      facebook: !claimedTypes.includes("facebook"),
      review: !claimedTypes.includes("review"),
      referral: true // Referrals can be claimed multiple times (different people)
    };

    // Format claimed rewards
    const claimedRewards = user.socialActions.map(action => ({
      action_type: action.action_type,
      status: action.status,
      reward_messages: action.reward_messages,
      created_at: action.created_at.toISOString(),
      verified_at: action.verified_at?.toISOString() || null
    }));

    return NextResponse.json({
      totalEarned,
      availableRewards,
      claimedRewards
    }, { status: 200 });

  } catch (error) {
    console.error("Reward status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

