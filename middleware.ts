export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for NextAuth v5 session token (authjs prefix)
  const token = request.cookies.get("authjs.session-token") || 
                request.cookies.get("__Secure-authjs.session-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/chat/:path*"],
};
