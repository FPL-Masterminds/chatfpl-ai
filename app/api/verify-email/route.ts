import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=Invalid verification link", request.url)
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Invalid or expired verification link", request.url)
      );
    }

    // Check if token has expired (24 hours)
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return NextResponse.redirect(
        new URL("/login?error=Verification link expired. Please request a new one", request.url)
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/login?success=Email already verified. You can log in", request.url)
      );
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Process referral if this user was referred by someone
    if (user.referred_by) {
      try {
        // Check if referrer exists and is on Free plan
        const referrer = await prisma.user.findUnique({
          where: { id: user.referred_by },
          include: {
            subscriptions: {
              take: 1,
              orderBy: { id: 'desc' }
            },
            socialActions: {
              where: {
                action_type: 'referral',
                status: 'verified'
              }
            },
            usageTracking: {
              take: 1,
              orderBy: { id: 'desc' }
            }
          }
        });

        // Only reward if referrer exists, is on Free plan, hasn't hit 3 referrals, and hasn't hit 50 message cap
        if (referrer && referrer.subscriptions[0]?.plan?.toLowerCase() === 'free') {
          const referralCount = referrer.socialActions.length;
          const totalEarned = referrer.socialActions.reduce((sum, action) => sum + action.reward_messages, 0);

          if (referralCount < 3 && totalEarned + 5 <= 50) {
            // Create verified SocialAction for the referrer
            await prisma.socialAction.create({
              data: {
                user_id: user.referred_by,
                action_type: 'referral',
                status: 'verified',
                reward_messages: 5,
                proof_url: `Referred user: ${user.email}`,
                verified_at: new Date()
              }
            });

            // Add 5 messages to referrer's balance
            if (referrer.usageTracking[0]) {
              await prisma.usageTracking.update({
                where: { id: referrer.usageTracking[0].id },
                data: {
                  messages_limit: {
                    increment: 5
                  }
                }
              });
            }
          }
        }
      } catch (referralError) {
        console.error("Error processing referral:", referralError);
        // Don't fail verification if referral processing fails
      }
    }

    return NextResponse.redirect(
      new URL("/login?success=Email verified successfully! You can now log in", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Verification failed. Please try again", request.url)
    );
  }
}

