import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { OwnerKanbanBoard } from "@/components/owner/owner-kanban-board";

export default function OwnerKanbanPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <Header />
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-3 py-6 pt-24 sm:px-4 lg:px-5">
        <OwnerKanbanBoard />
      </main>
      <Footer />
    </div>
  );
}
