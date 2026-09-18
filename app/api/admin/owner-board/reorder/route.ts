import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerBoardSession } from "@/lib/owner-board-auth";
import { isOwnerBoardLaneId } from "@/lib/owner-board-lanes";

type ReorderItem = { id: string; status: string; position: number };

export async function POST(request: Request) {
  const gate = await requireOwnerBoardSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = await request.json().catch(() => ({}));
  const updates = Array.isArray(body.updates) ? body.updates : null;
  if (!updates || updates.length === 0) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 });
  }

  const parsed: ReorderItem[] = [];
  for (const item of updates) {
    if (
      typeof item?.id !== "string" ||
      typeof item?.status !== "string" ||
      !isOwnerBoardLaneId(item.status) ||
      typeof item?.position !== "number"
    ) {
      return NextResponse.json({ error: "Invalid update item" }, { status: 400 });
    }
    parsed.push({
      id: item.id,
      status: item.status,
      position: Math.max(0, Math.floor(item.position)),
    });
  }

  await prisma.$transaction(
    parsed.map((item) =>
      prisma.ownerBoardCard.update({
        where: { id: item.id },
        data: { status: item.status, position: item.position },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
