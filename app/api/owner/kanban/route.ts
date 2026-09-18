import { getOwnerApiSession } from "@/lib/owner-api-auth";
import { getOwnerKanbanBoard } from "@/lib/owner-kanban-service";

export async function GET() {
  const gate = await getOwnerApiSession();
  if (!gate.ok) return gate.response;

  const board = await getOwnerKanbanBoard();
  return Response.json(board);
}
