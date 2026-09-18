import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";

export async function getOwnerApiSession() {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false as const, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (!isSiteOwner(session.user.email)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}
