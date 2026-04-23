import {
  getBootstrap,
  buildSlugLookup,
  getDisplayName,
  FPL_HEADERS,
} from "@/lib/fpl-player-page"
import type { FplCardPlayer } from "@/components/fpl-player-hero"
import type { PlayerQA } from "@/components/conversational-player"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DGWFixture {
  gw: number
  opponentName: string
  opponentShort: string
  opponentCode: number
  isHome: boolean
  fdr: number
}

export interface DGWPlayer {
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
  dgwGW: number
  dgwFixtures: DGWFixture[]
  projectedPts: number
}

export interface DGWTeamSummary {
  teamId: number
  teamName: string
  teamShort: string
  teamCode: number
  fixtures: {
    opponentName: string
    opponentShort: string
    opponentCode: number
    isHome: boolean
    fdr: number
  }[]
}

export interface BGWTeamSummary {
  teamId: number
  teamName: string
  teamShort: string
  teamCode: number
}

export interface GameweekSummary {
  gw: number
  dgwTeams: DGWTeamSummary[]
  bgwTeams: BGWTeamSummary[]
  isDGW: boolean
  isBGW: boolean
  hasActivity: boolean
}

export interface GameweekHub {
  currentGW: number
  nextDGW: number | null
  gameweeks: GameweekSummary[]
  topDGWPlayers: DGWPlayer[]
}

export interface GameweekDetailData {
  gw: number
  dgwTeams: DGWTeamSummary[]
  bgwTeams: BGWTeamSummary[]
  players: DGWPlayer[]
  showcasePlayers: FplCardPlayer[]
}

export interface DGWPlayerPageData {
  gw: number
  player: DGWPlayer
  showcasePlayers: FplCardPlayer[]
  relatedPlayers: { name: string; slug: string }[]
  qaItems: PlayerQA[]
  welcome: string
  ctaLeadin: string
  verdictLabel: string
  verdictText: string
  verdictBullets: string[]
  caseFor: string[]
  caseAgainst: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getFutureFixtures(): Promise<any[]> {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/fixtures/?future=1",
    { headers: FPL_HEADERS, next: { revalidate: 3600 } }
  )
  return res.ok ? await res.json() : []
}

function isDGWEligible(p: any): boolean {
  const mins = p.minutes ?? 0
  const sel  = parseFloat(p.selected_by_percent ?? "0")
  const form = parseFloat(p.form ?? "0")
  const tiGW = p.transfers_in_event ?? 0
  return (mins >= 1000 && sel >= 1.0) || mins >= 2000 || tiGW >= 10000 || (form >= 4.0 && mins >= 500)
}

function detectGWActivity(
  allFixtures: any[],
  allTeams: any[],
  startGW: number,
  endGW: number
): GameweekSummary[] {
  const teamMap: Record<number, { name: string; short: string; code: number }> = {}
  allTeams.forEach((t: any) => {
    teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
  })

  const summaries: GameweekSummary[] = []

  for (let gw = startGW; gw <= endGW; gw++) {
    const gwFixtures = allFixtures.filter((f: any) => f.event === gw)

    const teamFixtures: Record<number, { isHome: boolean; oppId: number; fdr: number }[]> = {}
    gwFixtures.forEach((f: any) => {
      if (!teamFixtures[f.team_h]) teamFixtures[f.team_h] = []
      if (!teamFixtures[f.team_a]) teamFixtures[f.team_a] = []
      teamFixtures[f.team_h].push({ isHome: true,  oppId: f.team_a, fdr: f.team_h_difficulty })
      teamFixtures[f.team_a].push({ isHome: false, oppId: f.team_h, fdr: f.team_a_difficulty })
    })

    const dgwTeams: DGWTeamSummary[] = Object.entries(teamFixtures)
      .filter(([, fixList]) => fixList.length >= 2)
      .map(([teamId, fixList]) => {
        const id   = Number(teamId)
        const team = teamMap[id]
        return {
          teamId: id,
          teamName: team?.name ?? "",
          teamShort: team?.short ?? "",
          teamCode: team?.code ?? 0,
          fixtures: fixList.map((f) => ({
            opponentName:  teamMap[f.oppId]?.name  ?? "",
            opponentShort: teamMap[f.oppId]?.short ?? "",
            opponentCode:  teamMap[f.oppId]?.code  ?? 0,
            isHome: f.isHome,
            fdr:    f.fdr,
          })),
        }
      })

    const activeTeamIds = new Set(Object.keys(teamFixtures).map(Number))
    const bgwTeams: BGWTeamSummary[] = allTeams
      .filter((t: any) => !activeTeamIds.has(t.id))
      .map((t: any) => ({
        teamId:    t.id,
        teamName:  t.name,
        teamShort: t.short_name,
        teamCode:  t.code,
      }))

    summaries.push({
      gw,
      dgwTeams,
      bgwTeams,
      isDGW: dgwTeams.length > 0,
      isBGW: bgwTeams.length > 0,
      hasActivity: dgwTeams.length > 0 || bgwTeams.length > 0,
    })
  }

  return summaries
}

