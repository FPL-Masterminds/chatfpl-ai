import type { MemberGWRow, MemberHistoryInput, SeasonStoryFacts } from "./season-story"
import { pts, spellN } from "./season-story-copy"

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function gwPtsFor(m: MemberHistoryInput, gw: number): number | null {
  const row = m.current.find((c) => c.event === gw)
  return row ? row.points : null
}

function chipLabel(name: string): string {
  const map: Record<string, string> = { wildcard: "Wildcard", freehit: "Free Hit", "3xc": "Triple Captain", bboost: "Bench Boost" }
  return map[name] ?? name
}

export function computeLeaguePersonality(
  rows: MemberGWRow[],
  fplAvg: number,
  chipCount: number,
  pointsSpread: number
): string {
  const leagueAvg = rows.reduce((s, r) => s + r.gwPts, 0) / Math.max(rows.length, 1)
  if (chipCount >= 3) return "Chip-heavy gameweek"
  if (leagueAvg >= fplAvg + 8) return "High-scoring shootout"
  if (leagueAvg <= fplAvg - 6) return "Grinding defensive week"
  if (pointsSpread <= 25) return "Tight chess match"
  if (pointsSpread >= 60) return "Wide open free-for-all"
  return "Balanced competitive week"
}

export function computePodiumShuffle(
  podium: MemberGWRow[],
  prevPodium: MemberGWRow[]
): { dropped: MemberGWRow[]; joined: MemberGWRow[]; held: MemberGWRow[] } {
  const currIds = new Set(podium.map((p) => p.entryId))
  const prevIds = new Set(prevPodium.map((p) => p.entryId))
  return {
    dropped: prevPodium.filter((p) => !currIds.has(p.entryId)),
    joined: podium.filter((p) => !prevIds.has(p.entryId)),
    held: podium.filter((p) => prevIds.has(p.entryId)),
  }
}

export function computeMilestones(
  gw: number,
  rows: MemberGWRow[],
  user: MemberGWRow | null,
  prevUser: MemberGWRow | null,
  gwWinner: MemberGWRow,
  members: MemberHistoryInput[],
  leagueRecordGwScore: number
): string[] {
  const out: string[] = []
  if (gwWinner.gwPts >= leagueRecordGwScore && gw > 1) {
    out.push(`${gwWinner.team} posted a league-record ${pts(gwWinner.gwPts)} in Gameweek ${gw}`)
  } else if (gw === 1) {
    out.push(`${gwWinner.team} set the early benchmark with ${pts(gwWinner.gwPts)} in the opening gameweek`)
  }

  if (user && prevUser) {
    if (user.rank <= 3 && prevUser.rank > 3) {
      const place = user.rank === 1 ? "first" : user.rank === 2 ? "second" : "third"
      out.push(`You reached the podium for the first time, sitting ${place} in the league`)
    }
    if (user.rank === rows.length && prevUser.rank < rows.length) {
      out.push(`You hit the bottom of ${rows.length > 1 ? "the table" : "the league"} for the first time this season`)
    }
    if (user.rank === 1 && prevUser.rank !== 1) {
      out.push(`You took the league lead for the first time on ${user.totalPts} points`)
    }
  }

  const prevLeader = gw > 1 ? null : null // handled elsewhere via newLeader

  if (gw === 1 && rows.length > 0) {
    out.push(`The opening gameweek established the first pecking order across ${spellN(rows.length)} managers`)
  }

  return out
}

export function computeChipVerdicts(
  chipPlayers: MemberGWRow[],
  leagueAvgGw: number,
  fplAvg: number
): SeasonStoryFacts["chipVerdicts"] {
  return chipPlayers.map((p) => ({
    team: p.team,
    manager: p.manager,
    chip: chipLabel(p.chipsPlayed[0] ?? "chip"),
    gwPts: p.gwPts,
    vsLeagueAvg: p.gwPts - leagueAvgGw,
    vsFplAvg: p.gwPts - fplAvg,
  }))
}

export function computeConsistencyCrown(
  members: MemberHistoryInput[],
  gw: number,
  window = 5
): SeasonStoryFacts["consistencyManager"] {
  if (gw < 3) return null
  const start = Math.max(1, gw - window + 1)
  let best: { team: string; manager: string; stdDev: number } | null = null

  for (const m of members) {
    const scores: number[] = []
    for (let g = start; g <= gw; g++) {
      const p = gwPtsFor(m, g)
      if (p !== null) scores.push(p)
    }
    if (scores.length < 3) continue
    const sd = stdDev(scores)
    if (!best || sd < best.stdDev) {
      best = { team: m.team, manager: m.manager, stdDev: Math.round(sd * 10) / 10 }
    }
  }
  return best
}

export function computeHeadToHead(
  members: MemberHistoryInput[],
  userEntryId: number,
  rivalEntryId: number,
  throughGw: number
): { userWins: number; rivalWins: number; draws: number } {
  let userWins = 0
  let rivalWins = 0
  let draws = 0
  const user = members.find((m) => m.entryId === userEntryId)
  const rival = members.find((m) => m.entryId === rivalEntryId)
  if (!user || !rival) return { userWins, rivalWins, draws }

  for (let g = 1; g <= throughGw; g++) {
    const up = gwPtsFor(user, g)
    const rp = gwPtsFor(rival, g)
    if (up === null || rp === null) continue
    if (up > rp) userWins++
    else if (rp > up) rivalWins++
    else draws++
  }
  return { userWins, rivalWins, draws }
}

export function computeRivalStreak(
  members: MemberHistoryInput[],
  userEntryId: number,
  rivalEntryId: number,
  throughGw: number,
  window = 5
): { wins: number; total: number } {
  const start = Math.max(1, throughGw - window + 1)
  let wins = 0
  let total = 0
  const user = members.find((m) => m.entryId === userEntryId)
  const rival = members.find((m) => m.entryId === rivalEntryId)
  if (!user || !rival) return { wins, total }

  for (let g = start; g <= throughGw; g++) {
    const up = gwPtsFor(user, g)
    const rp = gwPtsFor(rival, g)
    if (up === null || rp === null) continue
    total++
    if (up > rp) wins++
  }
  return { wins, total }
}

export function computeLeagueRecordGwScore(
  members: MemberHistoryInput[],
  beforeGw: number
): number {
  let max = 0
  for (const m of members) {
    for (const c of m.current) {
      if (c.event < beforeGw) max = Math.max(max, c.points)
    }
  }
  return max
}

export function computeLeagueAvgGwPts(rows: MemberGWRow[]): number {
  if (rows.length === 0) return 0
  return Math.round((rows.reduce((s, r) => s + r.gwPts, 0) / rows.length) * 10) / 10
}

export function computeLeagueMedianGwPts(rows: MemberGWRow[]): number {
  return median(rows.map((r) => r.gwPts))
}
