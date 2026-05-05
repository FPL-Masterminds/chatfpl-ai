// ─── Unverified user cleanup cron ─────────────────────────────────────────────
// Runs daily via Vercel Cron. Deletes any user who signed up but never clicked
// the email verification link, provided their account is at least 48h old AND
// the verification token expired more than 24h ago. CASCADE on subscriptions /
// usage_tracking / sessions / etc. handles related rows automatically.
//
// Safety:
//   - Bearer-token auth via CRON_SECRET (same pattern as /api/cron/index-urls)
//   - Hard cap of 100 deletions per run
//   - ?dryRun=true returns the list of candidates without deleting
//   - Multiple time-based guards make it impossible to delete an in-flight
//     signup whose link might still be valid

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_ACCOUNT_AGE_HOURS = 48;
const MIN_EXPIRY_AGE_HOURS = 24;
const HARD_DELETE_CAP = 100;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";

  const now = new Date();
  const accountAgeCutoff = new Date(now.getTime() - MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000);
  const expiryCutoff = new Date(now.getTime() - MIN_EXPIRY_AGE_HOURS * 60 * 60 * 1000);

  try {
    const candidates = await prisma.user.findMany({
      where: {
        emailVerified: null,
        created_at: { lt: accountAgeCutoff },
        OR: [
          { emailVerificationExpires: null },
          { emailVerificationExpires: { lt: expiryCutoff } },
        ],
      },
      select: {
        id: true,
        email: true,
        created_at: true,
        emailVerificationExpires: true,
      },
      orderBy: { created_at: "asc" },
      take: HARD_DELETE_CAP,
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        dryRun,
        deleted: 0,
        message: "No unverified users to clean up",
      });
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldDelete: candidates.length,
        candidates: candidates.map((c) => ({
          email: c.email,
          created_at: c.created_at,
          expired_at: c.emailVerificationExpires,
        })),
      });
    }

    const ids = candidates.map((c) => c.id);
    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(
      `Unverified cleanup cron: deleted ${result.count} users`,
      candidates.map((c) => c.email).join(", ")
    );

    return NextResponse.json({
      dryRun: false,
      deleted: result.count,
      emails: candidates.map((c) => c.email),
    });
  } catch (err: any) {
    console.error("Unverified cleanup cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
