import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerBoardSession } from "@/lib/owner-board-auth";
import { isOwnerBoardLaneId } from "@/lib/owner-board-lanes";

export type OwnerBoardCardDto = {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  userStory: string;
  acceptanceCriteria: string;
  status: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

function toDto(row: {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  user_story: string;
  acceptance_criteria: string;
  status: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}): OwnerBoardCardDto {
  return {
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
  };
}

export async function GET() {
  const gate = await requireOwnerBoardSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const rows = await prisma.ownerBoardCard.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }, { ticket_number: "asc" }],
  });

  return NextResponse.json({ cards: rows.map(toDto) });
}

export async function POST(request: Request) {
  const gate = await requireOwnerBoardSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const status =
    typeof body.status === "string" && isOwnerBoardLaneId(body.status)
      ? body.status
      : "todo";

  const maxInLane = await prisma.ownerBoardCard.aggregate({
    where: { status },
    _max: { position: true },
  });
  const position = (maxInLane._max.position ?? -1) + 1;

  const row = await prisma.ownerBoardCard.create({
    data: {
      title,
      status,
      position,
      description: typeof body.description === "string" ? body.description : "",
      user_story: typeof body.userStory === "string" ? body.userStory : "",
      acceptance_criteria:
        typeof body.acceptanceCriteria === "string" ? body.acceptanceCriteria : "",
    },
  });

  return NextResponse.json({ card: toDto(row) });
}
