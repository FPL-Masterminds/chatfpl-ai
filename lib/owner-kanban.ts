export const COLUMN_IDS = [
  "todo",
  "in_progress",
  "in_test",
  "ready_for_release",
  "blocked",
  "done",
] as const;

export type OwnerKanbanColumnId = (typeof COLUMN_IDS)[number];

export const COLUMNS: { id: OwnerKanbanColumnId; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_test", label: "In Test" },
  { id: "ready_for_release", label: "Ready for Release" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

const COLUMN_SET = new Set<string>(COLUMN_IDS);

export function isOwnerKanbanColumnId(value: string): value is OwnerKanbanColumnId {
  return COLUMN_SET.has(value);
}

/** FPLEI-style card footer, e.g. "18 Sept 2026". */
export function formatOwnerKanbanCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type { OwnerKanbanTicketDefinition as OwnerKanbanSeedCard } from "@/lib/owner-kanban-tickets";
export {
  OWNER_KANBAN_BACKLOG_SEED,
  OWNER_KANBAN_INITIAL_SEED,
  OWNER_KANBAN_TICKET_DEFINITIONS,
} from "@/lib/owner-kanban-tickets";