function buildDGWPlayer(
  el: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap:  Record<number, string>,
  slugMap: Map<number, string>,
  dgwGW:   number,
  dgwFixtures: DGWFixture[]
): DGWPlayer {
  const team = teamMap[el.team]
  const ep   = parseFloat(el.ep_next ?? "0")
  return {
    slug:        slugMap.get(el.id) ?? "",
    code:        el.code,
    displayName: getDisplayName(el),
    webName:     el.web_name,
    club:        team?.name  ?? "",
    clubShort:   team?.short ?? "",
    teamCode:    team?.code  ?? 0,
    position:    posMap[el.element_type] ?? "",
    price:       `£${(el.now_cost / 10).toFixed(1)}m`,
    form:        el.form ?? "0.0",
    ep_next:     ep,
    totalPts:    el.total_points ?? 0,
    ownership:   parseFloat(el.selected_by_percent ?? "0"),
    transfersIn: el.transfers_in_event ?? 0,
    news:        el.news ?? "",
    chance:      el.chance_of_playing_next_round ?? 100,
    status:      el.status ?? "a",
    dgwGW,
    dgwFixtures,
    projectedPts: Math.round(ep * 2 * 10) / 10,
  }
}

function playerToCard(
  el: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap:  Record<number, string>
): FplCardPlayer {
  const team = teamMap[el.team]
  return {
    code:     el.code,
    name:     el.web_name,
    club:     team?.name ?? "",
    teamCode: team?.code ?? 0,
    position: posMap[el.element_type] ?? "",
    price:    `£${(el.now_cost / 10).toFixed(1)}m`,
    form:     el.form ?? "0.0",
    totalPts: el.total_points ?? 0,
  }
}

function dgwPlayerToCard(p: DGWPlayer): FplCardPlayer {
  return {
    code: p.code, name: p.webName, club: p.club,
    teamCode: p.teamCode, position: p.position,
    price: p.price, form: p.form, totalPts: p.totalPts,
  }
}

// ─── Text generation ──────────────────────────────────────────────────────────

export function buildDGWHubText(player: DGWPlayer): string {
  const name     = player.displayName
  const fix1     = player.dgwFixtures[0]
  const fix2     = player.dgwFixtures[1]
  const f1Label  = fix1 ? `${fix1.opponentName} (${fix1.isHome ? "H" : "A"})` : "first fixture"
  const f2Label  = fix2 ? `${fix2.opponentName} (${fix2.isHome ? "H" : "A"})` : "second fixture"
  const proj     = player.projectedPts.toFixed(1)

  return `${name} faces ${f1Label} and ${f2Label} in Gameweek ${player.dgwGW}. ` +
    `Single-game expected points of ${player.ep_next.toFixed(1)} project to a combined ${proj} across the double. ` +
    `Form of ${player.form} over the last six gameweeks backs the projection. ` +
    `At ${player.ownership}% ownership, getting ${name} right this week directly impacts rank.`
}

