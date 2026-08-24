import {
  OPENING,
  PHASE_FRAMING,
  GW_WINNER,
  LEADER_TIGHT,
  LEADER_RUNAWAY,
  NEW_LEADER,
  MOVER_UP,
  MOVER_DOWN,
  USER_STORY,
  CHIP_DRAMA,
  NO_CHIPS,
  TRANSFER_HITS,
  BENCH_STORY,
  BOTTOM_TABLE,
  LEAGUE_CHARACTER,
  CLOSING,
} from "./season-story-templates"

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
  bullets: string[]
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

  const opener = render(OPENING, facts, "opening")
  const phase = render(PHASE_FRAMING, facts, "phase")
  paragraphs.push(`${opener} ${phase}`)

  paragraphs.push(render(GW_WINNER, facts, "gw_winner"))

  if (facts.newLeader) {
    const leadChange = render(NEW_LEADER, facts, "new_leader")
    if (leadChange) paragraphs.push(leadChange)
  }

  paragraphs.push(
    render(facts.runawayLeader ? LEADER_RUNAWAY : LEADER_TIGHT, facts, "leader")
  )

  const moverUp = render(MOVER_UP, facts, "mover_up")
  if (moverUp && facts.biggestClimber && facts.biggestClimber.rankChange >= 2) {
    paragraphs.push(moverUp)
  }

  const moverDown = render(MOVER_DOWN, facts, "mover_down")
  if (moverDown && facts.biggestFaller && facts.biggestFaller.rankChange >= 2) {
    paragraphs.push(moverDown)
  }

  if (facts.chipPlayers.length > 0) {
    const chip = render(CHIP_DRAMA, facts, "chips")
    if (chip) paragraphs.push(chip)
  } else if (facts.gw >= 3) {
    paragraphs.push(render(NO_CHIPS, facts, "no_chips"))
  }

  if (facts.hitTakers.length > 0) {
    const hits = render(TRANSFER_HITS, facts, "hits")
    if (hits) paragraphs.push(hits)
  }

  if (facts.benchHero) {
    const bench = render(BENCH_STORY, facts, "bench")
    if (bench) paragraphs.push(bench)
  }

  if (facts.user) {
    paragraphs.push(render(USER_STORY, facts, "user"))
  }

  paragraphs.push(render(LEAGUE_CHARACTER, facts, "character"))
  paragraphs.push(render(BOTTOM_TABLE, facts, "bottom"))
  paragraphs.push(render(CLOSING, facts, "closing"))

  const headline = `${facts.leagueName} · Gameweek ${facts.gw}`

  const bullets: string[] = [
    `GW top scorer: ${facts.gwWinner.team} (${facts.gwWinner.gwPts} pts)`,
    `League leader: ${facts.leader.team} (${facts.leader.totalPts} pts)`,
  ]
  if (facts.biggestClimber && facts.biggestClimber.rankChange >= 2) {
    bullets.push(`Biggest climber: ${facts.biggestClimber.team} (+${facts.biggestClimber.rankChange})`)
  }
  if (facts.biggestFaller && facts.biggestFaller.rankChange >= 2) {
    bullets.push(`Biggest faller: ${facts.biggestFaller.team} (-${facts.biggestFaller.rankChange})`)
  }
  if (facts.user) {
    bullets.push(`You: ${facts.user.gwPts} pts, ${facts.user.rank}${ordinalSuffix(facts.user.rank)} place`)
  }
  if (facts.chipPlayers.length > 0) {
    bullets.push(`Chips played: ${facts.chipPlayers.map((p) => p.team).join(", ")}`)
  }

  return { gw: facts.gw, headline, paragraphs, bullets }
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
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
