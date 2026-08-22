// ═══════════════════════════════════════════════════════════════════════════════
// DEFCON HUB — Defensive Contributions programmatic pages
// ═══════════════════════════════════════════════════════════════════════════════
// DEFCON is the 2025/26 scoring rule where defenders earn +2pts for reaching
// 10+ CBIT (clearances + blocks + interceptions + tackles) in a match, and
// midfielders earn +2pts for reaching 12+ CBIT + ball recoveries. GKPs and
// FWDs do not qualify. This file exposes the data + copy logic that powers
// every /fpl/defcon/* page.
//
// All page routes share these helpers so the hub, position hubs, price-band
// hubs, individual player pages, and compare pages stay in lock-step.

import {
  getBootstrap,
  filterEligiblePlayers,
  buildSlugLookup,
  toSlug,
  getDisplayName,
  FPL_HEADERS,
  type CaptainHubPlayer,
} from "./fpl-player-page"

// ─── Constants ────────────────────────────────────────────────────────────────

/** DEF and MID only earn DEFCON. */
const DEFCON_POSITIONS = new Set([2, 3])

/**
 * A player somewhere in the league is considered "mid-season" once they have
 * 600+ minutes. Below that we relax eligibility so the hub isn't empty in
 * August. Once anyone crosses it, all pages tighten to the mid-season rule.
 */
const MIDSEASON_MINUTE_THRESHOLD = 600
const MINS_FLOOR_MIDSEASON = 450
const MINS_FLOOR_EARLY = 90

/** DEF/MID sitemap-worthy per-90 floor once we have a mature sample. */
const DC90_FLOOR_MIDSEASON = 0.3

/**
 * DATA READINESS. Below this line the FPL API's defensive_contribution and
 * per-90 fields cannot be trusted for the current season because they either
 * carry residual last-season totals or divide by too-small a denominator.
 *
 * DEFCON pages will only render live numbers once at least one player in the
 * league has this many minutes played (roughly four full 90-minute matches).
 * Below the threshold every page renders a "coming soon" placeholder with
 * context and links out - no stats, no rankings, no compare pages.
 */
export const DEFCON_READY_MINUTES = 360

/** Price bands - mirror the best-value hub for consistency. */
export const DEFCON_PRICE_META: Record<string, { cap: number; label: string; nice: string }> = {
  "under-4m":   { cap: 40, label: "£4.0m", nice: "£4.0m" },
  "under-4-5m": { cap: 45, label: "£4.5m", nice: "£4.5m" },
  "under-5m":   { cap: 50, label: "£5.0m", nice: "£5.0m" },
  "under-5-5m": { cap: 55, label: "£5.5m", nice: "£5.5m" },
  "under-6m":   { cap: 60, label: "£6.0m", nice: "£6.0m" },
  "under-6-5m": { cap: 65, label: "£6.5m", nice: "£6.5m" },
  "under-7m":   { cap: 70, label: "£7.0m", nice: "£7.0m" },
  "under-7-5m": { cap: 75, label: "£7.5m", nice: "£7.5m" },
  "under-8m":   { cap: 80, label: "£8.0m", nice: "£8.0m" },
}

export const DEFCON_PRICE_SLUGS = Object.keys(DEFCON_PRICE_META)

