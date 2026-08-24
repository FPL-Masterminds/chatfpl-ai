import {
  ledeFor,
  standingsFor,
  podiumFor,
  personalFor,
  spoonFor,
  codaFor,
  FIXTURE,
  PERSONALITY,
  CAPTAINCY,
  MOVEMENT,
  GAP_DYNAMICS,
  SUBPLOTS,
  CHIP_VERDICT,
  HIT_REGRET,
  MILESTONES,
  CONSISTENCY,
  RIVALRY,
} from "./season-story-sections"
import {
  canDiscussRankMovement,
  canDiscussRivalryArc,
  canDiscussGapChange,
  benchMentionMinPts,
} from "./season-story-copy"
import {
  computeChipVerdicts,
  computeConsistencyCrown,
  computeHeadToHead,
  computeLeagueAvgGwPts,
  computeLeagueMedianGwPts,
  computeLeaguePersonality,
  computeLeagueRecordGwScore,
  computeMilestones,
  computePodiumShuffle,
  computeRivalStreak,
} from "./season-story-analytics"
import type { GWFixtureContext } from "./season-story-fixtures"
import { pickFromPool } from "./season-story-seed"
import { pickStoryQuestion } from "./season-story-questions"

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

export interface ChipVerdict {
  team: string
  manager: string
  chip: string
  gwPts: number
  vsLeagueAvg: number
  vsFplAvg: number
}

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
  fixtureContext: GWFixtureContext | null
  leaguePersonality: string
  leagueAvgGwPts: number
  leagueMedianGwPts: number
  podium: MemberGWRow[]
  prevPodium: MemberGWRow[]
  podiumJoined: MemberGWRow[]
  podiumDropped: MemberGWRow[]
  podiumHeld: MemberGWRow[]
  directRival: MemberGWRow | null
  rivalStreakWins: number
  rivalStreakTotal: number
  h2hUserWins: number
  h2hRivalWins: number
  h2hDraws: number
  gapToLeaderChange: number | null
  milestones: string[]
  chipVerdicts: ChipVerdict[]
  hitRegret: MemberGWRow[]
  consistencyManager: { team: string; manager: string; stdDev: number } | null
  secondBottom: MemberGWRow | null
  spoonRaceGap: number
  userVsMedian: number
  leagueRecordGwScore: number
  isLeagueRecordGw: boolean
  allTeamNames: string[]
  allManagerNames: string[]
}

export interface SeasonStoryEntities {
  league: string
  teams: string[]
  managers: string[]
}

export type SeasonStoryBlockStyle = "lede" | "section" | "personal" | "closing" | "fixture"

export interface SeasonStoryBlock {
  slot: string
  label?: string
  question: string
  text: string
  style: SeasonStoryBlockStyle
}

