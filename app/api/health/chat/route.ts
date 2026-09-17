import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fplLiveFetchOptions } from "@/lib/fpl-gw-live-status";
import { runChatPreDifySmoke } from "@/lib/chat-pre-dify-smoke";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckName =
  | "dify_configured"
  | "database"
  | "fpl_api"
  | "chat_pre_dify_pipeline";

type CheckResult = { ok: boolean; detail?: string };

async function checkDatabase(): Promise<CheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: message };
  }
}

async function checkFplApi(): Promise<CheckResult> {
  try {
    const res = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { ...fplLiveFetchOptions(), signal: AbortSignal.timeout(12_000) },
    );
    if (!res.ok) {
      return { ok: false, detail: `HTTP ${res.status}` };
    }
    await res.json();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: message };
  }
}

function checkDifyConfigured(): CheckResult {
  const ok = Boolean(process.env.DIFY_API_KEY?.trim());
  return ok ? { ok: true } : { ok: false, detail: "DIFY_API_KEY missing" };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const deep =
    Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  const checks: Record<CheckName, CheckResult> = {
    dify_configured: checkDifyConfigured(),
    database: await checkDatabase(),
    fpl_api: await checkFplApi(),
    chat_pre_dify_pipeline: { ok: true },
  };

  if (deep) {
    const smoke = await runChatPreDifySmoke();
    checks.chat_pre_dify_pipeline = smoke.ok
      ? { ok: true }
      : { ok: false, detail: smoke.error };
  } else {
    checks.chat_pre_dify_pipeline = {
      ok: true,
      detail: "skipped (public); send Authorization: Bearer CRON_SECRET for deep check",
    };
  }

  const requiredForOnline: CheckName[] = deep
    ? ["dify_configured", "database", "fpl_api", "chat_pre_dify_pipeline"]
    : ["dify_configured", "database", "fpl_api"];

  const failed = requiredForOnline.filter((name) => !checks[name].ok);
  const status = failed.length === 0 ? "online" : "offline";

  const body = {
    status,
    label: status === "online" ? "Chat Online" : "Chat Offline",
    checks,
    failed_checks: failed,
    deep,
    checked_at: new Date().toISOString(),
    production_url: "https://www.chatfpl.ai/chat",
  };

  return NextResponse.json(body, {
    status: status === "online" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
