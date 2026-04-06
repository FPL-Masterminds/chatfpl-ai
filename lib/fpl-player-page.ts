import type { FplCardPlayer } from "@/components/fpl-player-hero"
import type { PlayerQA } from "@/components/conversational-player"

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
function getDisplayName(p: any): string {
  if (p.web_name.includes(" ")) return p.web_name
  const full = `${p.first_name} ${p.web_name}`
  return full.length <= 22 ? full : p.web_name
}

// ─── FPL API data fetch ───────────────────────────────────────────────────────

const FPL_HEADERS = { "User-Agent": "ChatFPL/1.0" }

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
    const bootstrapRes = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { headers: FPL_HEADERS, next: { revalidate: 3600 } }
    )
    if (!bootstrapRes.ok) return null
    const bootstrap = await bootstrapRes.json()

    // Build maps
    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Resolve slug → player
    const slugLookup = buildSlugLookup(bootstrap.elements ?? [], bootstrap.teams ?? [])
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
    p.chance < 50 ? `Significant fitness concern: ${p.news}. Captaining ${p.webName} carries real risk this week.`
    : p.chance < 75 ? `Minor doubt over ${p.webName}'s availability. ${p.news}. Worth monitoring before the deadline.`
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
    caseAgainst.push(`Availability: ${p.news} - real risk he does not start or plays reduced minutes.`)

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
