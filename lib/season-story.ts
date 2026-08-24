import {
  LEDE,
  STANDINGS,
  MOVEMENT,
  SUBPLOTS,
  PERSONAL,
  CODA,
} from "./season-story-paragraphs"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemberGWRow {
  entryId: number
  team: string
  manager: string
  gwPts: number
  totalPts: number
  rank: number
  prevRank: number | null
  rankChange: number
  benchPts: number
  transferCost: number
  transfers: number
  chipsPlayed: string[]
  isUser: boolean
}

export type SeasonPhase = "opening" | "early" | "mid" | "second_half" | "run_in" | "final"

export interface SeasonStoryFacts {
  gw: number
  leagueId: number
  leagueName: string
  leagueSize: number
  fplAvg: number
  phase: SeasonPhase
  gwWinner: MemberGWRow
  leader: MemberGWRow
  second: MemberGWRow | null
  gapFirstSecond: number
  gapFirstLast: number
  gapToLeader: number
  pointsSpread: number
  biggestClimber: MemberGWRow | null
  biggestFaller: MemberGWRow | null
  newLeader: boolean
  leaderChangedFrom: MemberGWRow | null
  user: MemberGWRow | null
  userBeatAvg: boolean
  chipPlayers: MemberGWRow[]
  hitTakers: MemberGWRow[]
  benchHero: MemberGWRow | null
  beatAvgCount: number
  tightLeague: boolean
  runawayLeader: boolean
  woodenSpoon: MemberGWRow
}

export interface SeasonStory {
  gw: number
  headline: string
  paragraphs: string[]
  provisional?: boolean
}

