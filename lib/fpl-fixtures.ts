import {
  getBootstrap,
  buildSlugLookup,
  getDisplayName,
  toSlug,
  isEligiblePlayer,
  FPL_HEADERS,
} from "@/lib/fpl-player-page"
import type { PlayerQA } from "@/components/conversational-player"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FixtureGW {
  gw: number
  opponentShort: string
  opponentName: string
  opponentCode: number
  isHome: boolean
  fdr: number           // 1-5
}

export interface FixtureHubPlayer {
  slug: string
  code: number
  displayName: string
  webName: string
  club: string
  clubShort: string
  teamCode: number
  position: string
  price: string
  form: string
  ep_next: number
  totalPts: number
  ownership: number
  transfersIn: number
  news: string
  chance: number
  status: string
  fixtures: FixtureGW[]   // next 5 gameweeks
  avgFdr: number          // average FDR over next 5
  verdictLabel: string    // "Favourable" | "Mixed" | "Challenging"
}

export interface FixturePageData {
  gw: number
  player: FixtureHubPlayer
}

// ─── Eligibility — broader than captain pages ─────────────────────────────────
// A player gets a fixture page if they pass the standard threshold OR show
// current-week momentum (high TI) or hot form. Pages are added to the sitemap
// automatically as players cross these thresholds mid-season.

export function isFixtureEligible(p: any): boolean {
  const mins  = p.minutes ?? 0
  const sel   = parseFloat(p.selected_by_percent ?? "0")
  const form  = parseFloat(p.form ?? "0")
  const tiGW  = p.transfers_in_event ?? 0

  // Base eligibility — same as all other pSEO pages
  if ((mins >= 1000 && sel >= 1.0) || mins >= 2000) return true
  // Transfer surge this GW (managers are buying so users are searching)
  if (tiGW >= 10000) return true
  // Hot form with meaningful minutes
  if (form >= 4.0 && mins >= 500) return true

  return false
}

// ─── FDR helpers ──────────────────────────────────────────────────────────────

export const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// All colours are green/white only — no red or amber
export function fdrColor(fdr: number): string {
  if (fdr <= 2) return "#00FF87"
  if (fdr === 3) return "rgba(255,255,255,0.85)"
  if (fdr === 4) return "rgba(255,255,255,0.45)"
  return "rgba(255,255,255,0.25)"
}

export function fdrBg(fdr: number): string {
  if (fdr <= 2) return "rgba(0,255,135,0.15)"
  if (fdr === 3) return "rgba(255,255,255,0.08)"
  if (fdr === 4) return "rgba(255,255,255,0.04)"
  return "rgba(255,255,255,0.02)"
}

function verdictFromAvg(avg: number): string {
  if (avg <= 2.5) return "Favourable"
  if (avg <= 3.5) return "Mixed"
  return "Challenging"
}

// ─── Text generation — hub cards ─────────────────────────────────────────────

