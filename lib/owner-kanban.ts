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

export type OwnerKanbanSeedCard = {
  title: string;
  description?: string;
  columnId: OwnerKanbanColumnId;
  sortOrder: number;
};

/** Initial board when empty. ChatFPL backlog, not FPLEI journey cards. */
export const OWNER_KANBAN_INITIAL_SEED: OwnerKanbanSeedCard[] = [
  {
    title: "Conversational follow-ups (yes please)",
    description: "Thread focus + transfer replacement must stay on prior player/topic.",
    columnId: "in_progress",
    sortOrder: 0,
  },
  {
    title: "Chat production health + deploy checks",
    description: "Owner status script after every push; deep checks when needed.",
    columnId: "done",
    sortOrder: 0,
  },
  {
    title: "Stripe lifecycle E2E",
    description: "Trial welcome, cancel, convert, access rules. Production sign-off.",
    columnId: "in_progress",
    sortOrder: 1,
  },
  {
    title: "Owner email hub",
    description: "Template gallery at /devemails, Resend HTML alignment.",
    columnId: "done",
    sortOrder: 1,
  },
  {
    title: "Squad ownership guards",
    description: "Linked Team ID only for sells and your players.",
    columnId: "done",
    sortOrder: 2,
  },
];

/** Idempotent adds on each GET when title missing. */
export const OWNER_KANBAN_BACKLOG_SEED: OwnerKanbanSeedCard[] = [
  {
    title: "Owner kanban at /dashboard/owner/kanban",
    description: "FPLEI-parity board, ChatFPL branding, owner APIs.",
    columnId: "done",
    sortOrder: 3,
  },
];
