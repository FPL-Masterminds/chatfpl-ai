-- Owner kanban (run once on Postgres; matches Prisma model OwnerKanbanCard)
CREATE TABLE IF NOT EXISTS "owner_kanban_cards" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "user_story" TEXT,
    "acceptance_criteria" TEXT,
    "column_id" VARCHAR(32) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "owner_kanban_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "owner_kanban_cards_column_id_sort_order_idx"
ON "owner_kanban_cards"("column_id", "sort_order");