export const DEFCON_POSITION_META: Record<string, {
  elementType: number
  label: string
  singular: string
  cbitThreshold: number
}> = {
  defenders:   { elementType: 2, label: "Defenders",   singular: "Defender",    cbitThreshold: 10 },
  midfielders: { elementType: 3, label: "Midfielders", singular: "Midfielder",  cbitThreshold: 12 },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DefconPlayer extends CaptainHubPlayer {
  /** Total matches this season the +2pt DEFCON was earned. */
  dc: number
  /** DEFCON matches per 90 minutes. Primary ranking metric. */
  dc90: number
  /** Clearances + blocks + interceptions + tackles (raw total). */
  cbit: number
  minutes: number
  elementType: number
  totalPts: number
  smallSample: boolean
}

export interface DefconHubData {
  gw: number
  defenders: DefconPlayer[]
  midfielders: DefconPlayer[]
  early: boolean
  ready: boolean
  maxMinutes: number
}

export interface DefconPositionHubData {
  gw: number
  players: DefconPlayer[]
  positionSlug: string
  positionLabel: string
  positionSingular: string
  cbitThreshold: number
  early: boolean
  ready: boolean
  maxMinutes: number
}

export interface DefconPriceHubData extends DefconPositionHubData {
  priceSlug: string
  priceLabel: string
  priceCap: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function buildDefconPlayer(
  p: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>,
  slugById: Map<number, string>,
  fdrByTeam: Record<number, number>,
  opponentByTeam: Record<number, { short: string; name: string; code: number; isHome: boolean }>,
  smallSample: boolean,
): DefconPlayer {
  const team = teamMap[p.team] ?? { name: "", short: "?", code: 0 }
  const slug = slugById.get(p.id) ?? toSlug(p.web_name)
  const dc   = toNumber(p.defensive_contribution)
  const dc90 = toNumber(p.defensive_contribution_per_90)
  const cbi  = toNumber(p.clearances_blocks_interceptions)
  const tkl  = toNumber(p.tackles)
  return {
    slug,
    displayName:   getDisplayName(p),
    webName:       p.web_name,
    code:          p.code,
    club:          team.name,
    teamCode:      team.code,
    position:      posMap[p.element_type] ?? "",
    price:         `£${(p.now_cost / 10).toFixed(1)}m`,
    form:          p.form ?? "0.0",
    ep_next:       toNumber(p.ep_next),
    ownership:     p.selected_by_percent ?? "0.0",
    news:          p.news ?? "",
    chance:        p.chance_of_playing_next_round ?? 100,
    fdrNext:       fdrByTeam[p.team] ?? null,
    transfersIn:   p.transfers_in_event ?? 0,
    opponentShort: opponentByTeam[p.team]?.short ?? "",
    opponentName:  opponentByTeam[p.team]?.name  ?? "",
    opponentCode:  opponentByTeam[p.team]?.code  ?? null,
    isHome:        opponentByTeam[p.team]?.isHome ?? null,
    dc,
    dc90,
    cbit:          cbi + tkl,
    minutes:       p.minutes ?? 0,
    elementType:   p.element_type,
    totalPts:      p.total_points ?? 0,
    smallSample,
  }
}

async function fetchFixtureContext(gw: number, teamMap: Record<number, { name: string; short: string; code: number }>) {
  const fdrByTeam: Record<number, number> = {}
  const opponentByTeam: Record<number, { short: string; name: string; code: number; isHome: boolean }> = {}
  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
      { headers: FPL_HEADERS, next: { revalidate: 900 } }
    )
    const fixtures = res.ok ? await res.json() : []
    fixtures.forEach((f: any) => {
      if (fdrByTeam[f.team_h] === undefined) fdrByTeam[f.team_h] = f.team_h_difficulty
      if (fdrByTeam[f.team_a] === undefined) fdrByTeam[f.team_a] = f.team_a_difficulty
      if (!opponentByTeam[f.team_h]) opponentByTeam[f.team_h] = { short: teamMap[f.team_a]?.short ?? "?", name: teamMap[f.team_a]?.name ?? "?", code: teamMap[f.team_a]?.code ?? 0, isHome: true }
      if (!opponentByTeam[f.team_a]) opponentByTeam[f.team_a] = { short: teamMap[f.team_h]?.short ?? "?", name: teamMap[f.team_h]?.name ?? "?", code: teamMap[f.team_h]?.code ?? 0, isHome: false }
    })
  } catch { /* fixtures optional */ }
  return { fdrByTeam, opponentByTeam }
}

/**
 * Base fetch used by every hub. Returns the eligible DEFs and MIDs ordered
 * by DC90 (primary), then DC (tiebreak), then minutes (final tiebreak).
 */
async function loadDefconContext() {
  const bootstrap = await getBootstrap()
  const events: any[] = bootstrap.events ?? []
  const nextEvent = events.find((e: any) => e.is_next)
  const currentEvent = events.find((e: any) => e.is_current)
  const gw: number = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

  const teamMap: Record<number, { name: string; short: string; code: number }> = {}
  const posMap: Record<number, string> = {}
  ;(bootstrap.teams ?? []).forEach((t: any) => {
    teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
  })
  ;(bootstrap.element_types ?? []).forEach((et: any) => {
    posMap[et.id] = et.singular_name_short
  })

  const { fdrByTeam, opponentByTeam } = await fetchFixtureContext(gw, teamMap)

  const allElements = bootstrap.elements ?? []
  const eligible = filterEligiblePlayers(allElements)
  const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
  const slugById = new Map<number, string>()
  for (const [slug, id] of slugLookup) slugById.set(id, slug)

  const maxMinutes = allElements.reduce((max: number, p: any) => Math.max(max, p.minutes ?? 0), 0)
  const anyMidseason = allElements.some((p: any) => (p.minutes ?? 0) >= MIDSEASON_MINUTE_THRESHOLD)
  const ready = maxMinutes >= DEFCON_READY_MINUTES
  const minsFloor = anyMidseason ? MINS_FLOOR_MIDSEASON : MINS_FLOOR_EARLY

  const rawDefcon = allElements
    .filter((p: any) => DEFCON_POSITIONS.has(p.element_type))
    .filter((p: any) => (p.status ?? "a") !== "u" && (p.status ?? "a") !== "s")
    .filter((p: any) => (p.minutes ?? 0) >= minsFloor)
    .filter((p: any) => {
      // In mid-season we also require an actual DC90 signal to prevent
      // low-CBIT nailed starters (attacking wingers etc.) from dominating.
      if (!anyMidseason) return true
      return toNumber(p.defensive_contribution_per_90) >= DC90_FLOOR_MIDSEASON
    })

  const players = rawDefcon.map((p: any) =>
    buildDefconPlayer(
      p, teamMap, posMap, slugById, fdrByTeam, opponentByTeam,
      !anyMidseason || (p.minutes ?? 0) < MINS_FLOOR_MIDSEASON,
    )
  )

  players.sort((a: DefconPlayer, b: DefconPlayer) => {
    if (Math.abs(b.dc90 - a.dc90) > 0.001) return b.dc90 - a.dc90
    if (b.dc !== a.dc) return b.dc - a.dc
    return b.minutes - a.minutes
  })

  return {
    gw,
    players,
    early: !anyMidseason,
    ready,
    maxMinutes,
    slugById,
    teamMap,
    posMap,
    fdrByTeam,
    opponentByTeam,
    allElements,
  }
}

