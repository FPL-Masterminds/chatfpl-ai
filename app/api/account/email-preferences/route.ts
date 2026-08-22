// Signed-in preference toggle for marketing emails.
//
// PATCH  /api/account/email-preferences
// body:  { marketing_opt_out: boolean }
//
// This is the "resubscribe" path referenced from /unsubscribe. It's the
// same flag the /api/unsubscribe endpoint flips - just accessed from
// inside the account with a real session, so no token needed.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { marketing_opt_out?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.marketing_opt_out !== "boolean") {
    return NextResponse.json(
      { error: "marketing_opt_out must be a boolean" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: { marketing_opt_out: body.marketing_opt_out },
      select: { marketing_opt_out: true },
    });
    return NextResponse.json({ marketing_opt_out: updated.marketing_opt_out });
  } catch (err) {
    console.error("email-preferences update failed", err);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
