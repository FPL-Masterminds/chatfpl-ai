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
    const { claim_id, action, displayOnHomepage } = await request.json();

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
        user: true
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
          verified_at: new Date(),
          display_on_homepage: displayOnHomepage === true && claim.action_type === "review"
        }
      });

      // Add messages to user's CURRENT MONTH usage tracking
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Find or create usage tracking for current month
      const usage = await prisma.usageTracking.findUnique({
        where: {
          user_id_month_year: {
            user_id: claim.user.id,
            month: currentMonth,
            year: currentYear
          }
        }
      });

      if (usage) {
        // Update existing usage tracking
        await prisma.usageTracking.update({
          where: {
            user_id_month_year: {
              user_id: claim.user.id,
              month: currentMonth,
              year: currentYear
            }
          },
          data: {
            messages_limit: {
              increment: claim.reward_messages
            }
          }
        });
      } else {
        // Create new usage tracking for current month with bonus messages
        await prisma.usageTracking.create({
          data: {
            user_id: claim.user.id,
            month: currentMonth,
            year: currentYear,
            messages_used: 0,
            messages_limit: 5 + claim.reward_messages // Base 5 + bonus
          }
        });
      }

      // Set bonus expiration date for Free users (30 days from now)
      // Check if user is on Free plan (Free users may not have a subscription record)
      const subscription = await prisma.subscription.findFirst({
        where: { user_id: claim.user.id },
        orderBy: { id: 'desc' }
      });

      // If no subscription exists or subscription is Free without expiration date
      if (!subscription || (subscription.plan.toLowerCase() === 'free' && !subscription.current_period_end)) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        if (!subscription) {
          // Create subscription record for Free user
          await prisma.subscription.create({
            data: {
              user_id: claim.user.id,
              plan: 'Free',
              status: 'active',
              current_period_start: now,
              current_period_end: expirationDate,
              cancel_at_period_end: false
            }
          });
        } else {
          // Update existing Free subscription with expiration date
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              current_period_start: now,
              current_period_end: expirationDate
            }
          });
        }
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
      created_at: claim.created_at.toISOString(),
      metadata: claim.metadata as any
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