// ─── Public data functions ────────────────────────────────────────────────────

export async function getDefconHub(): Promise<DefconHubData | null> {
  try {
    const ctx = await loadDefconContext()
    if (!ctx.ready) {
      return { gw: ctx.gw, defenders: [], midfielders: [], early: ctx.early, ready: false, maxMinutes: ctx.maxMinutes }
    }
    const defenders = ctx.players.filter(p => p.elementType === 2).slice(0, 10)
    const midfielders = ctx.players.filter(p => p.elementType === 3).slice(0, 10)
    return { gw: ctx.gw, defenders, midfielders, early: ctx.early, ready: true, maxMinutes: ctx.maxMinutes }
  } catch {
    return null
  }
}

export async function getDefconPositionHub(positionSlug: string): Promise<DefconPositionHubData | null> {
  try {
    const meta = DEFCON_POSITION_META[positionSlug]
    if (!meta) return null
    const ctx = await loadDefconContext()
    const players = ctx.ready
      ? ctx.players.filter(p => p.elementType === meta.elementType).slice(0, 40)
      : []
    return {
      gw: ctx.gw,
      players,
      positionSlug,
      positionLabel: meta.label,
      positionSingular: meta.singular,
      cbitThreshold: meta.cbitThreshold,
      early: ctx.early,
      ready: ctx.ready,
      maxMinutes: ctx.maxMinutes,
    }
  } catch {
    return null
  }
}

export async function getDefconPriceHub(
  positionSlug: string,
  priceSlug: string,
): Promise<DefconPriceHubData | null> {
  try {
    const posMeta = DEFCON_POSITION_META[positionSlug]
    const priceMeta = DEFCON_PRICE_META[priceSlug]
    if (!posMeta || !priceMeta) return null
    const ctx = await loadDefconContext()
    const players = ctx.ready
      ? ctx.players
          .filter(p => p.elementType === posMeta.elementType)
          .filter(p => parseFloat(p.price.replace("£", "").replace("m", "")) <= priceMeta.cap / 10)
          .slice(0, 30)
      : []
    return {
      gw: ctx.gw,
      players,
      positionSlug,
      positionLabel: posMeta.label,
      positionSingular: posMeta.singular,
      cbitThreshold: posMeta.cbitThreshold,
      early: ctx.early,
      ready: ctx.ready,
      maxMinutes: ctx.maxMinutes,
      priceSlug,
      priceLabel: priceMeta.label,
      priceCap: priceMeta.cap,
    }
  } catch {
    return null
  }
}

export interface DefconPlayerPageData {
  gw: number
  player: DefconPlayer
  rank: number
  positionRank: number
  positionTotal: number
  positionSlug: string
  peers: DefconPlayer[]
  qaItems: { question: string; answer: string }[]
  verdict: {
    label: string
    text: string
    bullets: string[]
  }
  early: boolean
}

export async function getDefconPlayerPage(slug: string): Promise<DefconPlayerPageData | null> {
  try {
    const ctx = await loadDefconContext()
    // Suppress individual DEFCON pages entirely until the season has enough
    // sample - they will simply 404 back to the placeholder hub.
    if (!ctx.ready) return null
    const player = ctx.players.find(p => p.slug === slug)
    if (!player) return null

    const positionSlug = player.elementType === 2 ? "defenders" : "midfielders"
    const posMeta = DEFCON_POSITION_META[positionSlug]
    const positionPlayers = ctx.players.filter(p => p.elementType === player.elementType)
    const positionRank = positionPlayers.findIndex(p => p.slug === player.slug) + 1
    const positionTotal = positionPlayers.length
    const rank = ctx.players.findIndex(p => p.slug === player.slug) + 1

    const peers = positionPlayers
      .filter(p => p.slug !== player.slug && Math.abs(p.dc90 - player.dc90) < 0.25)
      .slice(0, 4)

    const qaItems = buildDefconPlayerQA(player, ctx.gw, positionRank, positionTotal, posMeta.cbitThreshold)
    const verdict = buildDefconVerdict(player, positionRank, positionTotal)

    return {
      gw: ctx.gw,
      player,
      rank,
      positionRank,
      positionTotal,
      positionSlug,
      peers,
      qaItems,
      verdict,
      early: ctx.early,
    }
  } catch {
    return null
  }
}