export function buildDGWPlayerPageText(player: DGWPlayer, gw: number): {
  verdictLabel: string
  verdictText: string
  verdictBullets: string[]
  caseFor: string[]
  caseAgainst: string[]
  qaItems: PlayerQA[]
  welcome: string
  ctaLeadin: string
} {
  const name       = player.displayName
  const short      = player.webName
  const fix1       = player.dgwFixtures[0]
  const fix2       = player.dgwFixtures[1]
  const f1Label    = fix1 ? `${fix1.opponentName} (${fix1.isHome ? "H" : "A"})` : "first fixture"
  const f2Label    = fix2 ? `${fix2.opponentName} (${fix2.isHome ? "H" : "A"})` : "second fixture"
  const proj       = player.projectedPts.toFixed(1)
  const ep         = player.ep_next.toFixed(1)
  const isAvail    = player.chance >= 75 && player.status === "a"

  const verdictLabel  = isAvail ? "Double Gameweek" : "Fitness Concern"
  const verdictText   = isAvail
    ? `${name} has two fixtures in Gameweek ${gw}, giving every manager in their squad two chances at points.`
    : `${name} is carrying a fitness concern heading into Gameweek ${gw}. Monitor availability before the deadline.`

  const verdictBullets = [
    `Two fixtures in Gameweek ${gw}: ${f1Label} and ${f2Label}`,
    `Single-game expected points: ${ep}. Projected across both games: ${proj}`,
    `Form: ${player.form} points per game over the last six gameweeks`,
    `Owned by ${player.ownership}% of FPL managers`,
  ]
  if (!isAvail && player.news) verdictBullets.push(player.news)

  const caseFor = [
    `Two fixtures in Gameweek ${gw}: ${f1Label} and ${f2Label}`,
    `Projected ${proj} combined expected points across both games`,
    `Recent form of ${player.form} points per game shows consistent involvement`,
    `At ${player.ownership}% ownership, a points haul here has significant rank impact`,
  ]

  const caseAgainst: string[] = []
  if (!isAvail) caseAgainst.push(player.news || `Fitness concern: ${player.chance}% chance of playing - check before deadline`)
  if (fix1 && fix1.fdr >= 4) caseAgainst.push(`First fixture against ${fix1.opponentName} is rated hard`)
  if (fix2 && fix2.fdr >= 4) caseAgainst.push(`Second fixture against ${fix2.opponentName} is rated hard`)
  if (player.ownership > 30) caseAgainst.push(`High ownership of ${player.ownership}% means a blank return hurts rank significantly`)
  if (caseAgainst.length === 0) caseAgainst.push(`Double gameweeks carry rotation risk. Managers may be rested for one of the two games`)

  const welcome = `${name} has a Double Gameweek ${gw} with fixtures against ${f1Label} and ${f2Label}. Ask me anything about whether to start, captain, or transfer in ${short} this gameweek.`

  const ctaLeadin = `Want to know how ${short}'s Double Gameweek fits your squad and rank target?`

  const qaItems: PlayerQA[] = [
    {
      question: `What are ${name}'s fixtures in Double Gameweek ${gw}?`,
      answer:   `${name} plays ${f1Label} and ${f2Label} in Gameweek ${gw}. The model projects ${ep} expected points per game, giving a combined projection of ${proj} across both fixtures. Form over the last six gameweeks is ${player.form} points per game.`,
    },
    {
      question: `Should I captain ${name} in Double Gameweek ${gw}?`,
      answer:   isAvail
        ? `The double gameweek makes ${name} a strong captaincy consideration. With projected ${proj} combined expected points and form of ${player.form}, two-game exposure means a blank in one fixture does not necessarily ruin the armband. At ${player.ownership}% ownership, getting the captaincy right here protects rank against the majority of the field.`
        : `${name} has a fitness concern ahead of Gameweek ${gw}. ${player.news || `Their chance of playing is ${player.chance}%.`} Monitor availability before committing the armband. If fit, the double gameweek makes them a top captaincy option.`,
    },
    {
      question: `Is it worth transferring in ${name} for the Double Gameweek?`,
      answer:   `Transferring in for a double gameweek costs a free transfer. The case is strongest when a player has good form, manageable opponents, and high expected points. ${name} projects ${proj} combined expected points across ${f1Label} and ${f2Label}. Weigh the transfer cost against the premium and your existing team coverage.`,
    },
    {
      question: `Which teams have a blank gameweek alongside ${name}'s double?`,
      answer:   `While ${player.club} has two fixtures in Gameweek ${gw}, other Premier League clubs may have a blank. Their players score zero that week. Check the full gameweek landscape and consider benching or transferring out any blank gameweek assets to maximise your active player count.`,
    },
  ]

  return { verdictLabel, verdictText, verdictBullets, caseFor, caseAgainst, qaItems, welcome, ctaLeadin }
}