export interface MemberHistoryInput {
  entryId: number
  team: string
  manager: string
  current: {
    event: number
    points: number
    total_points: number
    points_on_bench?: number
    event_transfers?: number
    event_transfers_cost?: number
  }[]
  chips?: { name: string; event: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashSeed(leagueId: number, gw: number, slot: string): number {
  const str = `${leagueId}-${gw}-${slot}`
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickVariant<T>(variants: T[], leagueId: number, gw: number, slot: string): T {
  if (variants.length === 0) throw new Error(`No variants for slot ${slot}`)
  return variants[hashSeed(leagueId, gw, slot) % variants.length]
}

function render(templates: ((f: SeasonStoryFacts) => string)[], facts: SeasonStoryFacts, slot: string): string {
  const tpl = pickVariant(templates, facts.leagueId, facts.gw, slot)
  return tpl(facts).trim()
}

export function getSeasonPhase(gw: number): SeasonPhase {
  if (gw === 38) return "final"
  if (gw >= 34) return "run_in"
  if (gw === 20) return "second_half"
  if (gw >= 21) return "mid"
  if (gw >= 10) return "mid"
  if (gw >= 4) return "early"
  return "opening"
}

function buildRowsAtGW(
  members: MemberHistoryInput[],
  gw: number,
  userEntryId: number
): MemberGWRow[] {
  const raw = members
    .map((m) => {
      const curr = m.current.find((c) => c.event === gw)
      if (!curr) return null
      const chipsPlayed = (m.chips ?? []).filter((c) => c.event === gw).map((c) => c.name)
      return {
        entryId: m.entryId,
        team: m.team,
        manager: m.manager,
        gwPts: curr.points,
        totalPts: curr.total_points,
        rank: 0,
        prevRank: null as number | null,
        rankChange: 0,
        benchPts: curr.points_on_bench ?? 0,
        transferCost: curr.event_transfers_cost ?? 0,
        transfers: curr.event_transfers ?? 0,
        chipsPlayed,
        isUser: m.entryId === userEntryId,
      }
    })
    .filter((r): r is MemberGWRow => r !== null)

  raw.sort((a, b) => b.totalPts - a.totalPts || b.gwPts - a.gwPts)
  raw.forEach((r, i) => { r.rank = i + 1 })

  if (gw > 1) {
    const prevRows = buildRowsAtGW(members, gw - 1, userEntryId)
    const prevRankMap = new Map(prevRows.map((r) => [r.entryId, r.rank]))
    raw.forEach((r) => {
      const prev = prevRankMap.get(r.entryId) ?? null
      r.prevRank = prev
      r.rankChange = prev !== null ? prev - r.rank : 0
    })
  }

  return raw
}

export function buildSeasonStoryFacts(
  gw: number,
  leagueId: number,
  leagueName: string,
  members: MemberHistoryInput[],
  userEntryId: number,
  fplAvg: number
): SeasonStoryFacts | null {
  const rows = buildRowsAtGW(members, gw, userEntryId)
  if (rows.length === 0) return null

  const sortedByGw = [...rows].sort((a, b) => b.gwPts - a.gwPts)
  const gwWinner = sortedByGw[0]
  const leader = rows[0]
  const second = rows[1] ?? null
  const woodenSpoon = rows[rows.length - 1]
  const gapFirstSecond = second ? leader.totalPts - second.totalPts : 0
  const gapFirstLast = leader.totalPts - woodenSpoon.totalPts
  const user = rows.find((r) => r.isUser) ?? null
  const gapToLeader = user ? leader.totalPts - user.totalPts : 0

  const climbers = rows.filter((r) => r.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange)
  const fallers = rows.filter((r) => r.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange)

  const prevLeader = gw > 1 ? buildRowsAtGW(members, gw - 1, userEntryId)[0] : null
  const newLeader = !!(prevLeader && prevLeader.entryId !== leader.entryId)
  const leaderChangedFrom = newLeader ? prevLeader : null

  const chipPlayers = rows.filter((r) => r.chipsPlayed.length > 0)
  const hitTakers = rows.filter((r) => r.transferCost > 0).sort((a, b) => b.transferCost - a.transferCost)
  const benchHero = [...rows].sort((a, b) => b.benchPts - a.benchPts)[0]
  const beatAvgCount = rows.filter((r) => r.gwPts > fplAvg).length

  const tightLeague = gapFirstSecond <= 12 || gapFirstLast <= 30
  const runawayLeader = gapFirstSecond >= 25

  return {
    gw,
    leagueId,
    leagueName,
    leagueSize: rows.length,
    fplAvg,
    phase: getSeasonPhase(gw),
    gwWinner,
    leader,
    second,
    gapFirstSecond,
    gapFirstLast,
    gapToLeader,
    pointsSpread: gapFirstLast,
    biggestClimber: climbers[0] ?? null,
    biggestFaller: fallers[0] ?? null,
    newLeader,
    leaderChangedFrom,
    user,
    userBeatAvg: user ? user.gwPts >= fplAvg : false,
    chipPlayers,
    hitTakers,
    benchHero: benchHero && benchHero.benchPts >= 12 ? benchHero : null,
    beatAvgCount,
    tightLeague,
    runawayLeader,
    woodenSpoon,
  }
}

export function generateSeasonStory(facts: SeasonStoryFacts): SeasonStory {
  const paragraphs: string[] = []

  const slots: { templates: ((f: SeasonStoryFacts) => string)[]; slot: string }[] = [
    { templates: LEDE, slot: "lede" },
    { templates: STANDINGS, slot: "standings" },
    { templates: MOVEMENT, slot: "movement" },
    { templates: SUBPLOTS, slot: "subplots" },
    { templates: PERSONAL, slot: "personal" },
    { templates: CODA, slot: "coda" },
  ]

  for (const { templates, slot } of slots) {
    const text = render(templates, facts, slot).trim()
    if (text) paragraphs.push(text)
  }

  const headline = `${facts.leagueName} · Gameweek ${facts.gw}`

  return { gw: facts.gw, headline, paragraphs }
}

export function generateAllSeasonStories(
  leagueId: number,
  leagueName: string,
  members: MemberHistoryInput[],
  userEntryId: number,
  completedGws: { gw: number; avg: number; provisional?: boolean }[]
): SeasonStory[] {
  return completedGws
    .map(({ gw, avg, provisional }) => {
      const facts = buildSeasonStoryFacts(gw, leagueId, leagueName, members, userEntryId, avg)
      if (!facts) return null
      const story = generateSeasonStory(facts)
      if (provisional) story.provisional = true
      return story
    })
    .filter((s): s is SeasonStory => s !== null)
    .sort((a, b) => a.gw - b.gw)
}
