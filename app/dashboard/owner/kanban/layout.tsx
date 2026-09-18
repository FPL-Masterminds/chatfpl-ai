import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner board",
  robots: { index: false, follow: false },
};

const KANBAN_PATH = "/dashboard/owner/kanban";

export default async function OwnerKanbanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(KANBAN_PATH)}`);
  }
  if (!isSiteOwner(session.user.email)) {
    redirect("/dashboard");
  }

  return children;
}
