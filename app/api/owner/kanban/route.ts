import { getOwnerApiSession } from "@/lib/owner-api-auth";
import { getOwnerKanbanBoard } from "@/lib/owner-kanban-service";

export async function GET() {
  const gate = await getOwnerApiSession();
  if (!gate.ok) return gate.response;

  try {
    const board = await getOwnerKanbanBoard();
    return Response.json(board);
  } catch (error) {
    console.error("Owner kanban GET failed:", error);
    return Response.json(
      { error: "Failed to load owner board. Database may need owner_kanban_cards." },
      { status: 500 },
    );
  }
}
