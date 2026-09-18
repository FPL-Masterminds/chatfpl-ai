export const OWNER_BOARD_LANES = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "in_test", label: "In test" },
  { id: "ready_for_release", label: "Ready for release" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;

export type OwnerBoardLaneId = (typeof OWNER_BOARD_LANES)[number]["id"];

const LANE_SET = new Set<string>(OWNER_BOARD_LANES.map((l) => l.id));

export function isOwnerBoardLaneId(value: string): value is OwnerBoardLaneId {
  return LANE_SET.has(value);
}

export function laneLabel(laneId: string): string {
  return OWNER_BOARD_LANES.find((l) => l.id === laneId)?.label ?? laneId;
}