export interface DefconCompareData {
  gw: number
  playerA: DefconPlayer
  playerB: DefconPlayer
  positionSlug: string
  cbitThreshold: number
  qaItems: { question: string; answer: string }[]
  verdict: {
    label: string
    text: string
    bullets: string[]
  }
  winner: "A" | "B" | "tie"
  early: boolean
}

export async function getDefconCompare(
  slugA: string,
  slugB: string,
): Promise<DefconCompareData | null> {
  try {
    const ctx = await loadDefconContext()
    if (!ctx.ready) return null
    const playerA = ctx.players.find(p => p.slug === slugA)
    const playerB = ctx.players.find(p => p.slug === slugB)
    if (!playerA || !playerB) return null
    if (playerA.elementType !== playerB.elementType) return null // only same-position

    const positionSlug = playerA.elementType === 2 ? "defenders" : "midfielders"
    const posMeta = DEFCON_POSITION_META[positionSlug]

    let winner: "A" | "B" | "tie" = "tie"
    if (playerA.dc90 > playerB.dc90 + 0.05) winner = "A"
    else if (playerB.dc90 > playerA.dc90 + 0.05) winner = "B"

    const qaItems = buildDefconCompareQA(playerA, playerB, ctx.gw, posMeta.cbitThreshold)
    const verdict = buildDefconCompareVerdict(playerA, playerB, winner)

    return {
      gw: ctx.gw,
      playerA,
      playerB,
      positionSlug,
      cbitThreshold: posMeta.cbitThreshold,
      qaItems,
      verdict,
      winner,
      early: ctx.early,
    }
  } catch {
    return null
  }
}

// ─── Static params helpers ────────────────────────────────────────────────────

export async function getDefconPlayerSlugs(): Promise<{ slug: string }[]> {
  try {
    const ctx = await loadDefconContext()
    if (!ctx.ready) return []
    return ctx.players.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

/**
 * Compare pairs: top-20 vs top-20 in each of DEF and MID, same position only.
 * Returns unique unordered pairs (A vs B, not B vs A). Roughly 190 pairs per
 * position = ~380 URLs total.
 */
export async function getDefconComparePairs(): Promise<{ playerA: string; playerB: string }[]> {
  try {
    const ctx = await loadDefconContext()
    if (!ctx.ready) return []
    const pairs: { playerA: string; playerB: string }[] = []
    for (const et of [2, 3]) {
      const top = ctx.players.filter(p => p.elementType === et).slice(0, 20)
      for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
          pairs.push({ playerA: top[i].slug, playerB: top[j].slug })
        }
      }
    }
    return pairs
  } catch {
    return []
  }
}

export const DEFCON_STATIC_HUB_PARAMS = Object.keys(DEFCON_POSITION_META).map(position => ({ position }))

export const DEFCON_STATIC_PRICE_PARAMS = Object.keys(DEFCON_POSITION_META).flatMap(position =>
  Object.keys(DEFCON_PRICE_META).map(price => ({ position, price }))
)

// ─── Copy generation ──────────────────────────────────────────────────────────
// Deterministic variance: we hash off player.code so the same player always
// gets the same variant across visits, but different players get different
// phrasings. This keeps pages differentiated without ever being random.

function hashPick<T>(seed: number, pool: T[]): T {
  return pool[seed % pool.length]
}

function tierByMinutes(mins: number): "elite-load" | "regular" | "rotation" | "limited" {
  if (mins >= 1500) return "elite-load"
  if (mins >= 900)  return "regular"
  if (mins >= 450)  return "rotation"
  return "limited"
}

function tierByDc90(dc90: number, cbitThreshold: number): "elite" | "reliable" | "occasional" | "thin" {
  // Rough calibration: elite defenders in a mature season sit around 0.9+
  // per 90 while elite midfielders sit around 0.7+.
  const scale = cbitThreshold === 10 ? 1.0 : 0.75
  if (dc90 >= 0.85 * scale) return "elite"
  if (dc90 >= 0.55 * scale) return "reliable"
  if (dc90 >= 0.30 * scale) return "occasional"
  return "thin"
}

function fmtDc90(dc90: number): string {
  return dc90.toFixed(2)
}

function fmtMins(mins: number): string {
  return mins.toLocaleString("en-GB")
}