// ─── Hub ──────────────────────────────────────────────────────────────────────

export async function getGameweekHub(): Promise<GameweekHub | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    const allFixtures = await getFutureFixtures()

    const events     = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)
    const maxGW = Math.max(...events.map((e: any) => e.id as number))

    const gameweeks = detectGWActivity(
      allFixtures, bootstrap.teams ?? [],
      currentGW, Math.min(maxGW, currentGW + 7)
    )

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap:  Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => { teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code } })
    ;(bootstrap.element_types ?? []).forEach((et: any) => { posMap[et.id] = et.singular_name_short })

    const eligible = (bootstrap.elements ?? []).filter(isDGWEligible)
    const slugMap  = buildSlugLookup(eligible, bootstrap.teams ?? [])

    const nextDGW = gameweeks.find((g) => g.isDGW)?.gw ?? null

    // Build top DGW players across all upcoming DGWs
    const topDGWPlayers: DGWPlayer[] = []
    for (const gwSummary of gameweeks.filter((g) => g.isDGW)) {
      const dgwTeamIds  = new Set(gwSummary.dgwTeams.map((t) => t.teamId))
      const gwFixtures  = allFixtures.filter((f: any) => f.event === gwSummary.gw)

      const gwEligible  = eligible.filter((p: any) => dgwTeamIds.has(p.team))
      for (const el of gwEligible) {
        const teamFixtures = gwFixtures.filter((f: any) => f.team_h === el.team || f.team_a === el.team)
        const dgwFix: DGWFixture[] = teamFixtures.map((f: any) => {
          const isHome = f.team_h === el.team
          const oppId  = isHome ? f.team_a : f.team_h
          return {
            gw:            gwSummary.gw,
            opponentName:  teamMap[oppId]?.name  ?? "",
            opponentShort: teamMap[oppId]?.short ?? "",
            opponentCode:  teamMap[oppId]?.code  ?? 0,
            isHome,
            fdr: isHome ? f.team_h_difficulty : f.team_a_difficulty,
          }
        })
        if (dgwFix.length >= 2) {
          topDGWPlayers.push(buildDGWPlayer(el, teamMap, posMap, slugMap, gwSummary.gw, dgwFix))
        }
      }
    }
    topDGWPlayers.sort((a, b) => b.ep_next - a.ep_next)

    return { currentGW, nextDGW, gameweeks, topDGWPlayers: topDGWPlayers.slice(0, 25) }
  } catch {
    return null
  }
}

// ─── GW detail page ───────────────────────────────────────────────────────────

