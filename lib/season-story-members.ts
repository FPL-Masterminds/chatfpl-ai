import type { MemberHistoryInput } from "./season-story"

export type StandingRow = {
  entry: number
  entry_name: string
  player_name: string
  total: number
  event_total: number
  points_on_bench?: number
}

export type FplGwHistoryRow = {
  event: number
  points: number
  total_points: number
  points_on_bench?: number
  event_transfers?: number
  event_transfers_cost?: number
}

export type EntryHistorySnapshot = {
  chips: { name: string; event: number }[]
  gwRow: FplGwHistoryRow | null
}

/** True when every member has a row for each required gameweek. */
export function membersHaveAllGwData(
  members: MemberHistoryInput[],
  requiredGws: number[]
): boolean {
  if (members.length === 0 || requiredGws.length === 0) return false
  return members.every((m) =>
    requiredGws.every((gw) => m.current.some((c) => c.event === gw))
  )
}

/**
 * Merge live league standings into member history for the in-progress gameweek only.
 * Standings event_total is only valid for the live GW, never for archived weeks.
 */
export function mergeLiveGwFromStandings(
  members: MemberHistoryInput[],
  standings: StandingRow[],
  liveGwId: number
): MemberHistoryInput[] {
  const byEntry = new Map(members.map((m) => [m.entryId, m]))
  for (const row of standings) {
    const gwRow = {
      event: liveGwId,
      points: row.event_total,
      total_points: row.total,
      points_on_bench: row.points_on_bench ?? 0,
    }
    const existing = byEntry.get(row.entry)
    if (!existing) {
      byEntry.set(row.entry, {
        entryId: row.entry,
        team: row.entry_name,
        manager: row.player_name,
        current: [gwRow],
        chips: [],
      })
      continue
    }
    const idx = existing.current.findIndex((c) => c.event === liveGwId)
    if (idx >= 0) {
      existing.current[idx] = { ...existing.current[idx], ...gwRow }
    } else {
      existing.current.push(gwRow)
    }
    existing.current.sort((a, b) => a.event - b.event)
  }
  return Array.from(byEntry.values())
}

/** Admin live preview: prefer entry history for the GW, fall back to standings for live points. */
export function buildProvisionalPreviewMembers(
  rows: StandingRow[],
  gw: number,
  snapshots: Map<number, EntryHistorySnapshot>
): MemberHistoryInput[] {
  return rows.map((r) => {
    const snap = snapshots.get(r.entry)
    const hist = snap?.gwRow?.event === gw ? snap.gwRow : null
    return {
      entryId: r.entry,
      team: r.entry_name,
      manager: r.player_name,
      current: [
        {
          event: gw,
          points: hist?.points ?? r.event_total,
          total_points: hist?.total_points ?? r.total,
          points_on_bench: hist?.points_on_bench ?? r.points_on_bench ?? 0,
          event_transfers: hist?.event_transfers ?? 0,
          event_transfers_cost: hist?.event_transfers_cost ?? 0,
        },
      ],
      chips: snap?.chips ?? [],
    }
  })
}

export function mergeRefetchedHistories(
  members: MemberHistoryInput[],
  refetched: MemberHistoryInput[]
): MemberHistoryInput[] {
  const byEntry = new Map(members.map((m) => [m.entryId, m]))
  for (const fresh of refetched) {
    const existing = byEntry.get(fresh.entryId)
    if (!existing) {
      byEntry.set(fresh.entryId, fresh)
      continue
    }
    for (const row of fresh.current) {
      if (!existing.current.some((c) => c.event === row.event)) {
        existing.current.push(row)
      }
    }
    if (fresh.chips?.length) existing.chips = fresh.chips
    existing.current.sort((a, b) => a.event - b.event)
  }
  return Array.from(byEntry.values())
}

export function entriesMissingGwData(
  standingsRows: StandingRow[],
  members: MemberHistoryInput[],
  requiredGws: number[]
): StandingRow[] {
  const byEntry = new Map(members.map((m) => [m.entryId, m]))
  return standingsRows.filter((row) => {
    const m = byEntry.get(row.entry)
    if (!m || m.current.length === 0) return true
    return requiredGws.some((gw) => !m.current.some((c) => c.event === gw))
  })
}
