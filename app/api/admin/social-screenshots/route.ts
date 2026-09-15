import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";
import { getSocialScreenshotAdminConfig } from "@/lib/social-screenshot-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isSiteOwner(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getSocialScreenshotAdminConfig();
  return NextResponse.json(config);
}
