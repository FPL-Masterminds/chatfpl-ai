import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Get request data
    const { action_type, proof_url, metadata } = await request.json();

    if (!action_type) {
      return NextResponse.json(
        { error: "Action type is required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ["twitter", "reddit", "facebook", "review", "referral"];
    if (!validActions.includes(action_type)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    // Require proof URL for social shares (not for written reviews)
    if (["twitter", "reddit", "facebook"].includes(action_type) && !proof_url) {
      return NextResponse.json(
        { error: "Proof URL is required for this action" },
        { status: 400 }
      );
    }

    // For reviews, either written review or X post URL required
    if (action_type === "review" && !proof_url) {
      return NextResponse.json(
        { error: "Review content or X post URL is required" },
        { status: 400 }
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
    if (subscription?.plan?.toLowerCase() !== "free") {
      return NextResponse.json(
        { error: "Rewards are only available for Free tier users" },
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

    // Check if already claimed (for non-referral actions)
    if (action_type !== "referral") {
      const existingClaim = user.socialActions.find(
        action => action.action_type === action_type
      );

      if (existingClaim) {
        return NextResponse.json(
          { error: "You have already claimed this reward" },
          { status: 400 }
        );
      }
    }

    // Check lifetime cap (50 messages)
    const totalEarned = user.socialActions
      .filter(action => action.status === "verified")
      .reduce((sum, action) => sum + action.reward_messages, 0);

    // Calculate reward amount
    let rewardAmount = 5; // Default for social shares
    if (action_type === "referral") {
      rewardAmount = 10;
    } else if (action_type === "review") {
      // Review: 5 for written, 10 for X consent
      const isXConsent = metadata?.reviewType === "xpost" && metadata?.xConsent === true;
      rewardAmount = isXConsent ? 10 : 5;
    }

    if (totalEarned + rewardAmount > 50) {
      return NextResponse.json(
        { error: "You have reached the lifetime cap of 50 bonus messages" },
        { status: 400 }
      );
    }

    // Create the claim
    const claim = await prisma.socialAction.create({
      data: {
        user_id: user.id,
        action_type,
        status: "pending",
        reward_messages: rewardAmount,
        proof_url: proof_url || null
      }
    });

    return NextResponse.json({
      message: "Reward claim submitted! Our team will verify it within 24-48 hours.",
      claim: {
        action_type: claim.action_type,
        status: claim.status,
        reward_messages: claim.reward_messages,
        created_at: claim.created_at.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Claim reward error:", error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "You have already claimed this reward" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