const OPENERS_ELITE = [
  "The numbers do most of the talking.",
  "This is one of the standout DEFCON returns in the league.",
  "There is no ambiguity in the data.",
]
const OPENERS_RELIABLE = [
  "The signal is genuine.",
  "The DEFCON return is respectable and consistent.",
  "Look past the raw total and the per-90 rate holds up.",
]
const OPENERS_OCCASIONAL = [
  "The picture is more mixed.",
  "The DEFCON return is real but modest.",
  "There is enough here to note without overselling it.",
]
const OPENERS_THIN = [
  "The DEFCON case is thin.",
  "Do not build a transfer on the defensive rate alone.",
  "The number is not the reason to bring this player in.",
]

const CLOSERS_ELITE = [
  "Managers with a DEFCON-focused blueprint should have this player near the top of the shortlist.",
  "For anyone tracking defensive contributions the case is straightforward.",
  "In a season where DEFCON matters, this is the profile you want.",
]
const CLOSERS_RELIABLE = [
  "The rate makes them a sensible pick even before you factor in attacking upside.",
  "Managers looking for baseline points without a huge premium can lean here with confidence.",
  "The rate holds up across the sample - the question is fit rather than talent.",
]
const CLOSERS_OCCASIONAL = [
  "The return is worth noting but the case for a transfer rests on something else.",
  "Treat the DEFCON return as a bonus rather than the headline reason to sign.",
  "The rate needs to firm up before this player deserves priority on DEFCON grounds alone.",
]
const CLOSERS_THIN = [
  "The DEFCON return is not why you would sign this player - it is a bonus if it comes.",
  "Look for the attacking case first and treat DEFCON as an occasional plus.",
  "If your team leans on defensive contributions, this is not the profile to lead with.",
]

function pickOpener(tier: string, seed: number): string {
  if (tier === "elite")      return hashPick(seed, OPENERS_ELITE)
  if (tier === "reliable")   return hashPick(seed, OPENERS_RELIABLE)
  if (tier === "occasional") return hashPick(seed, OPENERS_OCCASIONAL)
  return hashPick(seed, OPENERS_THIN)
}

function pickCloser(tier: string, seed: number): string {
  if (tier === "elite")      return hashPick(seed, CLOSERS_ELITE)
  if (tier === "reliable")   return hashPick(seed, CLOSERS_RELIABLE)
  if (tier === "occasional") return hashPick(seed, CLOSERS_OCCASIONAL)
  return hashPick(seed, CLOSERS_THIN)
}

// ─── QA generators ────────────────────────────────────────────────────────────

