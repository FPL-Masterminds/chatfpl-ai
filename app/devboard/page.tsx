import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { GOD_MODE_EMAIL, isSiteOwner } from "@/lib/god-mode";
import { DevHeader } from "@/components/dev-header";
import { OwnerBoard } from "@/components/owner-board";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner board",
  robots: { index: false, follow: false },
};

export default async function DevBoardPage() {
  const session = await auth();
  if (!isSiteOwner(session?.user?.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black">
      <DevHeader />
      <main className="container mx-auto max-w-full overflow-x-hidden px-4 pb-16 pt-28">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/admin"
            className="text-white/50 transition hover:text-[#00FF87]"
          >
            Admin
          </Link>
          <span className="text-white/25">/</span>
          <span className="text-white/80">Owner board</span>
        </div>
        <OwnerBoard />
      </main>
      <Footer />
      <p className="pb-8 text-center text-[11px] text-white/25">
        Private board for {GOD_MODE_EMAIL} only. Not indexed.
      </p>
    </div>
  );
}
