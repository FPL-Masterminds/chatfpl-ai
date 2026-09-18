import { NextResponse } from "next/server";
import { getOwnerApiSession } from "@/lib/owner-api-auth";
import { isOwnerKanbanColumnId } from "@/lib/owner-kanban";
import { moveOwnerKanbanCard } from "@/lib/owner-kanban-service";

export async function POST(request: Request) {
  const gate = await getOwnerApiSession();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const cardId = typeof body.cardId === "string" ? body.cardId : "";
  const columnId = typeof body.columnId === "string" ? body.columnId : "";
  const index = typeof body.index === "number" ? body.index : NaN;

  if (!cardId || !isOwnerKanbanColumnId(columnId) || !Number.isFinite(index)) {
    return NextResponse.json({ error: "Invalid move payload" }, { status: 400 });
  }

  try {
    const cards = await moveOwnerKanbanCard(cardId, columnId, index);
    return NextResponse.json({ ok: true, cards });
  } catch {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
}
