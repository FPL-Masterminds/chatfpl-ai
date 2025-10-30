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

    // Get request data
    const { claim_id, action } = await request.json();

    if (!claim_id || !action) {
      return NextResponse.json(
        { error: "Claim ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the claim
    const claim = await prisma.socialAction.findUnique({
      where: { id: claim_id },
      include: {
        user: {
          include: {
            usageTracking: {
              take: 1,
              orderBy: { id: 'desc' }
            }
          }
        }
      }
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    if (claim.status !== "pending") {
      return NextResponse.json(
        { error: "This claim has already been processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update claim status to verified
      await prisma.socialAction.update({
        where: { id: claim_id },
        data: {
          status: "verified",
          verified_at: new Date()
        }
      });

      // Add messages to user's balance
      const usage = claim.user.usageTracking[0];
      if (usage) {
        await prisma.usageTracking.update({
          where: { id: usage.id },
          data: {
            messages_limit: {
              increment: claim.reward_messages
            }
          }
        });
      }

      return NextResponse.json({
        message: `Reward approved! ${claim.reward_messages} messages added to ${claim.user.name || claim.user.email}'s account.`,
        claim: {
          id: claim.id,
          action_type: claim.action_type,
          status: "verified",
          reward_messages: claim.reward_messages
        }
      }, { status: 200 });
    } else {
      // Reject the claim
      await prisma.socialAction.update({
        where: { id: claim_id },
        data: {
          status: "rejected"
        }
      });

      return NextResponse.json({
        message: `Reward rejected for ${claim.user.name || claim.user.email}.`,
        claim: {
          id: claim.id,
          action_type: claim.action_type,
          status: "rejected"
        }
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Verify reward error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending claims for admin
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

    // Fetch all pending claims
    const pendingClaims = await prisma.socialAction.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    const formattedClaims = pendingClaims.map(claim => ({
      id: claim.id,
      user_name: claim.user.name,
      user_email: claim.user.email,
      action_type: claim.action_type,
      reward_messages: claim.reward_messages,
      proof_url: claim.proof_url,
      created_at: claim.created_at.toISOString()
    }));

    return NextResponse.json({
      pendingCount: formattedClaims.length,
      claims: formattedClaims
    }, { status: 200 });

  } catch (error) {
    console.error("Get pending claims error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

