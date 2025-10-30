import { prisma } from "@/lib/prisma";

/**
 * Resets bonus messages for Free tier users if they're past their renewal date
 * Returns updated usage data
 */
export async function resetFreeMessagesIfExpired(userId: string) {
  try {
    // Get user's subscription and usage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { id: 'desc' }
        },
        usageTracking: {
          take: 1,
          orderBy: { id: 'desc' }
        }
      }
    });

    if (!user || !user.subscriptions[0] || !user.usageTracking[0]) {
      return null;
    }

    const subscription = user.subscriptions[0];
    const usage = user.usageTracking[0];

    // Only apply to Free tier users
    if (subscription.plan.toLowerCase() !== 'free') {
      return usage;
    }

    // Check if we're past the renewal date
    const now = new Date();
    const renewalDate = subscription.current_period_end;

    if (!renewalDate || now <= renewalDate) {
      // Not past renewal date yet, return current usage
      return usage;
    }

    // Past renewal date - reset bonus messages!
    console.log(`Resetting bonus messages for user ${userId} (past renewal date)`);

    // Calculate new renewal date (1 month from now)
    const newRenewalDate = new Date(now);
    newRenewalDate.setMonth(newRenewalDate.getMonth() + 1);

    // Update subscription renewal date
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        current_period_start: now,
        current_period_end: newRenewalDate
      }
    });

    // Reset usage: used = 0, limit = 5 (base trial only, no bonus)
    const updatedUsage = await prisma.usageTracking.update({
      where: { id: usage.id },
      data: {
        messages_used: 0,
        messages_limit: 5, // Reset to base trial amount
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });

    console.log(`Reset complete for user ${userId}: messages_limit set to 5, used reset to 0`);

    return updatedUsage;

  } catch (error) {
    console.error("Error resetting free messages:", error);
    return null;
  }
}