export function buildDefconPlayerQA(
  player: DefconPlayer,
  gw: number,
  positionRank: number,
  positionTotal: number,
  cbitThreshold: number,
): { question: string; answer: string }[] {
  const tier = tierByDc90(player.dc90, cbitThreshold)
  const mtier = tierByMinutes(player.minutes)
  const seed = player.code
  const positionName = player.elementType === 2 ? "defender" : "midfielder"

  const dc90Str = fmtDc90(player.dc90)
  const dcStr = String(player.dc)
  const cbitStr = String(player.cbit)
  const minsStr = fmtMins(player.minutes)
  const opener = pickOpener(tier, seed)
  const closer = pickCloser(tier, seed + 1)

  const sampleCaveat = player.smallSample
    ? ` The sample is still small at ${minsStr} minutes, so treat the rate as a signal rather than a settled read.`
    : ""

  // Q1 — headline reliability
  const q1: { question: string; answer: string } = {
    question: `Is ${player.displayName} a reliable DEFCON asset in Fantasy Premier League?`,
    answer: (() => {
      if (tier === "elite") {
        return `${opener} ${player.displayName} has earned the +2pt DEFCON bonus in ${dcStr} matches this season at a rate of ${dc90Str} per 90 minutes, which sits in the top tier for ${player.elementType === 2 ? "defenders" : "midfielders"} across the league. Across ${minsStr} minutes on the pitch that is a consistent, repeatable return rather than a hot streak.${sampleCaveat} ${closer}`
      }
      if (tier === "reliable") {
        return `${opener} ${player.displayName} has cleared the ${cbitThreshold}-CBIT threshold in ${dcStr} matches this season, giving a per-90 rate of ${dc90Str}. That is a solid return for a ${positionName} in this bracket - not the very top of the league, but comfortably above the level where DEFCON becomes a meaningful part of a player's weekly ceiling.${sampleCaveat} ${closer}`
      }
      if (tier === "occasional") {
        return `${opener} ${player.displayName} is on ${dcStr} DEFCON returns this season at ${dc90Str} per 90 across ${minsStr} minutes. That is a moderate rate rather than an elite one - roughly one in three or four matches yields the +2pt bonus.${sampleCaveat} ${closer}`
      }
      return `${opener} ${player.displayName}'s per-90 rate of ${dc90Str} places them below the level where DEFCON becomes a genuinely bankable weekly return. Across ${minsStr} minutes they have only hit the ${cbitThreshold}-CBIT threshold in ${dcStr} matches, so any manager signing them should be doing so for attacking output or fixture reasons rather than defensive contributions.${sampleCaveat} ${closer}`
    })(),
  }

  // Q2 — positional context
  const q2: { question: string; answer: string } = {
    question: `How does ${player.webName} rank among Fantasy Premier League ${player.elementType === 2 ? "defenders" : "midfielders"} for DEFCON?`,
    answer: (() => {
      const percentile = positionTotal > 0 ? Math.round((1 - (positionRank - 1) / positionTotal) * 100) : 0
      if (positionRank === 1) {
        return `${player.webName} is currently the number one ranked FPL ${positionName} for DEFCON per 90 minutes this season, out of ${positionTotal} eligible players. That is the ceiling of what any manager can find at this position on defensive contributions alone. The next question is whether the fixture run and attacking output back up the defensive case.`
      }
      if (positionRank <= 3) {
        return `${player.webName} is the number ${positionRank} ranked FPL ${positionName} for DEFCON per 90 across the ${positionTotal} players who have played enough minutes to qualify. That is inside the top three at this position - as strong an endorsement as the data can offer on defensive contributions alone.`
      }
      if (positionRank <= 10) {
        return `${player.webName} sits at number ${positionRank} of ${positionTotal} eligible ${player.elementType === 2 ? "defenders" : "midfielders"} for DEFCON per 90. That is a top-ten profile - the underlying rate is strong enough that any manager building around defensive contributions should have this player on the shortlist.`
      }
      if (positionRank <= 20) {
        return `Among the ${positionTotal} eligible ${player.elementType === 2 ? "defenders" : "midfielders"}, ${player.webName} ranks ${positionRank} for DEFCON per 90. That is a top-tier profile without being elite - the ${percentile}th percentile of the position - meaning managers who focus on fixture and price can often find better value while managers who stack DEFCON specialists will still consider them.`
      }
      return `${player.webName} ranks ${positionRank} of ${positionTotal} eligible ${player.elementType === 2 ? "defenders" : "midfielders"} for DEFCON per 90 - the ${percentile}th percentile at their position. That places them below the level where DEFCON should be a leading reason to own them. Attacking output, price, and fixtures need to carry more of the weight in the buying case.`
    })(),
  }

  // Q3 — raw vs rate
  const cbitPerMatch = player.minutes > 0 ? (player.cbit / (player.minutes / 90)).toFixed(1) : "0.0"
  const q3: { question: string; answer: string } = {
    question: `What do ${player.webName}'s raw defensive numbers look like this Fantasy Premier League season?`,
    answer: `${player.webName} has racked up ${cbitStr} combined clearances, blocks, interceptions and tackles across ${minsStr} minutes. That works out to ${cbitPerMatch} defensive actions per 90 minutes on average. The ${cbitThreshold}-plus threshold has been hit in ${dcStr} matches, converting to the +2pt DEFCON bonus each time. ${mtier === "elite-load" ? `Playing ${minsStr} minutes puts ${player.webName} among the highest-load ${player.elementType === 2 ? "defenders" : "midfielders"} in the league - the base rate is genuinely tested by workload.` : mtier === "regular" ? `${minsStr} minutes is enough to trust the underlying rate for planning purposes.` : mtier === "rotation" ? `${minsStr} minutes is enough to see the shape of the underlying rate, though a larger sample would tighten confidence.` : `${minsStr} minutes is a small sample - the raw figures are directional rather than definitive.`}`,
  }

  // Q4 — GW recommendation
  const opponentPart = player.opponentName
    ? `The Gameweek ${gw} fixture is ${player.isHome ? "at home to" : "away at"} ${player.opponentName}, an FDR ${player.fdrNext ?? "?"} matchup.`
    : `Fixture data for Gameweek ${gw} is not yet available.`
  const q4: { question: string; answer: string } = {
    question: `Should I sign ${player.displayName} for Gameweek ${gw} on DEFCON grounds?`,
    answer: (() => {
      if (player.chance < 75) {
        return `${player.displayName} has an availability flag with a ${player.chance}% chance of playing next round. Wait for confirmation before committing a transfer - DEFCON reliability means nothing if the player does not start. ${opponentPart}`
      }
      if (tier === "elite" && (player.fdrNext ?? 3) <= 3) {
        return `On DEFCON grounds the case is strong. ${player.displayName} is one of the most reliable ${player.elementType === 2 ? "defenders" : "midfielders"} in the league at ${dc90Str} bonuses per 90, and ${opponentPart.replace("The Gameweek", "the Gameweek").replace("is not yet available.", "is not yet available so treat this note as fixture-neutral.")} That combination points to a strong Gameweek ${gw} floor before any attacking output is factored in.`
      }
      if (tier === "elite" && (player.fdrNext ?? 3) >= 4) {
        return `On DEFCON grounds the underlying case is strong at ${dc90Str} bonuses per 90 - one of the best rates in the position. ${opponentPart} A tougher matchup will not neutralise the DEFCON output because it is action-based rather than result-based, but the attacking upside is reduced. Signings on this profile are best sized around a longer-run fixture plan.`
      }
      if (tier === "reliable") {
        return `The DEFCON case for ${player.displayName} is respectable at ${dc90Str} per 90. ${opponentPart} That is a sensible profile to bring in if you have space at the price point and want to lock in a baseline of defensive contributions, though it should sit alongside a stronger attacking or fixture reason rather than being the sole trigger.`
      }
      if (tier === "occasional") {
        return `${player.displayName}'s DEFCON rate of ${dc90Str} is moderate rather than elite. ${opponentPart} A transfer on defensive contributions alone is hard to justify at this profile - lean on the fixture, price, or attacking output as the primary case and treat DEFCON as an occasional bonus.`
      }
      return `${player.displayName}'s DEFCON rate of ${dc90Str} is too thin to build a transfer around. ${opponentPart} If the attacking case is strong for other reasons, DEFCON is not the reason to hold back - but it should not be the reason to bring them in either.`
    })(),
  }

  return [q1, q2, q3, q4]
}