export function buildFixtureHubText(
  player: FixtureHubPlayer,
  gw: number | string,
  rank: number
): string {
  const name    = player.displayName
  const fix1    = player.fixtures[0]
  const fixture = fix1
    ? `${fix1.opponentName} (${fix1.isHome ? "H" : "A"})`
    : "their next opponent"
  const fdrLabel = fix1 ? (FDR_LABELS[fix1.fdr] ?? "Medium") : "Medium"
  const favCount = player.fixtures.filter((f) => f.fdr <= 2).length
  const verdict  = player.verdictLabel

  const variant = rank % 3

  if (variant === 0) {
    return `${name} opens their upcoming schedule against ${fixture} in Gameweek ${gw}, ` +
      `a fixture rated ${fdrLabel} by the FPL difficulty model. ` +
      `Looking at the full five-game run ahead, the overall schedule is rated ${verdict.toLowerCase()}` +
      `${favCount >= 3 ? `, with ${favCount} out of five fixtures falling in the easier bracket` : ""}. ` +
      `At ${player.ownership}% ownership, building your squad around this schedule ` +
      `${verdict === "Favourable" ? "has strong case right now" : "requires weighing up form against the difficulty ahead"}.`
  }

  if (variant === 1) {
    return `The fixture run ahead is rated ${verdict.toLowerCase()} for ${name}. ` +
      `Starting with ${fixture} in Gameweek ${gw}, ` +
      `${favCount >= 3
        ? `the schedule offers ${favCount} favourable matchups in the next five games - a genuine window to accumulate points`
        : `the upcoming five games mix easier and tougher opponents, so form will be the deciding factor`}. ` +
      `Form of ${player.form} per game over the last six gameweeks ` +
      `${parseFloat(player.form) >= 5 ? "backs the fixture case" : "is the variable to track"}. ` +
      `The full analysis is available on their individual page.`
  }

  return `Planning around ${name}'s fixtures over the next five gameweeks: ` +
    `the schedule is ${verdict.toLowerCase()}, with the immediate test being ${fixture}. ` +
    `Owned by ${player.ownership}% of managers, ` +
    `${verdict === "Favourable"
      ? "the combination of ownership and fixture appeal makes this one of the stronger holds in the current period"
      : "there may be better-scheduled alternatives worth considering alongside this player before committing"}. ` +
    `Check the full fixture run on their page for the complete picture.`
}

// ─── Text generation — individual fixture page ────────────────────────────────

