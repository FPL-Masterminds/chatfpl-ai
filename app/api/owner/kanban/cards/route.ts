import { NextResponse } from "next/server";
import { getOwnerApiSession } from "@/lib/owner-api-auth";
import { isOwnerKanbanColumnId } from "@/lib/owner-kanban";
import { createOwnerKanbanCard } from "@/lib/owner-kanban-service";

export async function POST(request: Request) {
  const gate = await getOwnerApiSession();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "";
  const description =
    typeof body.description === "string" ? body.description : undefined;
  const columnId =
    typeof body.columnId === "string" && isOwnerKanbanColumnId(body.columnId)
      ? body.columnId
      : undefined;

  try {
    const card = await createOwnerKanbanCard({ title, description, columnId });
    return NextResponse.json({ card }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create card";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
