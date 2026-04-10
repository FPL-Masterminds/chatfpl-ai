import { unstable_cache } from "next/cache"
import type { FplCardPlayer } from "@/components/fpl-player-hero"
import type { PlayerQA } from "@/components/conversational-player"

// ─── Shared cached bootstrap fetch ───────────────────────────────────────────
// The raw FPL bootstrap-static response is 2.6MB which exceeds Vercel's 2MB
// cache limit. We slim it to only the fields our pages actually use before
// caching — bringing the payload to ~400KB and allowing it to be cached.
// One cached call is shared across all 700+ page renders per build cycle.

const PLAYER_FIELDS = [
  "id","code","web_name","first_name","second_name",
  "element_type","team","now_cost","selected_by_percent",
  "form","total_points","ep_next","goals_scored","assists",
  "news","chance_of_playing_next_round","minutes",
  "transfers_in_event","transfers_out_event","cost_change_event",
] as const

const TEAM_FIELDS   = ["id","name","short_name","code"] as const
const EVENT_FIELDS  = ["id","is_current","is_next","finished","deadline_time"] as const

function slim<T extends Record<string, unknown>>(arr: T[], fields: readonly string[]): Partial<T>[] {
  return arr.map((item) => {
    const out: Record<string, unknown> = {}
    fields.forEach((f) => { if (f in item) out[f] = item[f] })
    return out as Partial<T>
  })
}

export const getBootstrap = unstable_cache(
  async () => {
    const res = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { headers: { "User-Agent": "ChatFPL/1.0" }, cache: "no-store" }
    )
    const raw = await res.json()
    return {
      elements:       slim(raw.elements  ?? [], PLAYER_FIELDS),
      teams:          slim(raw.teams     ?? [], TEAM_FIELDS),
      events:         slim(raw.events    ?? [], EVENT_FIELDS),
      element_types:  raw.element_types  ?? [],
    }
  },
  ["fpl-bootstrap-slim"],
  { revalidate: 3600 }
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerData {
  code: number
  webName: string      // FPL web_name e.g. "Haaland", "Bernardo Silva"
  displayName: string  // For H1 + metadata e.g. "Erling Haaland"
  club: string
  teamCode: number
  position: string
  price: string
  form: string
  totalPts: number
  ep_next: number
  ownership: number
  goals: number
  assists: number
  news: string
  chance: number
}

export interface PlayerPageData {
  gw: number
  player: PlayerData
  opponent: string
  isHome: boolean
  fdr: number
  showcasePlayers: FplCardPlayer[]
  relatedPlayers: { name: string; slug: string }[]
  slug: string
}

export interface PageTextResult {
  verdict: string
  verdictLabel: string
  verdictColor: string
  verdictBullets: string[]
  caseFor: string[]
  caseAgainst: string[]
  caseHeading: string
  ctaLeadin: string
  qaItems: PlayerQA[]
  welcome: string
}

// ─── Slug utilities ───────────────────────────────────────────────────────────

export function toSlug(webName: string, teamShort?: string): string {
  const base = webName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return teamShort
    ? `${base}-${teamShort.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : base
}

/**
 * Build a slug → elementId map for a given array of player elements.
 * Where two players share the same web_name-derived slug, append team short name.
 */
// ─── Shared helper for generateStaticParams across all four route types ───────
// All pages call this instead of fetching bootstrap independently.
/**
 * A player is eligible for pSEO pages if they either:
 * - Have ≥1000 minutes AND ≥1% ownership (active + relevant), OR
 * - Have ≥2000 minutes regardless of ownership (established starter, e.g. Bernardo)
 */
export function isEligiblePlayer(p: any): boolean {
  const mins = p.minutes ?? 0
  const sel  = parseFloat(p.selected_by_percent ?? "0")
  return (mins >= 1000 && sel >= 1.0) || mins >= 2000
}

export async function getEligibleSlugs(): Promise<{ slug: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])
    return Array.from(slugMap.keys()).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export function buildSlugLookup(
  elements: any[],
  teams: any[]
): Map<string, number> {
  const teamShortMap: Record<number, string> = {}
  teams.forEach((t: any) => { teamShortMap[t.id] = t.short_name })

  // Count base slug collisions
  const baseCount: Record<string, number> = {}
  elements.forEach((p: any) => {
    const s = toSlug(p.web_name)
    baseCount[s] = (baseCount[s] ?? 0) + 1
  })

  const result = new Map<string, number>()
  elements.forEach((p: any) => {
    const base = toSlug(p.web_name)
    const slug =
      baseCount[base] > 1
        ? toSlug(p.web_name, teamShortMap[p.team])
        : base
    result.set(slug, p.id)
  })
  return result
}

/**
 * Derive a human-readable display name for H1 / metadata.
 * - If web_name already has a space (e.g. "Bernardo Silva") use it.
 * - If web_name is one word (e.g. "Haaland") prepend first_name if the
 *   combined length is reasonable, otherwise fall back to web_name alone.
 */
export function getDisplayName(p: any): string {
  const webName: string   = p.web_name   ?? ""
  const firstName: string = p.first_name ?? ""
  const secondName: string = p.second_name ?? ""

  // Abbreviated web_name like "B.Fernandes" — strip the initial and use first_name + surname
  const abbreviated = /^[A-Z]\..+/.test(webName)
  if (abbreviated) {
    const surname = webName.replace(/^[A-Z]\./, "")
    const full = `${firstName} ${surname}`
    return full.length <= 26 ? full : surname
  }

  // Duplication guard: first_name already ends with web_name
  // e.g. first_name="Igor Thiago" web_name="Thiago" → avoid "Igor Thiago Thiago"
  if (firstName.toLowerCase().endsWith(webName.toLowerCase())) {
    return firstName.length <= 22 ? firstName : webName
  }

  // Normalise for comparison (strip diacritics, lowercase)
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const wn = norm(webName)
  const sn = norm(secondName)

  // Is web_name the surname (possibly compound) or an already-complete display name?
  // e.g. "Van den Berg" → second_name "van den Berg" → isSurname → prepend first_name
  // e.g. "Mac Allister" → second_name "Mac Allister" → isSurname → prepend first_name
  // e.g. "Bernardo Silva" → second_name "Silva" → NOT isSurname → use as-is
  // e.g. "João Pedro" → second_name "Junqueira de Jesus" → NOT isSurname → use as-is
  const isSurname = wn === sn || sn.startsWith(wn) || wn.startsWith(sn)

  // Multi-word web_name that is already a full display name — return as-is
  if (webName.includes(" ") && !isSurname) return webName

  // Mononym/nickname unrelated to second_name (e.g. "Beto") — use alone
  if (!isSurname) return webName

  // Surname (single or compound) — prepend first_name
  const full = `${firstName} ${webName}`
  return full.length <= 26 ? full : webName
}

const MONTH_MAP: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May",     jun: "June",     jul: "July",   aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
}

/**
 * Clean up the raw FPL news string for human display.
 * Converts "Expected back 01 Jun" → "Expected back 1 June"
 */
export function formatFplNews(news: string): string {
  return news
    .replace(/\b0?(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi,
      (_, day, mon) => `${parseInt(day, 10)} ${MONTH_MAP[mon.toLowerCase()] ?? mon}`)
}

// ─── FPL API data fetch ───────────────────────────────────────────────────────

export const FPL_HEADERS = { "User-Agent": "ChatFPL/1.0" }

/**
 * Returns true when the FPL season is over — i.e. all events are finished
 * and no event is marked as next. Used to show a season-ended holding page.
 */
export async function isSeasonOver(): Promise<boolean> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    if (events.length === 0) return false
    const hasNext = events.some((e: any) => e.is_next)
    const hasCurrent = events.some((e: any) => e.is_current && !e.finished)
    return !hasNext && !hasCurrent
  } catch {
    return false
  }
}

function toCard(
  p: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>
): FplCardPlayer {
  return {
    code:     p.code,
    name:     p.web_name,
    club:     teamMap[p.team]?.short ?? "",
    teamCode: teamMap[p.team]?.code ?? 0,
    position: posMap[p.element_type] ?? "",
    price:    `£${(p.now_cost / 10).toFixed(1)}m`,
    form:     p.form ?? "0.0",
    totalPts: p.total_points ?? 0,
  }
}

export async function getPlayerPageData(
  slug: string
): Promise<PlayerPageData | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    // Build maps
    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Resolve slug → player (eligible-only set so slugs match generateStaticParams)
    const eligibleElements = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligibleElements, bootstrap.teams ?? [])
    const elementId = slugLookup.get(slug)
    if (!elementId) return null

    const el = (bootstrap.elements ?? []).find((p: any) => p.id === elementId)
    if (!el) return null

    const team = teamMap[el.team]

    // Next gameweek
    const events = bootstrap.events ?? []
    const nextGW =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)

    // Fixtures for next GW
    const fixturesRes = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${nextGW}`,
      { headers: FPL_HEADERS, next: { revalidate: 900 } }
    )
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : []
    const fix = (fixtures as any[]).find(
      (f) => f.team_h === el.team || f.team_a === el.team
    )
    const isHome = fix?.team_h === el.team
    const oppId = isHome ? fix?.team_a : fix?.team_h
    const opponent = oppId ? teamMap[oppId]?.name ?? "TBD" : "TBD"
    const fdr = fix
      ? isHome ? (fix.team_h_difficulty ?? 3) : (fix.team_a_difficulty ?? 3)
      : 3

    const player: PlayerData = {
      code:        el.code,
      webName:     el.web_name,
      displayName: getDisplayName(el),
      club:        team?.short ?? "",
      teamCode:    team?.code ?? 0,
      position:    posMap[el.element_type] ?? "",
      price:       `£${(el.now_cost / 10).toFixed(1)}m`,
      form:        el.form ?? "0.0",
      totalPts:    el.total_points ?? 0,
      ep_next:     parseFloat(el.ep_next ?? "0"),
      ownership:   parseFloat(el.selected_by_percent ?? "0"),
      goals:       el.goals_scored ?? 0,
      assists:     el.assists ?? 0,
      news:        el.news ?? "",
      chance:      el.chance_of_playing_next_round ?? 100,
    }

    // Top fit players sorted by ep_next (for flanking cards + related links)
    const fitByEpNext = (bootstrap.elements ?? [])
      .filter((p: any) =>
        p.id !== el.id &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 300 &&
        parseFloat(p.ep_next ?? "0") > 0
      )
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))

    const centerCard: FplCardPlayer = {
      code: player.code, name: player.webName, club: player.club,
      teamCode: player.teamCode, position: player.position,
      price: player.price, form: player.form, totalPts: player.totalPts,
    }
    const flank = fitByEpNext.slice(0, 4)
    const showcasePlayers: FplCardPlayer[] = [
      flank[0] ? toCard(flank[0], teamMap, posMap) : centerCard,
      flank[1] ? toCard(flank[1], teamMap, posMap) : centerCard,
      centerCard,
      flank[2] ? toCard(flank[2], teamMap, posMap) : centerCard,
      flank[3] ? toCard(flank[3], teamMap, posMap) : centerCard,
    ]

    // Related players: MID/FWD only, for captain alternative links
    const relatedPlayers = fitByEpNext
      .filter((p: any) => p.element_type >= 3)
      .slice(0, 6)
      .map((p: any) => {
        const base = toSlug(p.web_name)
        const rSlug = slugLookup.get(base) === p.id
          ? base
          : toSlug(p.web_name, teamMap[p.team]?.short)
        return { name: p.web_name, slug: rSlug }
      })

    return { gw: nextGW, player, opponent, isHome, fdr, showcasePlayers, relatedPlayers, slug }
  } catch {
    return null
  }
}

