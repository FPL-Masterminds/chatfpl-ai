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

type DailyStat = {
  date: string;
  messages: number;
  signups: number;
  paid: number;
};

type TopUser = {
  userId: string;
  name: string;
  email: string;
  messages: number;
};

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "14d";
    const daysFromRange: Record<string, number> = {
      today: 1,
      "7d": 7,
      "14d": 14,
      "30d": 30,
      "60d": 60,
      "120d": 120,
      "365d": 365,
    };
    const parsedRangeDays = daysFromRange[range] || Number(searchParams.get("days") || "14");
    const daysParam = parsedRangeDays;
    const eventType = searchParams.get("type") || "all";
    const days = [7, 14, 30, 60, 120, 365].includes(daysParam) ? daysParam : 14;
    const effectiveDays = range === "today" ? 1 : days;

    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (effectiveDays - 1));

    const [recentUsers, paidSubscriptions, recentMessages] = await Promise.all([
      prisma.user.findMany({
        where: { created_at: { gte: rangeStart } },
        orderBy: { created_at: "desc" },
        take: 100,
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
          current_period_start: { gte: rangeStart },
        },
        orderBy: { current_period_start: "desc" },
        take: 100,
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
      prisma.message.findMany({
        where: {
          timestamp: { gte: rangeStart },
          role: "user",
        },
        select: {
          timestamp: true,
          conversation: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
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
      .filter((event) => {
        if (eventType === "signup") return event.type === "signup";
        if (eventType === "subscription") return event.type === "subscription";
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    const dailyMap = new Map<string, DailyStat>();
    for (let i = 0; i < effectiveDays; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, messages: 0, signups: 0, paid: 0 });
    }

    for (const user of recentUsers) {
      const key = user.created_at.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.signups += 1;
    }

    for (const sub of paidSubscriptions) {
      if (!sub.current_period_start) continue;
      const key = sub.current_period_start.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.paid += 1;
    }

    for (const msg of recentMessages) {
      const key = msg.timestamp.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.messages += 1;
    }

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const userMessageMap = new Map<string, TopUser>();

    for (const msg of recentMessages) {
      const user = msg.conversation.user;
      if (!user) continue;
      const existing = userMessageMap.get(user.id);
      if (existing) {
        existing.messages += 1;
      } else {
        userMessageMap.set(user.id, {
          userId: user.id,
          name: user.name || "Unnamed user",
          email: user.email,
          messages: 1,
        });
      }
    }

    const topUsers = Array.from(userMessageMap.values())
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 10);

    return NextResponse.json({ events, dailyStats, topUsers, range: range === "today" ? "today" : `${effectiveDays}d` }, { status: 200 });
  } catch (error) {
    console.error("Customer events fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

