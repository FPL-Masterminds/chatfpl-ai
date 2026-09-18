import Link from "next/link";
import { DevHeader } from "@/components/dev-header";
import { Footer } from "@/components/footer";
import { OwnerKanbanBoard } from "@/components/owner/owner-kanban-board";

export default function OwnerKanbanPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black">
      <DevHeader />
      <main className="container mx-auto max-w-full overflow-x-hidden px-4 pb-12 pt-28">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link href="/admin" className="text-white/50 transition hover:text-[#00FF87]">
            Admin
          </Link>
          <span className="text-white/25">/</span>
          <span className="text-white/80">Owner board</span>
        </div>
        <OwnerKanbanBoard />
      </main>
      <Footer />
    </div>
  );
}
