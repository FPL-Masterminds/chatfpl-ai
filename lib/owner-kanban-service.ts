import { prisma } from "@/lib/prisma";
import {
  COLUMNS,
  isOwnerKanbanColumnId,
  OWNER_KANBAN_BACKLOG_SEED,
  OWNER_KANBAN_INITIAL_SEED,
  type OwnerKanbanColumnId,
} from "@/lib/owner-kanban";

export type OwnerKanbanCardDto = {
  id: string;
  title: string;
  description: string | null;
  userStory: string | null;
  acceptanceCriteria: string | null;
  columnId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function toDto(row: {
  id: string;
  title: string;
  description: string | null;
  userStory: string | null;
  acceptanceCriteria: string | null;
  columnId: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): OwnerKanbanCardDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    userStory: row.userStory,
    acceptanceCriteria: row.acceptanceCriteria,
    columnId: row.columnId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function listCardsOrdered() {
  const rows = await prisma.ownerKanbanCard.findMany({
    orderBy: [{ columnId: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toDto);
}

async function migrateLegacyOwnerBoardCardsIfNeeded() {
  try {
    const kanbanCount = await prisma.ownerKanbanCard.count();
    if (kanbanCount > 0) return;

    await prisma.$executeRaw`
      INSERT INTO owner_kanban_cards (
        id, title, description, user_story, acceptance_criteria,
        column_id, sort_order, created_at, updated_at
      )
      SELECT
        id,
        title,
        NULLIF(description, ''),
        NULLIF(user_story, ''),
        NULLIF(acceptance_criteria, ''),
        status,
        position,
        created_at,
        updated_at
      FROM owner_board_cards
      ON CONFLICT (id) DO NOTHING
    `;
  } catch {
    // Legacy table may not exist in this database.
  }
}

export async function ensureOwnerKanbanSeeded() {
  await migrateLegacyOwnerBoardCardsIfNeeded();

  const count = await prisma.ownerKanbanCard.count();
  if (count === 0) {
    await prisma.$transaction(
      OWNER_KANBAN_INITIAL_SEED.map((card) =>
        prisma.ownerKanbanCard.create({
          data: {
            title: card.title,
            description: card.description ?? null,
            columnId: card.columnId,
            sortOrder: card.sortOrder,
          },
        }),
      ),
    );
  }

  for (const card of OWNER_KANBAN_BACKLOG_SEED) {
    const exists = await prisma.ownerKanbanCard.findFirst({
      where: { title: card.title },
      select: { id: true },
    });
    if (!exists) {
      await prisma.ownerKanbanCard.create({
        data: {
          title: card.title,
          description: card.description ?? null,
          columnId: card.columnId,
          sortOrder: card.sortOrder,
        },
      });
    }
  }
}

export async function getOwnerKanbanBoard() {
  await ensureOwnerKanbanSeeded();
  const cards = await listCardsOrdered();
  return { columns: COLUMNS, cards };
}

export async function createOwnerKanbanCard(input: {
  title: string;
  description?: string;
  columnId?: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  const columnId: OwnerKanbanColumnId =
    input.columnId && isOwnerKanbanColumnId(input.columnId)
      ? input.columnId
      : "todo";

  const max = await prisma.ownerKanbanCard.aggregate({
    where: { columnId },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? -1) + 1;

  const row = await prisma.ownerKanbanCard.create({
    data: {
      title,
      description: input.description?.trim() || null,
      columnId,
      sortOrder,
    },
  });
  return toDto(row);
}

export async function moveOwnerKanbanCard(
  cardId: string,
  columnId: string,
  index: number,
) {
  if (!isOwnerKanbanColumnId(columnId)) {
    throw new Error("Invalid column");
  }

  const card = await prisma.ownerKanbanCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card not found");

  const fromColumnId = card.columnId;
  const toColumnId = columnId;
  const toIndex = Math.max(0, index);

  const fromCards = await prisma.ownerKanbanCard.findMany({
    where: { columnId: fromColumnId },
    orderBy: { sortOrder: "asc" },
  });

  let toCards: typeof fromCards = [];
  if (fromColumnId !== toColumnId) {
    toCards = await prisma.ownerKanbanCard.findMany({
      where: { columnId: toColumnId },
      orderBy: { sortOrder: "asc" },
    });
  }

  const sourceWithout = fromCards.filter((c) => c.id !== cardId);
  const destBase =
    fromColumnId === toColumnId
      ? sourceWithout
      : toCards.filter((c) => c.id !== cardId);

  const destList = [...destBase];
  destList.splice(toIndex, 0, { ...card, columnId: toColumnId });

  await prisma.$transaction(async (tx) => {
    if (fromColumnId !== toColumnId) {
      for (let i = 0; i < sourceWithout.length; i++) {
        await tx.ownerKanbanCard.update({
          where: { id: sourceWithout[i].id },
          data: { sortOrder: i },
        });
      }
    }
    for (let i = 0; i < destList.length; i++) {
      await tx.ownerKanbanCard.update({
        where: { id: destList[i].id },
        data: { columnId: toColumnId, sortOrder: i },
      });
    }
  });

  return listCardsOrdered();
}

export async function updateOwnerKanbanCard(
  cardId: string,
  patch: {
    title?: string;
    description?: string | null;
    userStory?: string | null;
    acceptanceCriteria?: string | null;
  },
) {
  const data: Record<string, string | null> = {};

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) throw new Error("Title cannot be empty");
    data.title = title;
  }
  if (patch.description !== undefined) {
    data.description =
      patch.description === null ? null : patch.description.trim() || null;
  }
  if (patch.userStory !== undefined) {
    data.userStory =
      patch.userStory === null ? null : patch.userStory.trim() || null;
  }
  if (patch.acceptanceCriteria !== undefined) {
    data.acceptanceCriteria =
      patch.acceptanceCriteria === null
        ? null
        : patch.acceptanceCriteria.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No valid fields to update");
  }

  const row = await prisma.ownerKanbanCard.update({
    where: { id: cardId },
    data,
  });
  return toDto(row);
}

export async function deleteOwnerKanbanCard(cardId: string) {
  const card = await prisma.ownerKanbanCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card not found");

  const columnId = card.columnId;

  await prisma.$transaction(async (tx) => {
    await tx.ownerKanbanCard.delete({ where: { id: cardId } });

    const remaining = await tx.ownerKanbanCard.findMany({
      where: { columnId },
      orderBy: { sortOrder: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sortOrder !== i) {
        await tx.ownerKanbanCard.update({
          where: { id: remaining[i].id },
          data: { sortOrder: i },
        });
      }
    }
  });
}
