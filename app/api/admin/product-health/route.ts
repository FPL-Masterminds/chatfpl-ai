// Owner-only product health signals. Aggregates and short previews only, no full transcripts.
//
// Auth: site owner email only (johnmcdermott1979@gmail.com).

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwner } from "@/lib/god-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_PLANS = ["Premium", "Elite", "VIP"];
const EMPTY_RATE_WARNING = 1;
const EMPTY_RATE_CRITICAL = 5;

type HealthLevel = "ok" | "warning" | "critical";

function healthFromEmptyRate(rate: number): HealthLevel {
  if (rate >= EMPTY_RATE_CRITICAL) return "critical";
  if (rate >= EMPTY_RATE_WARNING) return "warning";
  return "ok";
}

function worstLevel(...levels: HealthLevel[]): HealthLevel {
  if (levels.includes("critical")) return "critical";
  if (levels.includes("warning")) return "warning";
  return "ok";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isSiteOwner(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  const [
    chatCounts,
    feedbackCounts,
    recentNegative,
    churnSubs,
  ] = await Promise.all([
    prisma.$queryRaw<{ assistant_total: bigint; empty_total: bigint }[]>`
      SELECT
        COUNT(*)::bigint AS assistant_total,
        COUNT(*) FILTER (WHERE TRIM(content) = '')::bigint AS empty_total
      FROM messages
      WHERE role = 'assistant'
        AND timestamp >= ${sevenDaysAgo}
    `,
    prisma.messageFeedback.groupBy({
      by: ["rating"],
      where: { submitted_at: { gte: sevenDaysAgo } },
      _count: { rating: true },
    }),
    prisma.messageFeedback.findMany({
      where: { rating: "negative", submitted_at: { gte: sevenDaysAgo } },
      orderBy: { submitted_at: "desc" },
      take: 8,
      select: {
        user_email: true,
        user_name: true,
        user_prompt: true,
        submitted_at: true,
      },
    }),
    prisma.subscription.findMany({
      where: {
        plan: { in: PAID_PLANS },
        OR: [
          { cancel_at_period_end: true, status: "active" },
          {
            status: "cancelled",
            current_period_end: { gte: sevenDaysAgo },
          },
        ],
      },
      select: {
        plan: true,
        status: true,
        cancel_at_period_end: true,
        current_period_start: true,
        current_period_end: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            created_at: true,
          },
        },
      },
      orderBy: { current_period_end: "desc" },
      take: 20,
    }),
  ]);

  const assistantTotal = Number(chatCounts[0]?.assistant_total ?? 0);
  const emptyTotal = Number(chatCounts[0]?.empty_total ?? 0);
  const emptyReplyRate =
    assistantTotal > 0 ? (emptyTotal / assistantTotal) * 100 : 0;

  const negative7d =
    feedbackCounts.find((r) => r.rating === "negative")?._count.rating ?? 0;
  const positive7d =
    feedbackCounts.find((r) => r.rating === "positive")?._count.rating ?? 0;

  const churnUserIds = churnSubs.map((s) => s.user.id);
  const messageCountRows =
    churnUserIds.length > 0
      ? await prisma.$queryRaw<{ user_id: string; cnt: bigint }[]>`
          SELECT c.user_id, COUNT(m.id)::bigint AS cnt
          FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.role = 'user'
            AND m.timestamp >= ${sevenDaysAgo}
            AND c.user_id IN (${Prisma.join(churnUserIds)})
          GROUP BY c.user_id
        `
      : [];

  const userMsgMap = new Map<string, number>();
  for (const row of messageCountRows) {
    userMsgMap.set(row.user_id, Number(row.cnt));
  }

  const churnRows = churnSubs.map((sub) => {
    const recentStart =
      (sub.current_period_start && sub.current_period_start >= sevenDaysAgo) ||
      sub.user.created_at >= sevenDaysAgo;
    const quickCancel =
      sub.cancel_at_period_end &&
      sub.status === "active" &&
      recentStart;

    return {
      email: sub.user.email,
      name: sub.user.name ?? "(no name)",
      plan: sub.plan,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      period_end: sub.current_period_end?.toISOString() ?? null,
      user_messages_7d: userMsgMap.get(sub.user.id) ?? 0,
      quick_cancel: quickCancel,
    };
  });

  const pendingCancels = churnRows.filter(
    (r) => r.cancel_at_period_end && r.status === "active",
  ).length;
  const quickCancels7d = churnRows.filter((r) => r.quick_cancel).length;

  const chatHealth = healthFromEmptyRate(emptyReplyRate);
  const feedbackHealth: HealthLevel = negative7d > 0 ? "warning" : "ok";
  const churnHealth: HealthLevel =
    quickCancels7d > 0 ? "critical" : pendingCancels > 0 ? "warning" : "ok";

  const overall = worstLevel(chatHealth, feedbackHealth, churnHealth);

  const attention: string[] = [];
  if (emptyTotal > 0) {
    attention.push(
      `${emptyTotal} empty assistant reply${emptyTotal === 1 ? "" : "s"} in 7 days (${emptyReplyRate.toFixed(1)}%)`,
    );
  }
  if (negative7d > 0) {
    attention.push(`${negative7d} thumbs-down in 7 days`);
  }
  if (quickCancels7d > 0) {
    attention.push(`${quickCancels7d} paid cancel soon after signup`);
  } else if (pendingCancels > 0) {
    attention.push(`${pendingCancels} paid sub${pendingCancels === 1 ? "" : "s"} set to cancel`);
  }
  if (attention.length === 0) {
    attention.push("No breakage signals in the last 7 days");
  }

  return NextResponse.json({
    overall,
    attention,
    period: {
      days: 7,
      start: sevenDaysAgo.toISOString(),
      end: now.toISOString(),
    },
    chat: {
      assistant_messages_7d: assistantTotal,
      empty_replies_7d: emptyTotal,
      empty_reply_rate_7d: Math.round(emptyReplyRate * 10) / 10,
      status: chatHealth,
    },
    feedback: {
      negative_7d: negative7d,
      positive_7d: positive7d,
      status: feedbackHealth,
      recent_negative: recentNegative.map((r) => ({
        email: r.user_email ?? "unknown",
        name: r.user_name ?? "(no name)",
        submitted_at: r.submitted_at.toISOString(),
        prompt_preview: (r.user_prompt ?? "").slice(0, 120),
      })),
    },
    churn: {
      pending_cancels: pendingCancels,
      quick_cancels_7d: quickCancels7d,
      status: churnHealth,
      recent: churnRows.slice(0, 10),
    },
    fetched_at: now.toISOString(),
  });
}