export function buildFixturePageText(player: FixtureHubPlayer, gw: number): {
  verdictLabel: string
  verdictText: string
  verdictBullets: string[]
  caseFor: string[]
  caseAgainst: string[]
  qaItems: PlayerQA[]
  welcome: string
  ctaLeadin: string
} {
  const name     = player.displayName
  const fix1     = player.fixtures[0]
  const verdict  = player.verdictLabel
  const favCount = player.fixtures.filter((f) => f.fdr <= 2).length
  const hardCount = player.fixtures.filter((f) => f.fdr >= 4).length
  const fixture1 = fix1 ? `${fix1.opponentName} (${fix1.isHome ? "H" : "A"})` : "their next opponent"
  const fdr1Label = fix1 ? (FDR_LABELS[fix1.fdr] ?? "Medium") : "Medium"
  const isInjured = player.chance === 0 || player.status === "i"
  const isDoubt   = player.chance > 0 && player.chance < 75
  const blankGW   = player.ep_next === 0

  // Verdict text
  let verdictText = ""
  if (blankGW) {
    verdictText = `${name} has a Blank Gameweek ${gw} - no fixture is scheduled for their club this week. The fixture run picks up again after this break.`
  } else if (isInjured) {
    verdictText = `${name} is currently unavailable. The fixture schedule below shows what they will return to when fit - worth monitoring ahead of the deadline.`
  } else if (verdict === "Favourable") {
    verdictText = `${name} has a favourable run of fixtures in the coming weeks, making them a strong hold or transfer target right now. The schedule supports sustained point-scoring across multiple gameweeks.`
  } else if (verdict === "Mixed") {
    verdictText = `${name} faces a mixed set of upcoming fixtures. There are opportunities in the schedule, but also tests that separate reliable performers from one-game punts. Form will be the deciding factor.`
  } else {
    verdictText = `${name} faces a challenging stretch of fixtures. The schedule eases eventually, but patience is required for anyone holding or considering an investment right now.`
  }

  // Verdict bullets
  const verdictBullets: string[] = []
  if (fix1) verdictBullets.push(`Next fixture: ${fixture1} - rated ${fdr1Label} for difficulty`)
  if (favCount >= 3) verdictBullets.push(`${favCount} out of the next five games fall in the favourable bracket`)
  if (hardCount >= 2) verdictBullets.push(`${hardCount} challenging fixtures in the next five - selectivity matters`)
  verdictBullets.push(`Form: ${player.form} points per game over the last six gameweeks`)
  if (!blankGW) verdictBullets.push(`Expected points for Gameweek ${gw}: ${player.ep_next.toFixed(1)}`)

  // Case for
  const caseFor: string[] = []
  if (verdictBullets.find(b => b.includes("favourable bracket"))) {
    caseFor.push(`Favourable fixture run ahead - ${favCount} winnable games in the next five`)
  }
  if (parseFloat(player.form) >= 4.0) {
    caseFor.push(`Strong recent form: ${player.form} points per game over the last six gameweeks`)
  }
  if (player.ownership < 10) {
    caseFor.push(`Low ownership of ${player.ownership}% - a good return creates a significant rank advantage`)
  } else if (player.ownership < 25) {
    caseFor.push(`At ${player.ownership}% ownership, backing the right fixture call here moves rank against a meaningful portion of the field`)
  }
  if (!blankGW && player.ep_next >= 5) {
    caseFor.push(`Projected ${player.ep_next.toFixed(1)} expected points in Gameweek ${gw} - the model backs a return`)
  }
  if (caseFor.length === 0) caseFor.push(`The fixture schedule provides at least a workable route to points over the next five gameweeks`)

  // Case against
  const caseAgainst: string[] = []
  if (hardCount >= 2) {
    caseAgainst.push(`${hardCount} tough fixtures in the next five games test the case for holding`)
  }
  if (parseFloat(player.form) < 3.0 && !blankGW) {
    caseAgainst.push(`Form of ${player.form} per game in recent weeks suggests inconsistent involvement`)
  }
  if (blankGW) {
    caseAgainst.push(`Blank Gameweek ${gw} - zero points this week regardless of form or price`)
  }
  if (isDoubt) {
    caseAgainst.push(`Fitness question mark at ${player.chance}% - monitor ahead of the deadline before committing`)
  }
  if (caseAgainst.length === 0) caseAgainst.push(`No significant red flags in the data - the main risk is the unpredictability inherent in any forward-looking fixture assessment`)

  // QA items for ConversationalPlayer
  const run3 = player.fixtures.slice(0, 3)
  const run3Text = run3.map((f) => `${f.opponentShort} (${f.isHome ? "H" : "A"}, ${FDR_LABELS[f.fdr] ?? "Medium"})`).join(", ")

  const qaItems: PlayerQA[] = [
    {
      id: "fixture-run",
      question: `What does ${name}'s fixture run look like for the next five gameweeks?`,
      answer: `${name}'s upcoming schedule over the next five games is rated ${verdict.toLowerCase()} overall. ` +
        `The immediate test is ${fixture1} in Gameweek ${gw}. ` +
        `${favCount >= 3
          ? `There are ${favCount} favourable matchups in the run, which gives consistent point-scoring opportunities across several weeks rather than a single-game gamble.`
          : hardCount >= 2
          ? `There are ${hardCount} difficult fixtures in the next five games, meaning the schedule requires selectivity around captaincy and chip usage.`
          : `The schedule is a mix of manageable and testing fixtures - quality players tend to deliver regardless, but form will separate the reliable options from the rest.`
        }`,
    },
    {
      id: "worth-holding",
      question: `Is ${name} worth holding through their upcoming fixtures?`,
      answer: `${isInjured
        ? `${name} is currently unavailable, which makes holding difficult regardless of fixtures. The fixture run is there to return to when fit, but health has to come first.`
        : blankGW
        ? `${name} has a Blank Gameweek ${gw} - no points are available this week. Whether to hold depends on the fixture run after the blank, which ${verdict === "Favourable" ? "looks encouraging" : "is worth monitoring"}.`
        : verdict === "Favourable"
        ? `The case for holding ${name} is backed by the fixture schedule. With ${favCount} favourable matchups ahead and current form of ${player.form} per game, this is a period to back them rather than consider selling.`
        : verdict === "Mixed"
        ? `Holding ${name} through this stretch is a judgement call. The fixtures are not straightforwardly easy or hard - form of ${player.form} per game and consistent involvement are the indicators to prioritise.`
        : `The ${hardCount} difficult fixtures in the next five games are the main consideration. Holding ${name} through a tough run requires confidence in underlying form, which currently sits at ${player.form} per game.`
      }`,
    },
    {
      id: "best-gw",
      question: `When is ${name}'s best gameweek in the upcoming fixture run?`,
      answer: (() => {
        const bestFix = [...player.fixtures].sort((a, b) => a.fdr - b.fdr)[0]
        if (!bestFix) return `${name}'s fixture data is not yet available for the coming weeks.`
        return `The easiest fixture in ${name}'s upcoming schedule is Gameweek ${bestFix.gw} against ${bestFix.opponentName} ` +
          `(${bestFix.isHome ? "Home" : "Away"}), rated ${FDR_LABELS[bestFix.fdr] ?? "Medium"} for difficulty. ` +
          `${bestFix.gw === gw
            ? `That is the immediate Gameweek ${gw} fixture - the timing is good for captaincy consideration.`
            : `That game is in Gameweek ${bestFix.gw}, so planning ahead is worthwhile if you are considering bringing them in now.`
          }`
      })(),
    },
    {
      id: "transfer-in",
      question: `Should I transfer ${name} in ahead of Gameweek ${gw}?`,
      answer: `${blankGW
        ? `${name} has a Blank Gameweek ${gw} - transferring in for this week would mean paying a transfer for zero points. The fixture run after the blank ${verdict === "Favourable" ? "does look good, so planning ahead is reasonable" : "is the factor to weigh before committing"}.`
        : isInjured
        ? `${name} is currently unavailable at 0% chance of playing - transferring in now carries real risk. Wait for a fitness update before committing.`
        : verdict === "Favourable"
        ? `The upcoming fixture schedule makes ${name} a credible transfer target right now. The three-game run of ${run3Text} offers consistent scoring opportunities. At ${player.ownership}% ownership, getting it right across this period returns meaningful rank.`
        : `The fixture schedule for ${name} is ${verdict.toLowerCase()}, which does not strongly pull the transfer decision either way. Form of ${player.form} per game is the cleaner signal to act on - if the underlying numbers are there, the fixtures are manageable.`
      }`,
    },
  ]

  // Welcome message for ConversationalPlayer
  const welcome = blankGW
    ? `${name} has a Blank Gameweek ${gw} - no fixture scheduled this week. Their full fixture run for the coming weeks is shown above. Click a question for the detailed breakdown.`
    : `${name}'s upcoming fixture schedule is rated ${verdict.toLowerCase()} over the next five games. ` +
      `The immediate test is ${fixture1}. Click a question below for the full breakdown.`

  const ctaLeadin = `Want to know if ${name} fits your specific squad and rank target?`

  return { verdictLabel: verdict, verdictText, verdictBullets, caseFor, caseAgainst, qaItems, welcome, ctaLeadin }
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

export async function getFixtureSlugs(): Promise<{ slug: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    const eligible = (bootstrap.elements ?? []).filter(isFixtureEligible)
    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])
    return Array.from(slugMap.keys()).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