export async function getGameweekDetail(gw: number): Promise<GameweekDetailData | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    const allFixtures = await getFutureFixtures()

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap:  Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => { teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code } })
    ;(bootstrap.element_types ?? []).forEach((et: any) => { posMap[et.id] = et.singular_name_short })

    const events = bootstrap.events ?? []
    const maxGW  = Math.max(...events.map((e: any) => e.id as number))
    if (gw > maxGW) return null

    const [gwSummary] = detectGWActivity(allFixtures, bootstrap.teams ?? [], gw, gw)
    if (!gwSummary) return null

    const eligible = (bootstrap.elements ?? []).filter(isDGWEligible)
    const slugMap  = buildSlugLookup(eligible, bootstrap.teams ?? [])

    const dgwTeamIds = new Set(gwSummary.dgwTeams.map((t) => t.teamId))
    const gwFixtures = allFixtures.filter((f: any) => f.event === gw)

    const players: DGWPlayer[] = eligible
      .filter((p: any) => dgwTeamIds.has(p.team))
      .map((el: any) => {
        const teamFix = gwFixtures.filter((f: any) => f.team_h === el.team || f.team_a === el.team)
        const dgwFix: DGWFixture[] = teamFix.map((f: any) => {
          const isHome = f.team_h === el.team
          const oppId  = isHome ? f.team_a : f.team_h
          return {
            gw,
            opponentName:  teamMap[oppId]?.name  ?? "",
            opponentShort: teamMap[oppId]?.short ?? "",
            opponentCode:  teamMap[oppId]?.code  ?? 0,
            isHome,
            fdr: isHome ? f.team_h_difficulty : f.team_a_difficulty,
          }
        })
        return buildDGWPlayer(el, teamMap, posMap, slugMap, gw, dgwFix)
      })
      .filter((p) => p.dgwFixtures.length >= 2)
      .sort((a, b) => b.ep_next - a.ep_next)

    const center = players[0]
    const flanks = players.slice(1, 5)
    const centerCard = center ? dgwPlayerToCard(center) : null
    const showcasePlayers: FplCardPlayer[] = centerCard ? [
      flanks[0] ? dgwPlayerToCard(flanks[0]) : centerCard,
      flanks[1] ? dgwPlayerToCard(flanks[1]) : centerCard,
      centerCard,
      flanks[2] ? dgwPlayerToCard(flanks[2]) : centerCard,
      flanks[3] ? dgwPlayerToCard(flanks[3]) : centerCard,
    ] : []

    return { gw, dgwTeams: gwSummary.dgwTeams, bgwTeams: gwSummary.bgwTeams, players, showcasePlayers }
  } catch {
    return null
  }
}

// ─── Individual player DGW page ───────────────────────────────────────────────