// ─── Text generation ──────────────────────────────────────────────────────────

export function buildPageText(d: PlayerPageData): PageTextResult {
  const { gw, player: p, opponent, isHome, fdr } = d
  const fixture = `${opponent} (${isHome ? "H" : "A"})`
  const formVal = parseFloat(p.form)

  const verdict =
    p.ep_next >= 8 ? `Yes - ${p.webName} is one of the strongest captaincy options in Gameweek ${gw}.`
    : p.ep_next >= 6 ? `Probably yes - ${p.webName} is a solid captaincy pick for Gameweek ${gw}.`
    : p.ep_next >= 4 ? `It depends - ${p.webName} is a reasonable option but not the obvious armband choice this week.`
    : `Probably not - there are stronger captaincy options available for Gameweek ${gw}, but here is the case for ${p.webName}.`

  const verdictLabel =
    p.ep_next >= 8 ? "YES"
    : p.ep_next >= 6 ? "PROBABLY YES"
    : p.ep_next >= 4 ? "MAYBE"
    : "PROBABLY NOT"

  const verdictColor = "#00FF87"

  const formText =
    formVal >= 8 ? `${p.webName} is in exceptional form, averaging ${p.form} pts/game over the last 6 gameweeks.`
    : formVal >= 6 ? `${p.webName} is in good form, averaging ${p.form} pts/game over the last 6 gameweeks.`
    : formVal >= 4 ? `${p.webName}'s form is moderate at ${p.form} pts/game over the last 6 gameweeks.`
    : `${p.webName} has been out of form recently, averaging just ${p.form} pts/game over the last 6 gameweeks.`

  const fixtureText =
    fdr <= 2 ? `${p.webName} faces ${fixture} in Gameweek ${gw} - one of the more favourable fixtures this week.`
    : fdr === 3 ? `${p.webName} faces ${fixture} in Gameweek ${gw} - a workable fixture, neither easy nor particularly tough.`
    : `${p.webName} faces ${fixture} in Gameweek ${gw} - a difficult fixture on paper, which is the main reason to hesitate.`

  const ownershipText =
    p.ownership >= 40 ? `With ${p.ownership}% ownership, not captaining ${p.webName} is a significant differential decision. You would need a strong reason to look elsewhere.`
    : p.ownership >= 20 ? `At ${p.ownership}% ownership, ${p.webName} is a popular pick. Missing his points could cost rank.`
    : p.ownership >= 10 ? `${p.webName} is owned by ${p.ownership}% of managers - well held but not so popular that skipping him is a disaster.`
    : `With only ${p.ownership}% ownership, ${p.webName} is a genuine differential. A big return here moves you up the overall rankings.`

  const availabilityText =
    p.chance < 50 ? `Significant fitness concern: ${formatFplNews(p.news)}. Captaining ${p.webName} carries real risk this week.`
    : p.chance < 75 ? `Minor doubt over ${p.webName}'s availability. ${formatFplNews(p.news)}. Worth monitoring before the deadline.`
    : `No injury concerns flagged at the time of writing.`

  const closingText =
    p.ep_next >= 6 && fdr <= 3
      ? `The combination of strong expected points and a manageable fixture makes ${p.webName} a captain pick you can make with confidence.`
      : p.ep_next >= 6 && fdr >= 4
      ? `${p.webName}'s expected output is strong, but the fixture is tough. A viable captain pick for those willing to back him against the odds.`
      : p.ep_next < 6 && fdr <= 2
      ? `The kind fixture gives ${p.webName} an outside chance of a big week even if the numbers do not shout captain.`
      : `With a tough fixture and modest expected points, ${p.webName} is not a captain recommendation this week unless your options are limited.`

  const ctaLeadin =
    p.ep_next >= 6
      ? `Want to know how ${p.webName} compares against the other top captaincy options this week? ChatFPL AI can compare your specific options based on your squad.`
      : `Not convinced ${p.webName} is the right call? ChatFPL AI can suggest the strongest captaincy option for your squad and budget.`

  const verdictBullets = [
    formVal >= 6
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - above average returns`
      : formVal >= 4
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - moderate returns`
      : `Form: ${p.form} pts/game over the last 6 gameweeks - below expectations`,
    fdr <= 2
      ? `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - one of the easier fixtures this week`
      : fdr === 3
      ? `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - a workable fixture`
      : `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - a tough assignment`,
    p.ownership >= 30
      ? `Ownership: ${p.ownership}% - blanking carries a significant rank cost`
      : `Ownership: ${p.ownership}% - a genuine differential pick`,
  ]

  // Case for / against
  const caseFor: string[] = []
  const caseAgainst: string[] = []

  if (formVal >= 6)
    caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - one of the better-returning players in his position right now.`)
  else if (formVal >= 4)
    caseAgainst.push(`Form: only ${p.form} pts/game over the last 6 gameweeks - returns have been below the level expected for a captain pick.`)
  else
    caseAgainst.push(`Form: ${p.form} pts/game over the last 6 gameweeks - poor recent returns make him a risky armband choice.`)

  if (fdr <= 2)
    caseFor.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is one of the more inviting matchups available to premium assets this week.`)
  else if (fdr === 3)
    caseFor.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is workable - not elite, but not a reason to avoid him.`)
  else
    caseAgainst.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is a tough assignment - better-fixture alternatives exist this week.`)

  if (p.ep_next >= 7)
    caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} is among the highest of any player this week.`)
  else if (p.ep_next >= 5)
    caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} - a solid projected return.`)
  else
    caseAgainst.push(`Expected points: only ${p.ep_next} xPts projected for GW${gw} - stronger options are available.`)

  if (p.ownership >= 40)
    caseAgainst.push(`Ownership: ${p.ownership}% means blanking carries a serious rank cost, but that is not the same as being the best captain pick.`)
  else if (p.ownership >= 20)
    caseFor.push(`Ownership: ${p.ownership}% - missing his points costs rank if he scores big.`)
  else
    caseFor.push(`Ownership: ${p.ownership}% makes him a genuine differential. A big return moves you up the overall rankings.`)

  if (p.goals + p.assists >= 15)
    caseFor.push(`Returns: ${p.goals} goals and ${p.assists} assists this season - consistent output that justifies the price.`)
  else if (p.goals + p.assists >= 8)
    caseFor.push(`Returns: ${p.goals} goals and ${p.assists} assists this season - decent underlying output.`)
  else
    caseAgainst.push(`Returns: only ${p.goals} goals and ${p.assists} assists this season - the volume has not been there.`)

  if (p.chance < 75)
    caseAgainst.push(`Availability: ${formatFplNews(p.news)} - real risk he does not start or plays reduced minutes.`)

  if (caseFor.length === 0)
    caseFor.push(`${p.webName} has shown he can deliver a big return on his day, and the FPL captaincy is ultimately about upside.`)
  if (caseAgainst.length === 0)
    caseAgainst.push(`At ${p.price} and ${p.ownership}% ownership, the expectation bar for the armband is high - any blank hurts.`)

  const caseHeading =
    p.ep_next >= 6
      ? `${p.webName} captaincy analysis - Gameweek ${gw}`
      : `Why ${p.webName} may not be the best captain in Gameweek ${gw}`

  const qaItems: PlayerQA[] = [
    {
      id: "captain",
      question: `Should I captain ${p.webName} in Gameweek ${gw}?`,
      answer: [verdict, "", formText, fixtureText, "", ownershipText, "", availabilityText, "", closingText].join("\n"),
    },
    {
      id: "transfer",
      question: `Should I transfer ${p.webName} in before Gameweek ${gw}?`,
      answer: [
        p.ep_next >= 6
          ? `If you have the budget, yes - the timing makes sense.`
          : `It is worth considering, but the case is not as clear-cut as it might appear.`,
        "",
        `At ${p.price}, ${p.webName} has registered ${p.goals} goals and ${p.assists} assists this season for ${p.totalPts} points in total. ${formText}`,
        "",
        fixtureText,
        "",
        `The main argument against bringing him in is the price point. At ${p.price}, you need to make cuts elsewhere in your squad. Whether that trade-off is worth it depends on who you would be selling and what your budget looks like.`,
        "",
        `ChatFPL AI can look at your specific squad and tell you whether the transfer makes sense for your team right now.`,
      ].join("\n"),
    },
    {
      id: "fixtures",
      question: `What are ${p.webName}'s upcoming fixtures?`,
      answer: [
        `${p.webName}'s next fixture is ${fixture} in Gameweek ${gw}, rated ${fdr} out of 5 for difficulty${fdr <= 2 ? " - a comfortable match on paper" : fdr === 3 ? " - a workable fixture" : " - a tough assignment"}.`,
        "",
        `Fixture difficulty ratings give you a rough guide but do not account for recent form, home advantage, or how a team has performed against specific opponents this season.`,
        "",
        `For a full fixture run breakdown across the next several gameweeks, ChatFPL AI can compare ${p.webName}'s schedule against other premium options in his position.`,
      ].join("\n"),
    },
    {
      id: "value",
      question: `Is ${p.webName} worth ${p.price} in FPL?`,
      answer: [
        p.totalPts >= 150
          ? `Based on the numbers, yes - ${p.webName} has justified his price tag this season.`
          : `It depends on how the rest of your squad is structured.`,
        "",
        `${p.webName} has scored ${p.totalPts} points at ${p.price} this season, with ${p.goals} goals and ${p.assists} assists. ${formText}`,
        "",
        p.ownership >= 30
          ? `At ${p.ownership}% ownership, avoiding ${p.webName} is increasingly a deliberate differential call rather than a neutral decision.`
          : `At ${p.ownership}% ownership, there is room to take a different view without it costing rank.`,
        "",
        `The real question at ${p.price} is whether you can afford him without weakening two or three other positions. ChatFPL AI can assess your squad balance and tell you whether the allocation makes sense.`,
      ].join("\n"),
    },
  ]

  const welcome = `${verdict} Click a question below and I will walk you through the numbers.`

  return {
    verdict, verdictLabel, verdictColor, verdictBullets,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER PAGE — types, data fetch, text logic
// ═══════════════════════════════════════════════════════════════════════════════

export interface FixtureMatch {
  opponent: string
  opponentCode: number | null
  isHome: boolean
  fdr: number
}

export interface FixtureGW {
  gw: number
  matches: FixtureMatch[]  // empty = blank GW, 2+ = double GW
}

export interface DifferentialAlternative {
  code: number
  name: string
  slug: string
  ownership: number
  ep_next: number
  price: string
  club: string
  position: string
}

export interface PlayerTransferPageData extends PlayerPageData {
  fixtureRun: FixtureGW[]      // next 4 GWs
  ptsPerMillion: number
  transfersInGW: number
  transfersOutGW: number
  priceChangeGW: number        // cost_change_event (positive = rising)
  differentialAlternatives: DifferentialAlternative[]
}

export interface TransferPageTextResult {
  verdict: string
  verdictLabel: string
  verdictColor: string
  verdictBullets: string[]
  caseFor: string[]
  caseAgainst: string[]
  caseHeading: string
  ctaLeadin: string
  qaItems: PlayerQA[]
  welcome: string
}

// ─── Transfer data fetch ──────────────────────────────────────────────────────

export async function getPlayerTransferData(
  slug: string
): Promise<PlayerTransferPageData | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Eligible-only lookup so slugs match generateStaticParams
    const eligibleElements = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligibleElements, bootstrap.teams ?? [])
    const elementId = slugLookup.get(slug)
    if (!elementId) return null

    const el = (bootstrap.elements ?? []).find((p: any) => p.id === elementId)
    if (!el) return null

    const team = teamMap[el.team]

    // Next GW
    const events = bootstrap.events ?? []
    const nextGW =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)

    // Fetch next 4 GW fixtures in parallel
    const gwsToFetch = [nextGW, nextGW + 1, nextGW + 2, nextGW + 3]
    const fixtureResults = await Promise.all(
      gwsToFetch.map((gw) =>
        fetch(
          `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
          { headers: FPL_HEADERS, next: { revalidate: 900 } }
        )
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    )

    const fixtureRun: FixtureGW[] = gwsToFetch.map((gw, i) => {
      const gwFixtures: any[] = fixtureResults[i]
      const teamFixtures = gwFixtures.filter(
        (f) => f.team_h === el.team || f.team_a === el.team
      )
      const matches: FixtureMatch[] = teamFixtures.map((fix) => {
        const isHome = fix.team_h === el.team
        const oppId = isHome ? fix.team_a : fix.team_h
        return {
          opponent: teamMap[oppId]?.name ?? "Unknown",
          opponentCode: teamMap[oppId]?.code ?? null,
          isHome,
          fdr: isHome ? (fix.team_h_difficulty ?? 3) : (fix.team_a_difficulty ?? 3),
        }
      })
      return { gw, matches }
    })

    // First fixture details (for base page data) — use first match of first GW
    const firstMatch = fixtureRun[0]?.matches[0]
    const isHome = firstMatch?.isHome ?? false
    const opponent = firstMatch?.opponent ?? "TBD"
    const fdr = firstMatch?.fdr ?? 3

    const player: PlayerData = {
      code:        el.code,
      webName:     el.web_name,
      displayName: getDisplayName(el),
      club:        team?.short ?? "",
      teamCode:    team?.code ?? 0,
      position:    posMap[el.element_type] ?? "",
      price:       `£${(el.now_cost / 10).toFixed(1)}m`,
      form:        el.form ?? "0.0",
      totalPts:    el.total_points ?? 0,
      ep_next:     parseFloat(el.ep_next ?? "0"),
      ownership:   parseFloat(el.selected_by_percent ?? "0"),
      goals:       el.goals_scored ?? 0,
      assists:     el.assists ?? 0,
      news:        el.news ?? "",
      chance:      el.chance_of_playing_next_round ?? 100,
    }

    // Flanking + related players
    const fitByEpNext = (bootstrap.elements ?? [])
      .filter((p: any) =>
        p.id !== el.id &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 300 &&
        parseFloat(p.ep_next ?? "0") > 0
      )
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))

    const centerCard: FplCardPlayer = {
      code: player.code, name: player.webName, club: player.club,
      teamCode: player.teamCode, position: player.position,
      price: player.price, form: player.form, totalPts: player.totalPts,
    }
    const flank = fitByEpNext.slice(0, 4)
    const showcasePlayers: FplCardPlayer[] = [
      flank[0] ? toCard(flank[0], teamMap, posMap) : centerCard,
      flank[1] ? toCard(flank[1], teamMap, posMap) : centerCard,
      centerCard,
      flank[2] ? toCard(flank[2], teamMap, posMap) : centerCard,
      flank[3] ? toCard(flank[3], teamMap, posMap) : centerCard,
    ]

    // Related: same position, similar price, MID/FWD only — as transfer alternatives
    const playerCost = el.now_cost
    const samePosFit = (bootstrap.elements ?? [])
      .filter((p: any) =>
        p.id !== el.id &&
        p.element_type === el.element_type &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 300 &&
        Math.abs(p.now_cost - playerCost) <= 20 // within £2m
      )
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))
      .slice(0, 6)

    const relatedPlayers = samePosFit.map((p: any) => {
      const base = toSlug(p.web_name)
      const rSlug = slugLookup.get(base) === p.id
        ? base
        : toSlug(p.web_name, teamMap[p.team]?.short)
      return { name: p.web_name, slug: rSlug }
    })

    const ptsPerMillion = parseFloat(
      (el.total_points / (el.now_cost / 10)).toFixed(1)
    )

    return {
      gw: nextGW,
      player,
      opponent,
      isHome,
      fdr,
      showcasePlayers,
      relatedPlayers,
      slug,
      fixtureRun,
      ptsPerMillion,
      transfersInGW:  el.transfers_in_event  ?? 0,
      transfersOutGW: el.transfers_out_event ?? 0,
      priceChangeGW:  (el.cost_change_event  ?? 0) / 10,
      differentialAlternatives: (() => {
        try {
          const seenClubs = new Set<number>()
          return (bootstrap.elements ?? [])
            .filter((p: any) =>
              p.id !== el.id &&
              parseFloat(p.selected_by_percent ?? "0") < 10 &&
              (p.chance_of_playing_next_round ?? 100) >= 75 &&
              p.minutes >= 500 &&
              parseFloat(p.ep_next ?? "0") >= 4
            )
            .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))
            .filter((p: any) => {
              if (seenClubs.has(p.team)) return false
              seenClubs.add(p.team)
              return true
            })
            .slice(0, 4)
            .map((p: any) => {
              const base = toSlug(p.web_name)
              const dSlug = slugLookup.get(base) === p.id
                ? base
                : toSlug(p.web_name, teamMap[p.team]?.short)
              return {
                code:      p.code,
                name:      p.web_name,
                slug:      dSlug,
                ownership: parseFloat(p.selected_by_percent ?? "0"),
                ep_next:   parseFloat(p.ep_next ?? "0"),
                price:     `£${(p.now_cost / 10).toFixed(1)}m`,
                club:      teamMap[p.team]?.short ?? "",
                position:  posMap[p.element_type] ?? "",
              }
            })
        } catch {
          return []
        }
      })(),
    }
  } catch {
    return null
  }
}

// ─── Transfer text logic ──────────────────────────────────────────────────────

export function buildTransferPageText(d: PlayerTransferPageData): TransferPageTextResult {
  const { gw, player: p, fixtureRun, ptsPerMillion, transfersInGW, priceChangeGW } = d
  const formVal = parseFloat(p.form)
  const nowCost = parseFloat(p.price.replace("£", "").replace("m", ""))

  // Fixture run analysis — flatten all individual matches for difficulty counts
  const allMatches = fixtureRun.flatMap((f) => f.matches)
  const easyCount  = allMatches.filter((m) => m.fdr <= 3).length
  const hardCount  = allMatches.filter((m) => m.fdr >= 4).length
  const blankGWs   = fixtureRun.filter((f) => f.matches.length === 0)
  const doubleGWs  = fixtureRun.filter((f) => f.matches.length >= 2)
  const hasImmediateBlank = fixtureRun[0].matches.length === 0
  const hasBlankInRun  = blankGWs.length > 0
  const hasDoubleGW    = doubleGWs.length > 0
  const firstGWMatches = fixtureRun[0].matches
  const immediatelyTough = firstGWMatches.length > 0 && firstGWMatches.every((m) => m.fdr >= 4)
  const runImproves =
    immediatelyTough &&
    fixtureRun.slice(1).some((f) => f.matches.some((m) => m.fdr <= 3))

  // Verdict logic
  const isStrongBuy = p.ep_next >= 6 && easyCount >= 2 && formVal >= 5 && p.chance >= 75 && !hasImmediateBlank
  const isProbablyYes = p.ep_next >= 5 && easyCount >= 1 && formVal >= 4 && p.chance >= 75
  const isWait = !isStrongBuy && !isProbablyYes && runImproves && p.chance >= 75
  // everything else = probably not

  const verdictLabel =
    isStrongBuy   ? "TRANSFER IN"
    : isProbablyYes ? "WORTH CONSIDERING"
    : isWait        ? "WAIT"
    :                 "HOLD OFF"

  const verdict =
    isStrongBuy
      ? `Yes - the numbers back transferring ${p.webName} in before Gameweek ${gw}. His fixture run is favourable and expected points are among the strongest in his position.`
      : isProbablyYes
      ? `Worth considering - ${p.webName} is a reasonable transfer target, though the case is not clear-cut. Weigh up what you would sell to fit him in.`
      : isWait
      ? `Wait if you can. ${p.webName} has a tough GW${gw} fixture but his schedule improves from GW${fixtureRun.find(f => f.matches.some(m => m.fdr <= 3))?.gw ?? gw + 1} onwards. A week's patience could be the better entry point.`
      : `Probably not this week. ${p.webName}'s current numbers do not make a strong case for an immediate transfer. There may be better-timed opportunities ahead.`

  // Fixture run summary sentence
  const runSummary = (() => {
    if (hasImmediateBlank) return `${p.webName} has a blank in Gameweek ${gw} - he does not have a fixture this week.`
    if (firstGWMatches.length >= 2) {
      const parts = firstGWMatches.map((m) => `${m.opponent} (${m.isHome ? "H" : "A"})`).join(" and ")
      return `${p.webName} has a Double Gameweek ${gw} - ${parts}.`
    }
    const m = firstGWMatches[0]
    return `${p.webName}'s next fixture is ${m.opponent} (${m.isHome ? "H" : "A"}) in GW${gw}, rated ${m.fdr}/5 for difficulty.`
  })()

  const runContext = (() => {
    if (hasDoubleGW) {
      const dgw = doubleGWs[0]
      const dgwParts = dgw.matches.map((m) => `${m.opponent} (${m.isHome ? "H" : "A"})`).join(" and ")
      return `${p.webName} has a Double Gameweek in GW${dgw.gw} (${dgwParts}), which significantly increases his points potential over the coming weeks.`
    }
    if (easyCount >= 3) return `The run over the next 4 gameweeks looks very favourable - ${easyCount} of ${allMatches.length} fixtures are rated 3 or below for difficulty.`
    if (easyCount >= 2) return `Of the next 4 gameweeks, ${easyCount} fixtures have a difficulty rating of 3 or below - a decent run with some tougher patches.`
    if (hardCount >= 3) return `The fixture run over the next 4 gameweeks is challenging - ${hardCount} of ${allMatches.length} fixtures carry a difficulty rating of 4 or above.`
    return `The next 4 gameweeks present a mixed picture - not a standout run in either direction.`
  })()

  // Verdict bullets
  const verdictBullets = [
    formVal >= 6
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - strong recent output`
      : formVal >= 4
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - moderate returns`
      : `Form: ${p.form} pts/game over the last 6 gameweeks - below expectations`,
    hasDoubleGW
      ? `Double Gameweek: ${p.webName} has 2 fixtures in GW${doubleGWs[0].gw} - significantly higher points ceiling`
      : easyCount >= 2
      ? `Fixture run: ${easyCount} of the next ${allMatches.length} fixtures rated 3 or below for difficulty`
      : hardCount >= 3
      ? `Fixture run: ${hardCount} tough fixtures (FDR 4+) in the next 4 gameweeks`
      : `Fixture run: mixed picture over the next 4 gameweeks`,
    `Value: ${ptsPerMillion} points per million spent this season`,
  ]

  // Case for
  const caseFor: string[] = []
  const caseAgainst: string[] = []

  // Form
  if (formVal >= 6) caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - one of the better-returning players right now.`)
  else if (formVal >= 4) caseAgainst.push(`Form: only ${p.form} pts/game over the last 6 gameweeks - returns have not justified the price recently.`)
  else caseAgainst.push(`Form: ${p.form} pts/game over the last 6 gameweeks - the current numbers do not make a strong case for a transfer.`)

  // Double GW — always a strong case for buying
  if (hasDoubleGW) {
    const dgw = doubleGWs[0]
    const dgwParts = dgw.matches.map((m) => `${m.opponent} (${m.isHome ? "H" : "A"})`).join(" and ")
    caseFor.push(`Double Gameweek: ${p.webName} has two fixtures in GW${dgw.gw} (${dgwParts}). Owning him for a DGW significantly raises the ceiling on his points return.`)
  }

  // Fixture run
  if (easyCount >= 3) caseFor.push(`Fixture run: ${easyCount} of the next ${allMatches.length} fixtures are favourable (FDR 3 or below). An excellent window to own ${p.webName}.`)
  else if (easyCount >= 2) caseFor.push(`Fixture run: ${easyCount} manageable fixtures in the next 4 gameweeks - a reasonable time to bring him in.`)
  else if (hardCount >= 3) caseAgainst.push(`Fixture run: ${hardCount} difficult fixtures in the next 4 gameweeks. There may be a better time to transfer ${p.webName} in.`)
  else caseAgainst.push(`Fixture run: a mixed schedule over the next 4 weeks - not the ideal window for a premium transfer.`)

  // Blank
  if (hasImmediateBlank) caseAgainst.push(`Blank Gameweek: ${p.webName} has no fixture in GW${gw}. Transferring him in this week means taking a hit for a week with no return.`)
  else if (hasBlankInRun) caseAgainst.push(`Blank Gameweek ahead: ${p.webName} has no fixture in GW${blankGWs[0].gw}. Factor this into your squad planning.`)

  // ep_next
  if (p.ep_next >= 7) caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} - among the highest of any player in the game this week.`)
  else if (p.ep_next >= 5) caseFor.push(`Expected points: ${p.ep_next} xPts projected for GW${gw} - a solid return expectation.`)
  else caseAgainst.push(`Expected points: only ${p.ep_next} xPts projected for GW${gw} - the model does not back a high-scoring week immediately.`)

  // Value
  if (ptsPerMillion >= 16) caseFor.push(`Value: ${ptsPerMillion} points per million spent this season - strong return on investment for the price.`)
  else if (ptsPerMillion >= 13) caseFor.push(`Value: ${ptsPerMillion} points per million - respectable return for a premium asset.`)
  else caseAgainst.push(`Value: ${ptsPerMillion} points per million this season - not the strongest return at ${p.price}.`)

  // Price momentum
  if (priceChangeGW > 0) caseFor.push(`Price: ${p.webName} has risen £${priceChangeGW.toFixed(1)}m this gameweek - buying now locks in a lower price before further rises.`)
  else if (priceChangeGW < 0) caseAgainst.push(`Price: ${p.webName} has dropped £${Math.abs(priceChangeGW).toFixed(1)}m this gameweek - falling prices can signal a period of poor returns.`)

  // Availability
  if (p.chance < 75) caseAgainst.push(`Availability: ${formatFplNews(p.news)} - a real risk he does not start or plays reduced minutes.`)

  // Transfers in (momentum)
  if (transfersInGW > 200000) caseFor.push(`Transfer momentum: over ${Math.round(transfersInGW / 1000)}k managers have brought ${p.webName} in this gameweek - strong market confidence.`)
  else if (transfersInGW < 20000 && p.ownership >= 20) caseAgainst.push(`Transfer momentum: ${p.webName} is being transferred out more than in this gameweek - managers are moving away.`)

  if (caseFor.length === 0) caseFor.push(`${p.webName} is an established FPL asset who has delivered at various points this season. The case for buying is there at the right moment.`)
  if (caseAgainst.length === 0) caseAgainst.push(`At ${p.price}, you are sacrificing depth elsewhere in your squad. Any blank or injury sets you back significantly.`)

  const caseHeading =
    isStrongBuy || isProbablyYes
      ? `The case for transferring ${p.webName} in - GW${gw}`
      : `Why now might not be the right time to transfer ${p.webName} in`

  const ctaLeadin =
    isStrongBuy || isProbablyYes
      ? `Want to know who to sell to make room for ${p.webName}? ChatFPL AI can analyse your squad and find the best transfer route.`
      : `Not sure ${p.webName} is the right move? ChatFPL AI can suggest the strongest transfer targets for your squad and budget right now.`

  // Q&A items
  const qaItems: PlayerQA[] = [
    {
      id: "transfer",
      question: `Should I transfer ${p.webName} in before Gameweek ${gw}?`,
      answer: [
        verdict,
        "",
        runSummary,
        runContext,
        "",
        formVal >= 5
          ? `${p.webName} is in decent form, averaging ${p.form} pts/game over the last 6 gameweeks.`
          : `${p.webName} has averaged ${p.form} pts/game over the last 6 gameweeks - form that needs to improve to justify a premium transfer.`,
        "",
        `At ${p.price} he is a significant budget commitment. The real question is who you would sell to fit him in and whether that trade weakens your squad elsewhere.`,
        "",
        `ChatFPL AI can look at your specific squad and tell you whether the move makes sense for your team right now.`,
      ].join("\n"),
    },
    {
      id: "fixtures",
      question: `What is ${p.webName}'s fixture run for the next 4 gameweeks?`,
      answer: [
        runSummary,
        "",
        fixtureRun.map((f) => {
          if (f.matches.length === 0) return `GW${f.gw}: Blank gameweek - no fixture`
          if (f.matches.length >= 2) {
            const parts = f.matches.map((m) => `${m.opponent} (${m.isHome ? "Home" : "Away"}, FDR ${m.fdr}/5)`).join(" + ")
            return `GW${f.gw}: DOUBLE GW - ${parts}`
          }
          const m = f.matches[0]
          return `GW${f.gw}: ${m.opponent} (${m.isHome ? "Home" : "Away"}) - difficulty ${m.fdr}/5`
        }).join("\n"),
        "",
        runContext,
        "",
        `Fixture difficulty ratings are a guide but do not account for recent form, team news, or in-season momentum. ChatFPL AI can give you a fuller picture including how ${p.webName}'s club has been performing at home and away recently.`,
      ].join("\n"),
    },
    {
      id: "value",
      question: `Is ${p.webName} worth ${p.price} in FPL?`,
      answer: [
        ptsPerMillion >= 16
          ? `On the season numbers, yes - ${p.webName} has returned ${ptsPerMillion} points per million spent, which is solid for a premium asset.`
          : ptsPerMillion >= 13
          ? `The value case is reasonable. ${p.webName} has returned ${ptsPerMillion} points per million this season at ${p.price}.`
          : `The value case is harder to make right now. ${p.webName} has returned ${ptsPerMillion} points per million this season - below what you would want at ${p.price}.`,
        "",
        `${p.webName} has ${p.goals} goals and ${p.assists} assists this season for ${p.totalPts} total points. The question is not just whether those numbers are good, but whether they are good enough relative to what you give up to fit him in.`,
        "",
        `ChatFPL AI can compare ${p.webName}'s value against the other options in his position and tell you whether the budget allocation makes sense for your squad.`,
      ].join("\n"),
    },
    {
      id: "timing",
      question: `Is now the right time to buy ${p.webName}?`,
      answer: [
        isStrongBuy
          ? `Yes - the timing looks good. ${p.webName} has a favourable fixture run coming up and his form and expected points support an immediate transfer.`
          : isWait
          ? `Probably not this week. The GW${gw} fixture is tough, but ${p.webName}'s schedule softens from GW${fixtureRun.find(f => f.matches.some(m => m.fdr <= 3))?.gw ?? gw + 1}. If you have a free transfer next week, that could be the better entry point.`
          : `It depends on your squad situation. If you have a free transfer and need cover in ${p.webName}'s position, the case is there. If it costs you a transfer hit, the numbers this week do not strongly support that.`,
        "",
        `${runSummary} ${runContext}`,
        "",
        priceChangeGW > 0
          ? `${p.webName} is currently rising in price, which adds some urgency if you are planning to buy anyway.`
          : priceChangeGW < 0
          ? `${p.webName} has dropped in price this gameweek, suggesting outgoing transfer pressure. Monitor before committing.`
          : `${p.webName}'s price is stable this gameweek.`,
        "",
        `ChatFPL AI can factor in your current squad, budget, and remaining free transfers to give you a timing recommendation tailored to your team.`,
      ].join("\n"),
    },
  ]

  const welcome = `${verdict} Click a question below for the full transfer breakdown.`

  const verdictColor = "#00FF87"

  return {
    verdict, verdictLabel, verdictColor, verdictBullets,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELL PAGE — text logic (reuses PlayerTransferPageData from getPlayerTransferData)
// ═══════════════════════════════════════════════════════════════════════════════

export interface SellPageTextResult {
  verdict: string
  verdictLabel: string
  verdictColor: string
  verdictBullets: string[]
  ownershipContext: string
  dataDisclaimer: string
  caseFor: string[]
  caseAgainst: string[]
  caseHeading: string
  ctaLeadin: string
  qaItems: PlayerQA[]
  welcome: string
}

export function buildSellPageText(d: PlayerTransferPageData): SellPageTextResult {
  const { gw, player: p, fixtureRun, ptsPerMillion, transfersOutGW, priceChangeGW } = d
  const formVal   = parseFloat(p.form)
  const allMatches  = fixtureRun.flatMap((f) => f.matches)
  const easyCount   = allMatches.filter((m) => m.fdr <= 3).length
  const hardCount   = allMatches.filter((m) => m.fdr >= 4).length
  const blankGWs    = fixtureRun.filter((f) => f.matches.length === 0)
  const doubleGWs   = fixtureRun.filter((f) => f.matches.length >= 2)
  const hasImmediateBlank = fixtureRun[0].matches.length === 0
  const hasBlankInRun     = blankGWs.length > 0
  const hasDoubleGW       = doubleGWs.length > 0

  // ─── Verdict logic ──────────────────────────────────────────────────────────
  const isClearSell =
    p.chance < 75 ||
    (formVal < 3 && p.ep_next < 4 && easyCount === 0) ||
    (hasImmediateBlank && formVal < 4 && easyCount === 0)

  const isConsiderSelling = !isClearSell && (
    (formVal < 4 && p.ep_next < 5) ||
    (priceChangeGW < 0 && formVal < 5) ||
    (hardCount >= 3 && formVal < 5)
  )

  const isDontSell = !isClearSell && !isConsiderSelling && (
    (p.ep_next >= 6 && formVal >= 5 && easyCount >= 2) ||
    hasDoubleGW
  )

  const verdictLabel =
    isClearSell         ? "SELL"
    : isConsiderSelling ? "CONSIDER SELLING"
    : isDontSell        ? "DON'T SELL"
    :                     "HOLD"

  const verdict =
    isClearSell
      ? `The data this week leans towards selling. ${
          p.chance < 75
            ? `${p.webName} is ${p.news ? formatFplNews(p.news) : "carrying a fitness concern"}, which alone makes holding him a risk.`
            : `Form is below what you need from a premium asset, the fixture run is tough, and a significant number of managers have already moved him on.`
        } Whether it is the right call depends on what you bring in and your current rank position.`
      : isConsiderSelling
      ? `There is a case for selling ${p.webName} this week, though it is not clear-cut. The form and fixture picture do not inspire full confidence at this price. The decision comes down to your budget, your replacement target, and where you are sitting in your leagues.`
      : isDontSell
      ? `On the data alone, selling ${p.webName} this week looks like the wrong move. ${
          hasDoubleGW
            ? `He has a Double Gameweek in GW${doubleGWs[0].gw} - selling before a Double Gameweek is rarely the right call.`
            : `Expected points are strong, the fixture run is favourable, and the season numbers still justify the price.`
        }`
      : `The numbers do not strongly support selling ${p.webName} this week. Form and expected points are reasonable for the price, and the fixture run has workable weeks ahead. That said, only you know your squad balance and what you are trying to achieve.`

  // ─── Verdict bullets ────────────────────────────────────────────────────────
  const verdictBullets: string[] = [
    formVal < 3
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - poor output for a player at this price`
      : formVal < 5
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - below the level you want from a premium asset`
      : `Form: ${p.form} pts/game over the last 6 gameweeks - still producing at a reasonable level`,
    hasDoubleGW
      ? `Double Gameweek: ${p.webName} has 2 fixtures in GW${doubleGWs[0].gw} - high ceiling in the short term`
      : hardCount >= 3
      ? `Fixture run: ${hardCount} of the next ${allMatches.length} fixtures are rated 4 or above for difficulty`
      : easyCount >= 2
      ? `Fixture run: ${easyCount} favourable fixtures in the next 4 gameweeks`
      : `Fixture run: mixed picture over the next 4 gameweeks`,
    transfersOutGW > 50000
      ? `Transfer activity: ${Math.round(transfersOutGW / 1000)}k managers have sold ${p.webName} this gameweek`
      : priceChangeGW < 0
      ? `Price: ${p.webName} has dropped £${Math.abs(priceChangeGW).toFixed(1)}m this gameweek`
      : `Value: ${ptsPerMillion} points per million spent this season`,
  ]

  // ─── Ownership context (woven into verdict block) ───────────────────────────
  const ownershipContext =
    p.ownership >= 40
      ? `Ownership stands at ${p.ownership}%. More than four in ten FPL managers own ${p.webName}. If he scores heavily and you have sold him, you lose ground on a large portion of the field. If he blanks, you gain on them. This cuts both ways - ownership is a risk parameter, not a reason to hold or sell by itself. Your rank ambition and what you bring in are the deciding factors.`
      : p.ownership >= 20
      ? `Ownership stands at ${p.ownership}%. A meaningful share of the game owns ${p.webName}, but selling is not a dramatic differential move at this level. The rank impact of a blank or a big score is real but manageable depending on your league positions.`
      : `Ownership stands at ${p.ownership}%. At this level, selling is a low-risk differential move in terms of rank impact. The decision is almost entirely about whether your budget works harder elsewhere.`

  const dataDisclaimer = `This page presents the statistics. The decision is yours. For a recommendation based on your specific squad, budget, and remaining gameweeks, ask ChatFPL AI directly.`

  // ─── Case for selling ───────────────────────────────────────────────────────
  const caseFor: string[] = []
  const caseAgainst: string[] = []

  if (p.chance < 75) caseFor.push(`Availability: ${p.news ? formatFplNews(p.news) : "Fitness doubt"} - a player you cannot rely on to start is worth reconsidering at this price.`)
  if (formVal < 3) caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - poor output that is hard to justify at ${p.price}.`)
  else if (formVal < 5) caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - below the standard you want from a player at this price.`)
  if (hardCount >= 3) caseFor.push(`Fixture run: ${hardCount} of the next ${allMatches.length} fixtures are rated 4 or above for difficulty. There are cheaper options with better schedules.`)
  if (hasImmediateBlank) caseFor.push(`Blank Gameweek: ${p.webName} has no fixture in GW${gw}. Holding him this week costs you a week of returns.`)
  else if (hasBlankInRun && !hasDoubleGW) caseFor.push(`Blank ahead: ${p.webName} has no fixture in GW${blankGWs[0].gw}. Factor that into how many weeks of returns you are actually getting.`)
  if (priceChangeGW < 0) caseFor.push(`Price falling: ${p.webName} has dropped £${Math.abs(priceChangeGW).toFixed(1)}m this gameweek. Continued selling pressure means delayed action costs you transfer value.`)
  if (transfersOutGW > 100000) caseFor.push(`Selling pressure: ${Math.round(transfersOutGW / 1000)}k managers have sold ${p.webName} this week. That level of outward movement typically signals a shift in confidence across the game.`)
  if (ptsPerMillion < 13) caseFor.push(`Value: ${ptsPerMillion} points per million this season - below what you should expect from a player at ${p.price}.`)

  // ─── Case against selling (reasons to hold) ─────────────────────────────────
  if (hasDoubleGW) caseAgainst.push(`Double Gameweek: ${p.webName} has two fixtures in GW${doubleGWs[0].gw}. Selling before a Double Gameweek is almost always the wrong timing.`)
  if (p.ep_next >= 6) caseAgainst.push(`Expected points: ${p.ep_next} xPts projected for GW${gw} - among the stronger return expectations in his position this week.`)
  else if (p.ep_next >= 4) caseAgainst.push(`Expected points: ${p.ep_next} xPts projected for GW${gw} - a reasonable return expectation that does not make selling urgent.`)
  if (easyCount >= 3) caseAgainst.push(`Fixture run: ${easyCount} favourable fixtures in the next 4 gameweeks. The schedule softens, which typically improves returns.`)
  else if (easyCount >= 2) caseAgainst.push(`Fixture run: ${easyCount} manageable fixtures ahead. Patience may be rewarded over the coming weeks.`)
  if (priceChangeGW > 0) caseAgainst.push(`Price rising: ${p.webName} has gained £${priceChangeGW.toFixed(1)}m this gameweek. Selling now means a lower sell price than if you wait.`)
  if (formVal >= 6) caseAgainst.push(`Form: ${p.form} pts/game over the last 6 gameweeks - currently one of the better-returning players in the game.`)
  if (ptsPerMillion >= 16) caseAgainst.push(`Season value: ${ptsPerMillion} points per million this season remains strong. A short run of poor form does not erase that.`)

  if (caseFor.length === 0)     caseFor.push(`${p.webName} is not producing at the level you need from an asset at ${p.price}. The budget could work harder elsewhere.`)
  if (caseAgainst.length === 0) caseAgainst.push(`${p.webName} remains a viable squad option. The case for selling is not strong enough on current data to make it a priority move.`)

  const caseHeading = isClearSell || isConsiderSelling
    ? `The case for selling ${p.webName} in GW${gw}`
    : `Why selling ${p.webName} this week may be premature`

  const ctaLeadin = isClearSell || isConsiderSelling
    ? `Know what you want to buy but not sure the move adds up for your squad? ChatFPL AI can weigh your full squad and budget and tell you whether the transfer is worth it.`
    : `Want to know if there is a better option than ${p.webName} at his price? ChatFPL AI can compare the alternatives and tell you whether a switch makes sense.`

  // ─── Q&A ────────────────────────────────────────────────────────────────────
  const qaItems: PlayerQA[] = [
    {
      id: "sell",
      question: `Should I sell ${p.webName} before Gameweek ${gw}?`,
      answer: [verdict, "", ownershipContext, "", dataDisclaimer].join("\n"),
    },
    {
      id: "ownership",
      question: `What is the ownership risk of selling ${p.webName}?`,
      answer: [
        ownershipContext,
        "",
        `If ${p.webName} scores heavily and you have sold him, every manager who kept him gains those points on you directly. At ${p.ownership}% ownership, that is a large portion of the field. If he blanks, you gain on those same managers.`,
        "",
        `There is no universal right answer - it depends on your current rank, your target finish, and how many gameweeks remain. ChatFPL AI can contextualise this against your specific situation.`,
      ].join("\n"),
    },
    {
      id: "price",
      question: `Is ${p.webName}'s price likely to drop further?`,
      answer: [
        priceChangeGW < 0
          ? `${p.webName} has already dropped £${Math.abs(priceChangeGW).toFixed(1)}m this gameweek. FPL prices fall when more managers are selling than buying.`
          : priceChangeGW > 0
          ? `${p.webName}'s price has risen £${priceChangeGW.toFixed(1)}m this gameweek, meaning more managers are buying than selling right now.`
          : `${p.webName}'s price is stable this gameweek - transfer activity in and out is roughly balanced.`,
        "",
        transfersOutGW > 50000
          ? `${Math.round(transfersOutGW / 1000)}k managers have sold him this week. If that level of outward movement continues, further falls are likely.`
          : `Current selling pressure is not at a level that would typically trigger a price drop imminently.`,
        "",
        `FPL price changes are calculated overnight. If you are planning to sell, the timing within a week can affect the sell price you receive.`,
      ].join("\n"),
    },
    {
      id: "replacement",
      question: `Who should I buy if I sell ${p.webName}?`,
      answer: [
        `The right replacement depends on your available budget after selling ${p.webName} at his current sell price, and which areas of your squad need strengthening most.`,
        "",
        `The key questions are: does the replacement have a better fixture run over the next 4 gameweeks, a stronger recent form score, and a comparable expected points projection for the money?`,
        "",
        `ChatFPL AI can look at your specific squad, your budget after selling ${p.webName}, and the current data to suggest the strongest available options in his position and elsewhere.`,
      ].join("\n"),
    },
  ]

  const welcome = `${verdict} Click a question below for the full breakdown.`
  const verdictColor = "#00FF87"

  return {
    verdict, verdictLabel, verdictColor, verdictBullets,
    ownershipContext, dataDisclaimer,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIFFERENTIAL PAGE — text logic
// ═══════════════════════════════════════════════════════════════════════════════

export interface DifferentialPageTextResult {
  verdictLabel: string
  verdictColor: string
  verdict: string
  verdictBullets: string[]
  captaincyPanel: string | null
  caseFor: string[]
  caseAgainst: string[]
  caseHeading: string
  ctaLeadin: string
  qaItems: PlayerQA[]
  welcome: string
  showAlternatives: boolean
}

export function buildDifferentialPageText(d: PlayerTransferPageData): DifferentialPageTextResult {
  const { gw, player: p, fixtureRun } = d
  const formVal     = parseFloat(p.form)
  const allMatches  = fixtureRun.flatMap((f) => f.matches)
  const easyCount   = allMatches.filter((m) => m.fdr <= 3).length
  const hardCount   = allMatches.filter((m) => m.fdr >= 4).length
  const doubleGWs   = fixtureRun.filter((f) => f.matches.length >= 2)
  const hasDoubleGW = doubleGWs.length > 0
  const hasImmediateBlank = fixtureRun[0]?.matches.length === 0
  const goodReturn  = p.ep_next >= 5 && formVal >= 4
  const isStrongDiff = p.ownership < 5
  const isDiff       = p.ownership >= 5  && p.ownership < 10
  const isMildDiff   = p.ownership >= 10 && p.ownership < 20
  const isNotDiff    = p.ownership >= 20

  const verdictLabel =
    isNotDiff    ? "NOT A DIFFERENTIAL"
    : isMildDiff ? "MILD DIFFERENTIAL"
    : isDiff     ? "DIFFERENTIAL"
    :               "STRONG DIFFERENTIAL"

  const verdictColor = "#00FF87"

  const verdict =
    isNotDiff
      ? `At ${p.ownership}% ownership, ${p.webName} does not qualify as a differential pick. Owning or not owning him is a template decision that carries significant rank consequences either way, but that is a different calculation to differential selection. If you are looking for low-ownership players who could swing your rank this week, the genuine differentials are listed below.`
      : isMildDiff
      ? goodReturn && easyCount >= 2
        ? `At ${p.ownership}% ownership, ${p.webName} sits in mild differential territory. The fixture and form data this week support a return, which makes the ownership gap meaningful. A big score would see you gain on a useful portion of the field.`
        : `At ${p.ownership}% ownership, ${p.webName} is a mild differential at best. The ownership gap is not wide enough to make a return rank-defining, and the current data does not strongly support an imminent big haul.`
      : isDiff
      ? goodReturn && easyCount >= 2
        ? `At ${p.ownership}% ownership, ${p.webName} has genuine differential potential in GW${gw}. The fixture and form both support a return this week. If he scores, you gain on approximately ${100 - Math.round(p.ownership)}% of the field.`
        : `At ${p.ownership}% ownership, ${p.webName} qualifies as a differential on ownership alone. However, the current form and fixture data mean this is a speculative pick rather than a data-backed one. Whether the gamble is worth it depends on your rank situation.`
      : goodReturn && easyCount >= 2
      ? `At ${p.ownership}% ownership, ${p.webName} is a strong differential pick for GW${gw}. The data backs a return - form is solid, the fixture is favourable, and a haul would see you jump past approximately ${100 - Math.round(p.ownership)}% of managers. On the numbers, this is one of the more compelling differential calls available right now.`
      : `At ${p.ownership}% ownership, ${p.webName} has maximum differential potential. A single big return would be a rank-defining moment. The risk is that low ownership can reflect what the broader game has already assessed - the form and fixture data this week are the deciding factor on whether the gamble is justified.`

  const verdictBullets: string[] = [
    `Ownership: ${p.ownership}% - ${isNotDiff ? "template player, not a differential" : isStrongDiff ? "true differential territory" : isMildDiff ? "mild differential" : "solid differential range"}`,
    p.ep_next >= 6
      ? `Expected points: ${p.ep_next} xPts for GW${gw} - strong return projection`
      : p.ep_next >= 4
      ? `Expected points: ${p.ep_next} xPts for GW${gw} - reasonable return expectation`
      : `Expected points: ${p.ep_next} xPts for GW${gw} - low return projection weakens the differential case`,
    hasDoubleGW
      ? `Double Gameweek in GW${doubleGWs[0].gw}: two fixtures doubles the ceiling of a differential hold`
      : easyCount >= 2
      ? `Fixture run: ${easyCount} favourable fixtures in the next 4 gameweeks`
      : hardCount >= 3
      ? `Fixture run: ${hardCount} tough fixtures ahead, reducing the differential appeal`
      : `Fixture run: mixed picture over the next 4 gameweeks`,
  ]

  const captaincyPanel = p.ownership < 15
    ? (() => {
        const swing = (100 - Math.round(p.ownership)).toFixed(0)
        if (p.ep_next >= 5 && formVal >= 4) {
          return `Differential captaincy upside: if you captain ${p.webName} and he returns 12 points, you receive 24. At ${p.ownership}% ownership, approximately ${swing}% of managers receive 0 captain points from him. That is the rank swing that makes differential captaincy one of the highest-leverage calls in the game - and the current data supports ${p.webName} as a live option.`
        }
        return `Differential captaincy note: captaining a ${p.ownership}% owned player amplifies the rank impact of any return. At this ownership level, a 12-point haul as captain would see you gain significantly on approximately ${swing}% of managers. The risk is proportional - a blank from a differential captain costs no rank points directly, but represents a missed opportunity relative to managers who captained a higher-return option.`
      })()
    : null

  const caseFor: string[] = []
  const caseAgainst: string[] = []

  if (!isNotDiff) {
    caseFor.push(`Ownership: at ${p.ownership}%, a single good return creates a meaningful rank advantage over the ${100 - Math.round(p.ownership)}% of managers who do not own him.`)
  }
  if (p.ep_next >= 6) caseFor.push(`Expected points: ${p.ep_next} xPts projected for GW${gw} - the model backs a return at worthwhile odds for a differential play.`)
  else if (p.ep_next >= 4 && !isNotDiff) caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} - a reasonable floor for a differential pick. Not elite projection, but viable.`)
  if (formVal >= 6) caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - actively scoring, not just theoretically differential.`)
  else if (formVal >= 4 && !isNotDiff) caseFor.push(`Form: ${p.form} pts/game - moderate recent output. The differential case is not purely speculative.`)
  if (hasDoubleGW) caseFor.push(`Double Gameweek: a DGW amplifies the differential upside significantly. Two chances to return means a higher ceiling for a low-owned pick.`)
  if (easyCount >= 3) caseFor.push(`Fixture run: ${easyCount} favourable fixtures in the next 4 gameweeks - a sustained differential window, not a one-week gamble.`)
  else if (easyCount >= 2 && !isNotDiff) caseFor.push(`Fixture run: ${easyCount} manageable fixtures ahead. The schedule supports holding a differential pick beyond this week.`)
  if (!isNotDiff && p.chance >= 100 && !p.news) caseFor.push(`Availability: no fitness concerns - a differential who misses through injury is the worst outcome.`)

  if (isNotDiff) caseAgainst.push(`Ownership: at ${p.ownership}%, ${p.webName} is a template player. Not owning him is the differential decision - and it carries significant rank risk if he returns.`)
  if (formVal < 3) caseAgainst.push(`Form: ${p.form} pts/game over the last 6 gameweeks - low ownership can reflect what the broader game has already assessed.`)
  else if (formVal < 4 && !isNotDiff) caseAgainst.push(`Form: ${p.form} pts/game - below what you want from a differential who needs to deliver to justify the squad spot.`)
  if (p.ep_next < 4) caseAgainst.push(`Expected points: only ${p.ep_next} xPts projected for GW${gw}. A differential needs some return floor to be viable - the model does not back one this week.`)
  if (hardCount >= 3) caseAgainst.push(`Fixture run: ${hardCount} tough fixtures in the next 4 gameweeks. A differential pick with a hard schedule is a short-term gamble rather than a planned hold.`)
  if (hasImmediateBlank) caseAgainst.push(`Blank Gameweek: ${p.webName} has no fixture in GW${gw}. There is no differential opportunity this week.`)
  if (p.chance < 75) caseAgainst.push(`${p.news ? formatFplNews(p.news) : "Fitness doubt"} - a differential pick who does not play delivers zero rank benefit.`)
  if (!isNotDiff && formVal < 4 && hardCount >= 2) caseAgainst.push(`Low ownership may reflect consensus: when most managers avoid a player, it is worth understanding why before framing it as an opportunity.`)

  if (caseFor.length === 0) caseFor.push(`${p.webName} has shown the ability to return points at this level. The differential case can emerge at the right moment.`)
  if (caseAgainst.length === 0) caseAgainst.push(`The main risk of any differential pick is a blank when others captain and return. The rank swing works both ways.`)

  const caseHeading = isNotDiff
    ? `Why ${p.webName} is not a differential pick`
    : isStrongDiff && goodReturn
    ? `The case for ${p.webName} as a strong differential in GW${gw}`
    : `Weighing ${p.webName} as a differential in GW${gw}`

  const ctaLeadin = isNotDiff
    ? `Want to find the genuine differentials for your squad this week? ChatFPL AI can identify the low-owned players best suited to your team and rank situation.`
    : goodReturn
    ? `Want to know if ${p.webName} fits your squad as a differential pick? ChatFPL AI can assess whether the move makes sense for your team and rank target.`
    : `Not sure if ${p.webName} is the right differential call? ChatFPL AI can suggest the strongest low-ownership options available this week.`

  const qaItems: PlayerQA[] = [
    {
      id: "differential",
      question: `Is ${p.webName} a good differential for Gameweek ${gw}?`,
      answer: [
        verdict,
        "",
        captaincyPanel ?? `At ${p.ownership}% ownership, the rank impact of ${p.webName} returning or blanking is ${isNotDiff ? "substantial for managers on either side" : "meaningful but manageable"}.`,
      ].join("\n"),
    },
    {
      id: "rank-impact",
      question: `What is the rank impact of ${p.webName} returning at ${p.ownership}% ownership?`,
      answer: [
        `At ${p.ownership}% ownership, approximately ${100 - Math.round(p.ownership)}% of FPL managers do not own ${p.webName}.`,
        "",
        isNotDiff
          ? `If ${p.webName} scores 12 points, every manager who owns him gains those points on you. At ${p.ownership}% ownership, that is the majority of the field. This is why avoiding a high-ownership player is considered a differential move in itself - the rank risk of being wrong is significant.`
          : `If ${p.webName} scores 12 points, you gain on approximately ${100 - Math.round(p.ownership)}% of managers who did not own him. If he blanks, you lose nothing in rank terms relative to those same managers. The rank impact is asymmetric - ownership this low means the upside of a return outweighs the downside of a blank.`,
        "",
        `For precise rank modelling based on your current position and mini-league standing, ChatFPL AI can give you a more contextual answer.`,
      ].join("\n"),
    },
    {
      id: "captaincy",
      question: `Should I captain ${p.webName} as a differential pick?`,
      answer: [
        p.ownership < 15
          ? captaincyPanel ?? `At ${p.ownership}% ownership, captaining ${p.webName} is a high-leverage call.`
          : `At ${p.ownership}% ownership, captaining ${p.webName} is not a differential decision - it is a standard captain choice that affects your rank relative to the majority who own him.`,
        "",
        p.ep_next >= 5
          ? `The expected points projection of ${p.ep_next} for GW${gw} makes the captaincy case stronger. The model backs a return.`
          : `The expected points projection of ${p.ep_next} for GW${gw} is modest. Captaining a differential with a low return ceiling is high variance.`,
        "",
        `ChatFPL AI can compare ${p.webName} against the other captaincy options available this week and recommend the best call for your squad.`,
      ].join("\n"),
    },
    {
      id: "why-low-owned",
      question: `Why is ${p.webName} ${isNotDiff ? "so widely owned" : "low-owned"} in FPL?`,
      answer: [
        isNotDiff
          ? `${p.webName} is owned by ${p.ownership}% of managers because he has been one of the more consistent points scorers in the game. ${formVal >= 5 ? `His current form of ${p.form} pts/game reinforces why managers hold him.` : `Even through periods of lower form, his ceiling and captaincy potential keep ownership high.`}`
          : `${p.webName} is owned by ${p.ownership}% of managers, which puts him outside the typical FPL template. ${formVal < 4 ? `Recent form of ${p.form} pts/game has likely reduced confidence in him.` : `This may reflect a perception gap between his actual output and how widely tracked he is.`} Low ownership in FPL can mean the market has missed something - or it can mean most managers have a reason not to own him. The form and fixture data are the clearest signals of which applies here.`,
      ].join("\n"),
    },
  ]

  const welcome = `${verdict} Click a question below for the full differential breakdown.`
  const showAlternatives = p.ownership >= 5

  return {
    verdictLabel, verdictColor, verdict, verdictBullets,
    captaincyPanel,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
    showAlternatives,
  }
}

// ─── Hub shared types ─────────────────────────────────────────────────────────

export interface CaptainHubPlayer {
  slug: string
  displayName: string
  webName: string
  code: number
  club: string
  teamCode: number
  position: string
  price: string
  form: string
  ep_next: number
  ownership: string
  news: string
  chance: number
  fdrNext: number | null
}

export interface CaptainHubData {
  gw: number
  players: CaptainHubPlayer[]
}

export async function getCaptainHub(): Promise<CaptainHubData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number =
      nextEvent?.id ??
      (currentEvent ? currentEvent.id + 1 : 1)

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Fetch next GW fixtures for FDR
    let fdrByTeam: Record<number, number> = {}
    try {
      const fixtRes = await fetch(
        `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
        { headers: FPL_HEADERS, next: { revalidate: 900 } }
      )
      const fixtures = await fixtRes.json()
      fixtures.forEach((f: any) => {
        if (fdrByTeam[f.team_h] === undefined) fdrByTeam[f.team_h] = f.team_h_difficulty
        if (fdrByTeam[f.team_a] === undefined) fdrByTeam[f.team_a] = f.team_a_difficulty
      })
    } catch { /* fixtures optional */ }

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idToSlug = new Map<number, string>()
    for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

    // Only outfield players with a next fixture, sorted by ep_next desc
    const candidates = eligible
      .filter((p: any) =>
        p.element_type !== 1 &&                  // no GKs
        (p.chance_of_playing_next_round ?? 100) > 0 // exclude ruled-out
      )
      .sort((a: any, b: any) =>
        parseFloat(b.ep_next ?? "0") - parseFloat(a.ep_next ?? "0")
      )
      .slice(0, 15)

    const players: CaptainHubPlayer[] = candidates.map((p: any) => {
      const team = teamMap[p.team] ?? { name: "", short: "?", code: 0 }
      const slug = idToSlug.get(p.id) ?? toSlug(p.web_name)
      return {
        slug,
        displayName: getDisplayName(p),
        webName: p.web_name,
        code: p.code,
        club: team.short,
        teamCode: team.code,
        position: posMap[p.element_type] ?? "",
        price: `£${(p.now_cost / 10).toFixed(1)}m`,
        form: p.form ?? "0.0",
        ep_next: parseFloat(p.ep_next ?? "0"),
        ownership: p.selected_by_percent ?? "0.0",
        news: p.news ?? "",
        chance: p.chance_of_playing_next_round ?? 100,
        fdrNext: fdrByTeam[p.team] ?? null,
      }
    })

    return { gw, players }
  } catch {
    return null
  }
}

// ─── Differentials Hub ────────────────────────────────────────────────────────

export interface DifferentialHubPlayer extends CaptainHubPlayer {
  ownershipRaw: number
  diffCategory: "Strong differential" | "Differential" | "Mild differential"
}

export interface DifferentialHubData {
  gw: number
  players: DifferentialHubPlayer[]
}

export async function getDifferentialHub(): Promise<DifferentialHubData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent   = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number =
      nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // FDR for next GW
    let fdrByTeam: Record<number, number> = {}
    try {
      const fixtRes = await fetch(
        `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
        { headers: FPL_HEADERS, next: { revalidate: 900 } }
      )
      const fixtures = await fixtRes.json()
      fixtures.forEach((f: any) => {
        if (fdrByTeam[f.team_h] === undefined) fdrByTeam[f.team_h] = f.team_h_difficulty
        if (fdrByTeam[f.team_a] === undefined) fdrByTeam[f.team_a] = f.team_a_difficulty
      })
    } catch { /* optional */ }

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idToSlug = new Map<number, string>()
    for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

    // Outfield, available, ownership < 20%, ep_next > 0
    // Sorted by ep_next ÷ ownership — rewards high xPts at low ownership
    const candidates = eligible
      .filter((p: any) =>
        p.element_type !== 1 &&
        (p.chance_of_playing_next_round ?? 100) > 0 &&
        parseFloat(p.selected_by_percent ?? "0") < 20 &&
        parseFloat(p.ep_next ?? "0") > 0
      )
      .sort((a: any, b: any) => {
        const scoreA = parseFloat(a.ep_next ?? "0") / Math.max(parseFloat(a.selected_by_percent ?? "1"), 0.5)
        const scoreB = parseFloat(b.ep_next ?? "0") / Math.max(parseFloat(b.selected_by_percent ?? "1"), 0.5)
        return scoreB - scoreA
      })
      .slice(0, 15)

    const players: DifferentialHubPlayer[] = candidates.map((p: any) => {
      const team = teamMap[p.team] ?? { name: "", short: "?", code: 0 }
      const slug = idToSlug.get(p.id) ?? toSlug(p.web_name)
      const ownershipRaw = parseFloat(p.selected_by_percent ?? "0")
      const diffCategory: DifferentialHubPlayer["diffCategory"] =
        ownershipRaw < 5 ? "Strong differential" : ownershipRaw < 10 ? "Differential" : "Mild differential"
      return {
        slug,
        displayName: getDisplayName(p),
        webName: p.web_name,
        code: p.code,
        club: team.short,
        teamCode: team.code,
        position: posMap[p.element_type] ?? "",
        price: `£${(p.now_cost / 10).toFixed(1)}m`,
        form: p.form ?? "0.0",
        ep_next: parseFloat(p.ep_next ?? "0"),
        ownership: p.selected_by_percent ?? "0.0",
        ownershipRaw,
        news: p.news ?? "",
        chance: p.chance_of_playing_next_round ?? 100,
        fdrNext: fdrByTeam[p.team] ?? null,
        diffCategory,
      }
    })

    return { gw, players }
  } catch {
    return null
  }
}