async function buildFixturePlayer(
  el: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>,
  slugMap: Map<string, number>,
  allFixtures: any[],
  currentGW: number
): Promise<FixtureHubPlayer> {
  const team = teamMap[el.team]

  // Derive slug
  const base = toSlug(el.web_name)
  const slug = slugMap.get(base) === el.id
    ? base
    : toSlug(el.web_name, team?.short)

  // Build next 5 gameweek fixture list
  const upcomingGWs = Array.from({ length: 5 }, (_, i) => currentGW + i)
  const fixtures: FixtureGW[] = []

  for (const gw of upcomingGWs) {
    const gwFixtures = allFixtures.filter(
      (f: any) => f.event === gw && (f.team_h === el.team || f.team_a === el.team)
    )
    if (gwFixtures.length === 0) continue // blank GW - skip this entry
    const f = gwFixtures[0] // DGW: take first fixture for hub display
    const isHome = f.team_h === el.team
    const oppId = isHome ? f.team_a : f.team_h
    const opp = teamMap[oppId]
    fixtures.push({
      gw,
      opponentShort: opp?.short ?? "TBD",
      opponentName: opp?.name ?? "TBD",
      opponentCode: opp?.code ?? 0,
      isHome,
      fdr: isHome ? (f.team_h_difficulty ?? 3) : (f.team_a_difficulty ?? 3),
    })
  }

  const avgFdr = fixtures.length > 0
    ? fixtures.reduce((s, f) => s + f.fdr, 0) / fixtures.length
    : 3

  return {
    slug,
    code:        el.code,
    displayName: getDisplayName(el),
    webName:     el.web_name,
    club:        team?.name ?? "",
    clubShort:   team?.short ?? "",
    teamCode:    team?.code ?? 0,
    position:    posMap[el.element_type] ?? "",
    price:       `£${(el.now_cost / 10).toFixed(1)}m`,
    form:        el.form ?? "0.0",
    ep_next:     parseFloat(el.ep_next ?? "0"),
    totalPts:    el.total_points ?? 0,
    ownership:   parseFloat(el.selected_by_percent ?? "0"),
    transfersIn: el.transfers_in_event ?? 0,
    news:        el.news ?? "",
    chance:      el.chance_of_playing_next_round ?? 100,
    status:      el.status ?? "a",
    fixtures,
    avgFdr,
    verdictLabel: verdictFromAvg(avgFdr),
  }
}

