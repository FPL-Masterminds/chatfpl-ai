import { NextResponse } from "next/server";
import { getOwnerApiSession } from "@/lib/owner-api-auth";
import { updateOwnerKanbanCard } from "@/lib/owner-kanban-service";

type RouteContext = { params: Promise<{ cardId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const gate = await getOwnerApiSession();
  if (!gate.ok) return gate.response;

  const { cardId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const patch: {
    title?: string;
    description?: string | null;
    userStory?: string | null;
    acceptanceCriteria?: string | null;
  } = {};

  if (typeof body.title === "string") patch.title = body.title;
  if (body.description === null || typeof body.description === "string") {
    patch.description = body.description;
  }
  if (body.userStory === null || typeof body.userStory === "string") {
    patch.userStory = body.userStory;
  }
  if (
    body.acceptanceCriteria === null ||
    typeof body.acceptanceCriteria === "string"
  ) {
    patch.acceptanceCriteria = body.acceptanceCriteria;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const card = await updateOwnerKanbanCard(cardId, patch);
    return NextResponse.json({ card });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message.includes("empty") ? 400 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
