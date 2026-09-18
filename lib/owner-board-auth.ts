import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";

export async function requireOwnerBoardSession() {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }
  if (!isSiteOwner(session.user.email)) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, session };
}