export function buildDefconVerdict(
  player: DefconPlayer,
  positionRank: number,
  _positionTotal: number,
): { label: string; text: string; bullets: string[] } {
  const tier = tierByDc90(player.dc90, player.elementType === 2 ? 10 : 12)
  const dc90Str = fmtDc90(player.dc90)
  const bullets: string[] = []

  if (tier === "elite" || tier === "reliable") {
    bullets.push(`${player.dc} DEFCON returns from ${fmtMins(player.minutes)} minutes at ${dc90Str} per 90.`)
  } else {
    bullets.push(`${player.dc} DEFCON returns from ${fmtMins(player.minutes)} minutes - a per-90 rate of ${dc90Str}.`)
  }
  bullets.push(`Positional rank: ${positionRank} for DEFCON per 90.`)
  if (player.smallSample) bullets.push(`Sample size still building - treat as a signal rather than a settled read.`)
  if (player.chance < 75) bullets.push(`Availability flagged - ${player.chance}% chance of playing next round.`)
  else bullets.push(`Fully available - ${player.chance}% chance of playing next round.`)

  let label: string
  let text: string
  if (tier === "elite") {
    label = "DEFCON Elite"
    text = `${player.displayName} is one of the most reliable ${player.elementType === 2 ? "defenders" : "midfielders"} in the league for defensive contributions.`
  } else if (tier === "reliable") {
    label = "DEFCON Reliable"
    text = `${player.displayName} offers a respectable, repeatable DEFCON floor at this price point.`
  } else if (tier === "occasional") {
    label = "DEFCON Occasional"
    text = `${player.displayName}'s DEFCON rate is moderate - a bonus rather than a headline reason to sign.`
  } else {
    label = "DEFCON Thin"
    text = `${player.displayName} rarely hits the DEFCON threshold - lean on other reasons if you are signing.`
  }

  return { label, text, bullets }
}

// ─── Compare copy ─────────────────────────────────────────────────────────────

