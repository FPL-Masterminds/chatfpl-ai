import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CustomerEvent = {
  id: string;
  type: "signup" | "subscription";
  title: string;
  detail: string;
  timestamp: string;
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const [recentUsers, paidSubscriptions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { created_at: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
        },
      }),
      prisma.subscription.findMany({
        where: {
          plan: { in: ["Premium", "Elite", "VIP"] },
          current_period_start: { not: null },
        },
        orderBy: { current_period_start: "desc" },
        take: 20,
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          plan: true,
          status: true,
          current_period_start: true,
        },
      }),
    ]);

    const signupEvents: CustomerEvent[] = recentUsers.map((user) => ({
      id: `signup-${user.id}`,
      type: "signup",
      title: "New signup",
      detail: `${user.name || "Unnamed user"} (${user.email})`,
      timestamp: user.created_at.toISOString(),
    }));

    const subscriptionEvents: CustomerEvent[] = paidSubscriptions
      .filter((sub) => sub.current_period_start)
      .map((sub) => ({
        id: `subscription-${sub.id}-${sub.current_period_start!.toISOString()}`,
        type: "subscription",
        title: `${sub.plan} subscription activity`,
        detail: `${sub.user.name || "Unnamed user"} (${sub.user.email}) - ${sub.status}`,
        timestamp: sub.current_period_start!.toISOString(),
      }));

    const events = [...signupEvents, ...subscriptionEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Customer events fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