export async function getDGWPlayerData(slug: string): Promise<DGWPlayerPageData | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    const allFixtures = await getFutureFixtures()

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap:  Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => { teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code } })
    ;(bootstrap.element_types ?? []).forEach((et: any) => { posMap[et.id] = et.singular_name_short })

    const events    = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)
    const maxGW = Math.max(...events.map((e: any) => e.id as number))

    const eligible = (bootstrap.elements ?? []).filter(isDGWEligible)
    const slugMap  = buildSlugLookup(eligible, bootstrap.teams ?? [])

    const elementId = slugMap.get(slug)
    if (!elementId) return null
    const el = (bootstrap.elements ?? []).find((p: any) => p.id === elementId)
    if (!el) return null

    // Find this player's next double gameweek
    let dgwGW: number | null = null
    let dgwFixtures: DGWFixture[] = []

    for (let gw = currentGW; gw <= Math.min(maxGW, currentGW + 8); gw++) {
      const gwFix = allFixtures.filter((f: any) => f.event === gw && (f.team_h === el.team || f.team_a === el.team))
      if (gwFix.length >= 2) {
        dgwGW = gw
        dgwFixtures = gwFix.map((f: any) => {
          const isHome = f.team_h === el.team
          const oppId  = isHome ? f.team_a : f.team_h
          return {
            gw,
            opponentName:  teamMap[oppId]?.name  ?? "",
            opponentShort: teamMap[oppId]?.short ?? "",
            opponentCode:  teamMap[oppId]?.code  ?? 0,
            isHome,
            fdr: isHome ? f.team_h_difficulty : f.team_a_difficulty,
          }
        })
        break
      }
    }

    if (!dgwGW || dgwFixtures.length < 2) return null

    const player = buildDGWPlayer(el, teamMap, posMap, slugMap, dgwGW, dgwFixtures)

    // Hero showcase: player at centre, top ep_next eligible as flanks
    const flankPool = (bootstrap.elements ?? [])
      .filter((p: any) => p.id !== el.id && parseFloat(p.ep_next ?? "0") > 0 && (p.chance_of_playing_next_round ?? 100) >= 75)
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))
      .slice(0, 4)

    const centerCard = dgwPlayerToCard(player)
    const showcasePlayers: FplCardPlayer[] = [
      flankPool[0] ? playerToCard(flankPool[0], teamMap, posMap) : centerCard,
      flankPool[1] ? playerToCard(flankPool[1], teamMap, posMap) : centerCard,
      centerCard,
      flankPool[2] ? playerToCard(flankPool[2], teamMap, posMap) : centerCard,
      flankPool[3] ? playerToCard(flankPool[3], teamMap, posMap) : centerCard,
    ]

    // Related: same position, on same or other DGW teams this GW
    const dgwTeamIds = new Set<number>()
    allFixtures.filter((f: any) => f.event === dgwGW).forEach((f: any) => {
      const hFix = allFixtures.filter((gf: any) => gf.event === dgwGW && (gf.team_h === f.team_h || gf.team_a === f.team_h))
      if (hFix.length >= 2) dgwTeamIds.add(f.team_h)
      const aFix = allFixtures.filter((gf: any) => gf.event === dgwGW && (gf.team_h === f.team_a || gf.team_a === f.team_a))
      if (aFix.length >= 2) dgwTeamIds.add(f.team_a)
    })

    const relatedPlayers = eligible
      .filter((p: any) => p.id !== el.id && p.element_type === el.element_type && dgwTeamIds.has(p.team))
      .slice(0, 6)
      .map((p: any) => ({ name: getDisplayName(p), slug: slugMap.get(p.id) ?? "" }))
      .filter((r) => r.slug)

    const textData = buildDGWPlayerPageText(player, dgwGW)

    return {
      gw: dgwGW,
      player,
      showcasePlayers,
      relatedPlayers,
      ...textData,
    }
  } catch {
    return null
  }
}

// ─── Slug generators for static params + sitemap ──────────────────────────────

export async function getGameweekSlugs(): Promise<{ gw: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return []

    const allFixtures = await getFutureFixtures()
    const events      = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)
    const maxGW = Math.max(...events.map((e: any) => e.id as number))

    const gameweeks = detectGWActivity(
      allFixtures, bootstrap.teams ?? [],
      currentGW, Math.min(maxGW, currentGW + 8)
    )

    return gameweeks.filter((g) => g.hasActivity).map((g) => ({ gw: `gw${g.gw}` }))
  } catch {
    return []
  }
}

export async function getDGWPlayerSlugs(): Promise<{ slug: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return []

    const allFixtures = await getFutureFixtures()
    const events      = bootstrap.events ?? []
    const currentGW: number =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)
    const maxGW = Math.max(...events.map((e: any) => e.id as number))

    // Collect all teams with a DGW in the next 8 GWs
    const dgwTeamIds = new Set<number>()
    for (let gw = currentGW; gw <= Math.min(maxGW, currentGW + 8); gw++) {
      const gwFix = allFixtures.filter((f: any) => f.event === gw)
      const count: Record<number, number> = {}
      gwFix.forEach((f: any) => {
        count[f.team_h] = (count[f.team_h] ?? 0) + 1
        count[f.team_a] = (count[f.team_a] ?? 0) + 1
      })
      Object.entries(count).forEach(([id, n]) => { if (n >= 2) dgwTeamIds.add(Number(id)) })
    }

    if (dgwTeamIds.size === 0) return []

    const eligible = (bootstrap.elements ?? []).filter(
      (p: any) => isDGWEligible(p) && dgwTeamIds.has(p.team)
    )
    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])

    return eligible
      .map((p: any) => ({ slug: slugMap.get(p.id) ?? "" }))
      .filter((s) => s.slug)
  } catch {
    return []
  }
}
