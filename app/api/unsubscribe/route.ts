// One-click unsubscribe endpoint linked from every marketing email footer.
// Requirement of PECR Regulation 22 - unsubscribing must be simple and
// must not require the user to log in.
//
// Flow: user clicks link with ?token=<x> in the email footer
//   -> flip users.marketing_opt_out = true
//   -> redirect to /unsubscribe (nice confirmation page)
//
// Idempotent: hitting the same link twice is fine. Unknown token also
// redirects to the confirmation page rather than an error - we don't
// want to surface anything that leaks user existence.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe", request.url));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { unsubscribe_token: token },
      select: { id: true, email: true, marketing_opt_out: true },
    });

    if (user && !user.marketing_opt_out) {
      await prisma.user.update({
        where: { id: user.id },
        data: { marketing_opt_out: true },
      });
    }
  } catch (err) {
    console.error("unsubscribe: DB error", err);
    // Still redirect to the confirmation page - a DB blip shouldn't
    // leave the user staring at an error when they were just trying
    // to make our emails stop.
  }

  return NextResponse.redirect(new URL("/unsubscribe", request.url));
}

// Support both - some email clients GET the link, some (RFC 8058
// one-click-unsubscribe headers) POST it. Both should work.
export const GET = handle;
export const POST = handle;