export interface SeasonStory {
  gw: number
  headline: string
  paragraphs: SeasonStoryBlock[]
  entities: SeasonStoryEntities
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

function render(templates: ((f: SeasonStoryFacts) => string)[], facts: SeasonStoryFacts, slot: string): string {
  const tpl = pickFromPool(templates, facts, slot)
  return tpl(facts).trim()
}

const SLOT_META: Record<string, { label?: string; style: SeasonStoryBlockStyle }> = {
  lede: { style: "lede" },
  fixture: { label: "Fixtures", style: "fixture" },
  personality: { label: "The Mood", style: "section" },
  standings: { label: "The Table", style: "section" },
  podium: { label: "Podium", style: "section" },
  movement: { label: "Movers", style: "section" },
  gap: { label: "Chasing the Lead", style: "personal" },
  captaincy: { label: "Template Check", style: "section" },
  subplots: { label: "Off the Pitch", style: "section" },
  chip_verdict: { label: "Chip Watch", style: "section" },
  hit_regret: { label: "Transfer Hits", style: "section" },
  milestones: { label: "Milestones", style: "section" },
  consistency: { label: "Mr Reliable", style: "section" },
  rivalry: { label: "Head to Head", style: "personal" },
  personal: { label: "Your Week", style: "personal" },
  spoon: { label: "The Basement", style: "section" },
  coda: { style: "closing" },
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
  userEntryId: number,
  prevRankMap?: Map<number, number>
): MemberGWRow[] {
  const raw = members
    .map((m) => {
      const curr = m.current.find((c) => c.event === gw)
      if (!curr) return null
      const chipsPlayed = (m.chips ?? []).filter((c) => c.event === gw).map((c) => c.name)
      const prev = prevRankMap?.get(m.entryId) ?? null
      const rank = 0
      return {
        entryId: m.entryId,
        team: m.team,
        manager: m.manager,
        gwPts: curr.points,
        totalPts: curr.total_points,
        rank,
        prevRank: prev,
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
  raw.forEach((r, i) => {
    r.rank = i + 1
    r.rankChange = r.prevRank !== null ? r.prevRank - r.rank : 0
  })
  return raw
}

function buildGWCache(
  members: MemberHistoryInput[],
  userEntryId: number,
  throughGw: number
): Map<number, MemberGWRow[]> {
  const cache = new Map<number, MemberGWRow[]>()
  let prevRanks = new Map<number, number>()
  for (let g = 1; g <= throughGw; g++) {
    const rows = buildRowsAtGW(members, g, userEntryId, prevRanks)
    cache.set(g, rows)
    prevRanks = new Map(rows.map((r) => [r.entryId, r.rank]))
  }
  return cache
}

export function buildSeasonStoryFacts(
  gw: number,
  leagueId: number,
  leagueName: string,
  members: MemberHistoryInput[],
  userEntryId: number,
  fplAvg: number,
  fixtureContext: GWFixtureContext | null = null
): SeasonStoryFacts | null {
  const cache = buildGWCache(members, userEntryId, gw)
  const rows = cache.get(gw)
  if (!rows || rows.length === 0) return null

  const prevRows = gw > 1 ? cache.get(gw - 1) ?? [] : []
  const sortedByGw = [...rows].sort((a, b) => b.gwPts - a.gwPts)
  const gwWinner = sortedByGw[0]
  const leader = rows[0]
  const second = rows[1] ?? null
  const woodenSpoon = rows[rows.length - 1]
  const secondBottom = rows.length >= 2 ? rows[rows.length - 2] : null
  const gapFirstSecond = second ? leader.totalPts - second.totalPts : 0
  const gapFirstLast = leader.totalPts - woodenSpoon.totalPts
  const spoonRaceGap = secondBottom ? secondBottom.totalPts - woodenSpoon.totalPts : 0
  const user = rows.find((r) => r.isUser) ?? null
  const prevUser = prevRows.find((r) => r.isUser) ?? null
  const gapToLeader = user ? leader.totalPts - user.totalPts : 0

  let gapToLeaderChange: number | null = null
  if (user && gw > 1) {
    const prevUserRow = prevRows.find((r) => r.entryId === user.entryId)
    const prevLeaderRow = prevRows[0]
    if (prevUserRow && prevLeaderRow) {
      const oldGap = prevLeaderRow.totalPts - prevUserRow.totalPts
      gapToLeaderChange = oldGap - gapToLeader
    }
  }

  const climbers = rows.filter((r) => r.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange)
  const fallers = rows.filter((r) => r.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange)

  const prevLeader = prevRows[0] ?? null
  const newLeader = !!(prevLeader && prevLeader.entryId !== leader.entryId)
  const leaderChangedFrom = newLeader ? prevLeader : null

  const chipPlayers = rows.filter((r) => r.chipsPlayed.length > 0)
  const hitTakers = rows.filter((r) => r.transferCost > 0).sort((a, b) => b.transferCost - a.transferCost)
  const hitRegret = hitTakers.filter((r) => r.gwPts < fplAvg)
  const benchHero = [...rows].sort((a, b) => b.benchPts - a.benchPts)[0]
  const beatAvgCount = rows.filter((r) => r.gwPts > fplAvg).length
  const leagueAvgGwPts = computeLeagueAvgGwPts(rows)
  const leagueMedianGwPts = computeLeagueMedianGwPts(rows)
  const userVsMedian = user ? user.gwPts - leagueMedianGwPts : 0

  const tightLeague = gapFirstSecond <= 12 || gapFirstLast <= 30
  const runawayLeader = gapFirstSecond >= 25

  const podium = rows.slice(0, 3)
  const prevPodium = prevRows.slice(0, 3)
  const { dropped, joined, held } = computePodiumShuffle(podium, prevPodium)

  const directRival = user
    ? (user.rank > 1
      ? rows.find((r) => r.rank === user.rank - 1)
      : rows.find((r) => r.rank === 2)) ?? null
    : null

  const rivalStreak = directRival
    ? computeRivalStreak(members, userEntryId, directRival.entryId, gw)
    : { wins: 0, total: 0 }
  const h2h = directRival
    ? computeHeadToHead(members, userEntryId, directRival.entryId, gw)
    : { userWins: 0, rivalWins: 0, draws: 0 }

  const leagueRecordGwScore = computeLeagueRecordGwScore(members, gw)
  const isLeagueRecordGw = gwWinner.gwPts > leagueRecordGwScore || gw === 1

  const milestones = computeMilestones(gw, rows, user, prevUser, gwWinner, members, leagueRecordGwScore)
  const chipVerdicts = computeChipVerdicts(chipPlayers, leagueAvgGwPts, fplAvg)
  const consistencyManager = computeConsistencyCrown(members, gw)
  const leaguePersonality = computeLeaguePersonality(rows, fplAvg, chipPlayers.length, gapFirstLast)

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
    userBeatAvg: user ? user.gwPts > fplAvg : false,
    chipPlayers,
    hitTakers,
    benchHero: benchHero && benchHero.benchPts >= benchMentionMinPts(gw) ? benchHero : null,
    beatAvgCount,
    tightLeague,
    runawayLeader,
    woodenSpoon,
    fixtureContext,
    leaguePersonality,
    leagueAvgGwPts,
    leagueMedianGwPts,
    podium,
    prevPodium,
    podiumJoined: joined,
    podiumDropped: dropped,
    podiumHeld: held,
    directRival,
    rivalStreakWins: rivalStreak.wins,
    rivalStreakTotal: rivalStreak.total,
    h2hUserWins: h2h.userWins,
    h2hRivalWins: h2h.rivalWins,
    h2hDraws: h2h.draws,
    gapToLeaderChange,
    milestones,
    chipVerdicts,
    hitRegret,
    consistencyManager,
    secondBottom,
    spoonRaceGap,
    userVsMedian,
    leagueRecordGwScore,
    isLeagueRecordGw,
    allTeamNames: [...new Set(rows.map((r) => r.team).filter(Boolean))],
    allManagerNames: [...new Set(rows.map((r) => r.manager).filter(Boolean))],
  }
}

export function generateSeasonStory(facts: SeasonStoryFacts): SeasonStory {
  type Slot = {
    getTemplates: (f: SeasonStoryFacts) => ((f: SeasonStoryFacts) => string)[]
    slot: string
    skip?: (f: SeasonStoryFacts) => boolean
  }

  const slots: Slot[] = [
    { getTemplates: ledeFor, slot: "lede" },
    { getTemplates: () => FIXTURE, slot: "fixture", skip: (f) => !f.fixtureContext?.isDGW && !f.fixtureContext?.isBGW },
    { getTemplates: () => PERSONALITY, slot: "personality" },
    { getTemplates: standingsFor, slot: "standings" },
    { getTemplates: podiumFor, slot: "podium" },
    { getTemplates: () => MOVEMENT, slot: "movement", skip: (f) => !canDiscussRankMovement(f.gw) },
    { getTemplates: () => GAP_DYNAMICS, slot: "gap", skip: (f) => !f.user || !canDiscussGapChange(f.gw) },
    { getTemplates: () => CAPTAINCY, slot: "captaincy", skip: (f) => !f.user },
    { getTemplates: () => SUBPLOTS, slot: "subplots" },
    { getTemplates: () => CHIP_VERDICT, slot: "chip_verdict", skip: (f) => f.chipVerdicts.length === 0 },
    { getTemplates: () => HIT_REGRET, slot: "hit_regret", skip: (f) => f.hitRegret.length === 0 },
    { getTemplates: () => MILESTONES, slot: "milestones", skip: (f) => f.milestones.length === 0 },
    { getTemplates: () => CONSISTENCY, slot: "consistency", skip: (f) => !f.consistencyManager },
    { getTemplates: () => RIVALRY, slot: "rivalry", skip: (f) => !f.directRival || !f.user || !canDiscussRivalryArc(f.gw) },
    { getTemplates: personalFor, slot: "personal", skip: (f) => !f.user },
    { getTemplates: spoonFor, slot: "spoon" },
    { getTemplates: codaFor, slot: "coda" },
  ]

  const paragraphs: SeasonStoryBlock[] = []
  for (const { getTemplates, slot, skip } of slots) {
    if (skip?.(facts)) continue
    const templates = getTemplates(facts)
    const text = render(templates, facts, slot)
    if (!text) continue
    const meta = SLOT_META[slot] ?? { style: "section" as const }
    paragraphs.push({
      slot,
      label: meta.label,
      question: pickStoryQuestion(slot, facts.gw, facts.leagueId),
      text,
      style: meta.style,
    })
  }

  return {
    gw: facts.gw,
    headline: `${facts.leagueName} · Gameweek ${facts.gw}`,
    paragraphs,
    entities: {
      league: facts.leagueName,
      teams: facts.allTeamNames,
      managers: facts.allManagerNames,
    },
  }
}

export function generateAllSeasonStories(
  leagueId: number,
  leagueName: string,
  members: MemberHistoryInput[],
  userEntryId: number,
  completedGws: { gw: number; avg: number; provisional?: boolean }[],
  fixtureContexts: Map<number, GWFixtureContext> = new Map()
): SeasonStory[] {
  return completedGws
    .map(({ gw, avg, provisional }) => {
      const facts = buildSeasonStoryFacts(
        gw,
        leagueId,
        leagueName,
        members,
        userEntryId,
        avg,
        fixtureContexts.get(gw) ?? null
      )
      if (!facts) return null
      const story = generateSeasonStory(facts)
      if (provisional) story.provisional = true
      return story
    })
    .filter((s): s is SeasonStory => s !== null)
    .sort((a, b) => a.gw - b.gw)
}