export async function getFixtureHub(): Promise<{
  gw: number
  players: FixtureHubPlayer[]
} | null> {
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

    const events = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)

    // Fetch all upcoming fixtures in one call
    const fixturesRes = await fetch(
      "https://fantasy.premierleague.com/api/fixtures/?future=1",
      { headers: FPL_HEADERS, next: { revalidate: 3600 } }
    )
    const allFixtures: any[] = fixturesRes.ok ? await fixturesRes.json() : []

    const eligible = (bootstrap.elements ?? []).filter(isFixtureEligible)
    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])

    const players = await Promise.all(
      eligible.map((el: any) =>
        buildFixturePlayer(el, teamMap, posMap, slugMap, allFixtures, currentGW)
      )
    )

    // Sort: blank GW players always go to the bottom.
    // Among non-blank players: best avgFdr first, then ep_next descending.
    const sorted = players.sort((a, b) => {
      const aBlank = a.ep_next === 0
      const bBlank = b.ep_next === 0
      if (aBlank && !bBlank) return 1
      if (!aBlank && bBlank) return -1
      const fdrDiff = a.avgFdr - b.avgFdr
      if (Math.abs(fdrDiff) > 0.3) return fdrDiff
      return b.ep_next - a.ep_next
    })

    return { gw: currentGW, players: sorted.slice(0, 30) }
  } catch {
    return null
  }
}

export async function getFixturePageData(slug: string): Promise<FixturePageData | null> {
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

    const events = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)

    // Resolve slug
    const eligible = (bootstrap.elements ?? []).filter(isFixtureEligible)
    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const elementId = slugMap.get(slug)
    if (!elementId) return null

    const el = (bootstrap.elements ?? []).find((p: any) => p.id === elementId)
    if (!el) return null

    const fixturesRes = await fetch(
      "https://fantasy.premierleague.com/api/fixtures/?future=1",
      { headers: FPL_HEADERS, next: { revalidate: 3600 } }
    )
    const allFixtures: any[] = fixturesRes.ok ? await fixturesRes.json() : []

    const player = await buildFixturePlayer(el, teamMap, posMap, slugMap, allFixtures, currentGW)

    return { gw: currentGW, player }
  } catch {
    return null
  }
}