export function buildDefconCompareQA(
  a: DefconPlayer,
  b: DefconPlayer,
  gw: number,
  cbitThreshold: number,
): { question: string; answer: string }[] {
  const aRate = fmtDc90(a.dc90)
  const bRate = fmtDc90(b.dc90)
  const aMins = fmtMins(a.minutes)
  const bMins = fmtMins(b.minutes)
  const positionName = a.elementType === 2 ? "defender" : "midfielder"
  const rateWinner = a.dc90 > b.dc90 ? a : b
  const rateLoser  = a.dc90 > b.dc90 ? b : a
  const rateGap = Math.abs(a.dc90 - b.dc90).toFixed(2)

  const q1 = {
    question: `Who has the stronger DEFCON rate: ${a.webName} or ${b.webName}?`,
    answer: (() => {
      if (parseFloat(rateGap) < 0.05) {
        return `Barely anything in it. ${a.webName} averages ${aRate} DEFCON returns per 90 and ${b.webName} averages ${bRate} - a gap of ${rateGap} that is inside the natural noise of any per-90 metric. On the rate alone this is a coin toss and the decision should rest on fixture, price and attacking output rather than DEFCON.`
      }
      return `${rateWinner.webName} is the stronger DEFCON profile at ${fmtDc90(rateWinner.dc90)} per 90 against ${fmtDc90(rateLoser.dc90)} for ${rateLoser.webName} - a gap of ${rateGap} per 90. Over a 38-match season that difference works out to roughly ${(parseFloat(rateGap) * 38).toFixed(0)} extra DEFCON returns, or ${(parseFloat(rateGap) * 38 * 2).toFixed(0)} extra FPL points before any attacking upside is factored in.`
    })(),
  }

  const q2 = {
    question: `How do the raw defensive workloads of ${a.webName} and ${b.webName} compare?`,
    answer: `${a.webName} has logged ${a.cbit} combined clearances, blocks, interceptions and tackles across ${aMins} minutes (${(a.cbit / Math.max(1, a.minutes / 90)).toFixed(1)} per 90). ${b.webName} has logged ${b.cbit} across ${bMins} minutes (${(b.cbit / Math.max(1, b.minutes / 90)).toFixed(1)} per 90). The ${cbitThreshold}-plus threshold has been cleared ${a.dc} times by ${a.webName} and ${b.dc} times by ${b.webName}. Higher raw counts often reflect a higher defensive workload; higher per-90 rates reflect efficiency at hitting the threshold.`,
  }

  const q3 = {
    question: `Does the Gameweek ${gw} fixture change the DEFCON case?`,
    answer: (() => {
      const aFixture = a.opponentName
        ? `${a.webName} is ${a.isHome ? "at home to" : "away at"} ${a.opponentName} (FDR ${a.fdrNext ?? "?"})`
        : `${a.webName}'s fixture is not yet confirmed`
      const bFixture = b.opponentName
        ? `${b.webName} is ${b.isHome ? "at home to" : "away at"} ${b.opponentName} (FDR ${b.fdrNext ?? "?"})`
        : `${b.webName}'s fixture is not yet confirmed`
      return `${aFixture} and ${bFixture} in Gameweek ${gw}. DEFCON output is action-based rather than result-based, so a tough fixture does not shrink the base rate the way it might reduce a clean sheet probability. That said, both players are more likely to see defensive volume in tougher matches - the DEFCON case can actually be marginally stronger against stronger opposition.`
    })(),
  }

  const q4 = {
    question: `Which ${positionName} should I pick for Gameweek ${gw} on DEFCON grounds?`,
    answer: (() => {
      if (parseFloat(rateGap) < 0.05) {
        return `The DEFCON rates are too close to call. Both ${a.webName} and ${b.webName} deliver similar defensive returns, so the pick should come down to price, fixtures and attacking output rather than DEFCON. On the defensive contributions alone this is a genuine coin toss.`
      }
      const priceDiff = Math.abs(extractPriceRaw(a) - extractPriceRaw(b)).toFixed(1)
      if (parseFloat(priceDiff) < 0.1) {
        return `At near-identical prices, ${rateWinner.webName} is the cleaner DEFCON pick. The ${rateGap} per 90 edge is meaningful over the run of the season, and with no price advantage for ${rateLoser.webName} the choice tips to ${rateWinner.webName} for managers building around defensive contributions.`
      }
      return `${rateWinner.webName} has the DEFCON edge at ${fmtDc90(rateWinner.dc90)} per 90 versus ${fmtDc90(rateLoser.dc90)}. That advantage costs £${priceDiff}m if ${rateWinner.webName} is dearer - work out whether the edge is worth the outlay in your specific squad. On DEFCON grounds alone ${rateWinner.webName} is the better profile, but £${priceDiff}m spent elsewhere may return more depending on where you are stretched.`
    })(),
  }

  return [q1, q2, q3, q4]
}

export function extractPriceRaw(player: DefconPlayer): number {
  return parseFloat(player.price.replace("£", "").replace("m", ""))
}

export function buildDefconCompareVerdict(
  a: DefconPlayer,
  b: DefconPlayer,
  winner: "A" | "B" | "tie",
): { label: string; text: string; bullets: string[] } {
  const aRate = fmtDc90(a.dc90)
  const bRate = fmtDc90(b.dc90)
  const bullets = [
    `${a.webName}: ${aRate} DEFCON per 90 across ${fmtMins(a.minutes)} minutes (${a.dc} returns).`,
    `${b.webName}: ${bRate} DEFCON per 90 across ${fmtMins(b.minutes)} minutes (${b.dc} returns).`,
  ]
  const priceDiff = Math.abs(extractPriceRaw(a) - extractPriceRaw(b))
  if (priceDiff >= 0.1) {
    bullets.push(`${extractPriceRaw(a) < extractPriceRaw(b) ? a.webName : b.webName} is £${priceDiff.toFixed(1)}m cheaper.`)
  }

  if (winner === "tie") {
    return {
      label: "DEFCON Coin Toss",
      text: `The DEFCON rates are near-identical - the decision should rest on price, fixtures and attacking output.`,
      bullets,
    }
  }
  const winnerPlayer = winner === "A" ? a : b
  return {
    label: winner === "A" ? `${a.webName} Edges DEFCON` : `${b.webName} Edges DEFCON`,
    text: `${winnerPlayer.webName} has the stronger DEFCON profile of the two.`,
    bullets,
  }
}
