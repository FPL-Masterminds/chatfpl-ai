import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerBoardSession } from "@/lib/owner-board-auth";
import { isOwnerBoardLaneId } from "@/lib/owner-board-lanes";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const gate = await requireOwnerBoardSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.userStory === "string") data.user_story = body.userStory;
  if (typeof body.acceptanceCriteria === "string") {
    data.acceptance_criteria = body.acceptanceCriteria;
  }
  if (typeof body.status === "string" && isOwnerBoardLaneId(body.status)) {
    data.status = body.status;
  }
  if (typeof body.position === "number" && Number.isFinite(body.position)) {
    data.position = Math.max(0, Math.floor(body.position));
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const row = await prisma.ownerBoardCard.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      card: {
        id: row.id,
        ticketNumber: row.ticket_number,
        title: row.title,
        description: row.description,
        userStory: row.user_story,
        acceptanceCriteria: row.acceptance_criteria,
        status: row.status,
        position: row.position,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const gate = await requireOwnerBoardSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;

  try {
    await prisma.ownerBoardCard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
}
