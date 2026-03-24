import { NextResponse } from "next/server"
import { fplPhotoUrlFromElement } from "@/lib/fpl-player-photo"

const FPL_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

// Cache for 30 minutes
let cache: { data: ShowcasePlayers; ts: number } | null = null
const CACHE_MS = 30 * 60 * 1000

export type ShowcasePlayer = {
  name: string
  club: string
  position: string
  price: string
  totalPts: number
  form: string
  photoUrl: string  // full CDN URL built by the shared helper, always correct season
}

export type EdgePlayer = {
  name: string
  team: string      // short_name e.g. "MCI"
  teamCode: number  // team code for badge URL
  value: string     // e.g. "55.0%" or "36 bonus"
}

export type InjuryItem = {
  name: string
  team: string
  teamCode: number
  news: string
  isNew: boolean
}

export type TickerFact = {
  photoUrl: string | null
  text: string
}

export type ShowcasePlayers = {
  topPts: ShowcasePlayer[]
  topForm: ShowcasePlayer[]
  risers: ShowcasePlayer[]
  differentials: ShowcasePlayer[]
  mostSelected: EdgePlayer[]
  mostBonus: EdgePlayer[]
  injuryNews: InjuryItem[]
  tickerFacts: TickerFact[]
  nextDeadline: string | null
  nextGwName: string
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  const res = await fetch(FPL_URL, { next: { revalidate: 1800 } })
  const json = await res.json()

  const teams: Record<number, string> = {}
  const teamFullNames: Record<number, string> = {}
  const teamCodes: Record<number, number> = {}
  for (const t of json.teams) {
    teams[t.id] = t.short_name
    teamFullNames[t.id] = t.name
    teamCodes[t.id] = t.code
  }

  const fmtTransfers = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}m` :
    n >= 1_000     ? `${Math.round(n / 1_000)}k` : `${n}`

  const posMap: Record<number, string> = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" }

  const active = json.elements.filter((p: any) => p.status !== "u" && p.minutes > 0)

  const toPlayer = (p: any): ShowcasePlayer => ({
    name: p.web_name,
    club: teams[p.team] ?? "???",
    position: posMap[p.element_type] ?? "MID",
    price: `£${(p.now_cost / 10).toFixed(1)}m`,
    totalPts: p.total_points,
    form: parseFloat(p.form).toFixed(1),
    photoUrl: fplPhotoUrlFromElement(p.photo, p.code),  // uses premierleague25 base
  })

  const topPts = [...active]
    .sort((a: any, b: any) => b.total_points - a.total_points)
    .slice(0, 3)
    .map(toPlayer)

  const topForm = [...active]
    .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 3)
    .map(toPlayer)

  const risers = [...active]
    .filter((p: any) => p.cost_change_event > 0)
    .sort((a: any, b: any) => b.cost_change_event - a.cost_change_event)
    .slice(0, 3)
    .map(toPlayer)

  const differentials = [...active]
    .filter((p: any) => p.selected_by_percent < 10 && parseFloat(p.form) >= 5)
    .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 3)
    .map(toPlayer)

  const toEdge = (p: any, value: string): EdgePlayer => ({
    name: p.web_name,
    team: teams[p.team] ?? "???",
    teamCode: teamCodes[p.team] ?? 0,
    value,
  })

  const mostSelected = [...active]
    .sort((a: any, b: any) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
    .slice(0, 3)
    .map((p: any) => toEdge(p, `${parseFloat(p.selected_by_percent).toFixed(1)}%`))

  const mostBonus = [...active]
    .sort((a: any, b: any) => b.bonus - a.bonus)
    .slice(0, 3)
    .map((p: any) => toEdge(p, `${p.bonus} bonus`))

  const injuryNews: InjuryItem[] = json.elements
    .filter((p: any) => p.news && p.news.trim().length > 0)
    .sort((a: any, b: any) => new Date(b.news_added).getTime() - new Date(a.news_added).getTime())
    .slice(0, 3)
    .map((p: any): InjuryItem => ({
      name: p.web_name,
      team: teams[p.team] ?? "???",
      teamCode: teamCodes[p.team] ?? 0,
      news: p.news,
      isNew: (Date.now() - new Date(p.news_added).getTime()) < 48 * 3600 * 1000,
    }))

  const toFact = (p: any, text: string): TickerFact => ({
    photoUrl: fplPhotoUrlFromElement(p.photo, p.code),
    text,
  })

  const allPlayers: any[] = json.elements
  const posLabel: Record<number, string> = { 1: "goalkeeper", 2: "defender", 3: "midfielder", 4: "forward" }
  const fn = (p: any) => `${p.first_name} ${p.second_name}`
  const club = (p: any) => teamFullNames[p.team] ?? "???"

  const top = (arr: any[], key: (p: any) => number) => [...arr].sort((a, b) => key(b) - key(a))[0]
  const topFiltered = (arr: any[], filter: (p: any) => boolean, key: (p: any) => number) =>
    [...arr].filter(filter).sort((a, b) => key(b) - key(a))[0]

  const tickerFacts: TickerFact[] = [
    // 1. Most expensive
    (() => { const p = top(allPlayers, p => p.now_cost); return toFact(p, `${fn(p)} of ${club(p)} is the most expensive player in FPL this season at £${(p.now_cost / 10).toFixed(1)}m`) })(),

    // 2. Cheapest starting GK
    (() => { const p = topFiltered(active, p => p.element_type === 1, p => -p.now_cost); return toFact(p, `${fn(p)} of ${club(p)} is the cheapest starting goalkeeper in FPL at just £${(p.now_cost / 10).toFixed(1)}m`) })(),

    // 3. Best points-per-million
    (() => { const p = topFiltered(active, p => p.minutes > 450, p => p.total_points / (p.now_cost / 10)); return toFact(p, `${fn(p)} of ${club(p)} offers the best value in FPL this season at ${(p.total_points / (p.now_cost / 10)).toFixed(1)} points per £1m spent`) })(),

    // 4. Highest form
    (() => { const p = top(active, p => parseFloat(p.form)); return toFact(p, `${fn(p)} of ${club(p)} is the hottest ${posLabel[p.element_type]} in FPL right now with a form score of ${parseFloat(p.form).toFixed(1)}`) })(),

    // 5. Most owned
    (() => { const p = top(allPlayers, p => parseFloat(p.selected_by_percent)); return toFact(p, `${fn(p)} of ${club(p)} is the most-owned player in FPL, selected by ${parseFloat(p.selected_by_percent).toFixed(1)}% of managers`) })(),

    // 6. Most-owned midfielder
    (() => { const p = topFiltered(allPlayers, p => p.element_type === 3, p => parseFloat(p.selected_by_percent)); return toFact(p, `${fn(p)} of ${club(p)} is the most-owned midfielder in FPL at ${parseFloat(p.selected_by_percent).toFixed(1)}% ownership`) })(),

    // 7. Most-owned defender
    (() => { const p = topFiltered(allPlayers, p => p.element_type === 2, p => parseFloat(p.selected_by_percent)); return toFact(p, `${fn(p)} of ${club(p)} is the most-owned defender in FPL at ${parseFloat(p.selected_by_percent).toFixed(1)}% ownership`) })(),

    // 8. Best differential (low owned, high form)
    (() => { const p = topFiltered(active, p => parseFloat(p.selected_by_percent) < 10 && parseFloat(p.form) >= 5, p => parseFloat(p.form)); return p ? toFact(p, `${fn(p)} of ${club(p)} is owned by just ${parseFloat(p.selected_by_percent).toFixed(1)}% of managers despite a form score of ${parseFloat(p.form).toFixed(1)}. The standout FPL differential right now`) : null })(),

    // 9. Most transferred-in this GW
    (() => { const p = top(allPlayers, p => p.transfers_in_event); return toFact(p, `${fn(p)} of ${club(p)} is the most-transferred-in player this gameweek with ${fmtTransfers(p.transfers_in_event)} transfers in`) })(),

    // 10. Most transferred-out this GW
    (() => { const p = top(allPlayers, p => p.transfers_out_event); return toFact(p, `${fn(p)} of ${club(p)} is being sold by ${fmtTransfers(p.transfers_out_event)} managers this gameweek, the most-transferred-out player in FPL`) })(),

    // 11. Most transferred-in overall this season
    (() => { const p = top(allPlayers, p => p.transfers_in); return toFact(p, `${fn(p)} of ${club(p)} has been brought into FPL squads ${fmtTransfers(p.transfers_in)} times this season, more than any other player`) })(),

    // 12. Most total points
    (() => { const p = top(allPlayers, p => p.total_points); return toFact(p, `${fn(p)} of ${club(p)} leads the FPL points table this season with ${p.total_points} points`) })(),

    // 13. Highest points-per-game
    (() => { const p = topFiltered(active, p => p.element_type !== 1 && p.minutes > 450, p => parseFloat(p.points_per_game)); return toFact(p, `${fn(p)} of ${club(p)} averages ${parseFloat(p.points_per_game).toFixed(1)} FPL points per game this season, the highest of any outfield player`) })(),

    // 14. Top scorer
    (() => { const p = top(allPlayers, p => p.goals_scored); return toFact(p, `${fn(p)} of ${club(p)} is FPL's top scorer this season with ${p.goals_scored} Premier League goals`) })(),

    // 15. Most assists
    (() => { const p = top(allPlayers, p => p.assists); return toFact(p, `${fn(p)} of ${club(p)} has more FPL assists than anyone else this season, ${p.assists} in total`) })(),

    // 16. Most bonus points
    (() => { const p = top(allPlayers, p => p.bonus); return toFact(p, `${fn(p)} of ${club(p)} has earned more FPL bonus points than any other player this season, ${p.bonus} in total`) })(),

    // 17. BPS leader
    (() => { const p = top(allPlayers, p => p.bps); return toFact(p, `${fn(p)} of ${club(p)} leads the Bonus Points System rankings this season with a BPS score of ${p.bps}`) })(),

    // 18. Most clean sheets (defender)
    (() => { const p = topFiltered(allPlayers, p => p.element_type === 2, p => p.clean_sheets); return toFact(p, `${fn(p)} of ${club(p)} has kept ${p.clean_sheets} clean sheets this season, the most of any FPL defender`) })(),

    // 19. Most saves (goalkeeper)
    (() => { const p = topFiltered(allPlayers, p => p.element_type === 1, p => p.saves); return toFact(p, `${fn(p)} of ${club(p)} has made ${p.saves} saves this season, the most of any FPL goalkeeper`) })(),

    // 20. Highest xP next GW
    (() => { const p = top(allPlayers, p => parseFloat(p.ep_next || "0")); return parseFloat(p.ep_next) > 0 ? toFact(p, `${fn(p)} of ${club(p)} has the highest expected FPL points for the next gameweek at ${parseFloat(p.ep_next).toFixed(1)} xPts`) : null })(),

    // 21. Highest xP this GW
    (() => { const p = top(allPlayers, p => parseFloat(p.ep_this || "0")); return parseFloat(p.ep_this) > 0 ? toFact(p, `${fn(p)} of ${club(p)} had the highest expected FPL points this gameweek with ${parseFloat(p.ep_this).toFixed(1)} xPts`) : null })(),

    // 22. ICT index leader
    (() => { const p = top(active, p => parseFloat(p.ict_index || "0")); return toFact(p, `${fn(p)} of ${club(p)} leads the ICT Index this season with a score of ${parseFloat(p.ict_index).toFixed(1)}`) })(),

    // 23. Creativity leader
    (() => { const p = top(active, p => parseFloat(p.creativity || "0")); return toFact(p, `${fn(p)} of ${club(p)} is the most creative player in the Premier League this season with a creativity score of ${parseFloat(p.creativity).toFixed(1)}`) })(),

    // 24. Threat leader
    (() => { const p = top(active, p => parseFloat(p.threat || "0")); return toFact(p, `${fn(p)} of ${club(p)} tops the FPL threat rankings this season with a score of ${parseFloat(p.threat).toFixed(1)}`) })(),

    // 25. Yellow card leader
    (() => { const p = topFiltered(active, p => p.yellow_cards >= 5, p => p.yellow_cards); return p ? toFact(p, `${fn(p)} of ${club(p)} has received ${p.yellow_cards} yellow cards this season. One to watch for a suspension`) : null })(),

    // 26. High-profile injury doubt
    (() => { const p = topFiltered(allPlayers, p => p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 100, p => p.total_points); return p ? toFact(p, `${fn(p)} of ${club(p)} is a doubt for the next gameweek with only a ${p.chance_of_playing_next_round}% chance of playing. ${p.news}`) : null })(),

    // 27. Top price riser this GW
    (() => { const p = topFiltered(allPlayers, p => p.cost_change_event > 0, p => p.cost_change_event); return p ? toFact(p, `${fn(p)} of ${club(p)} has risen in price this gameweek and is now valued at £${(p.now_cost / 10).toFixed(1)}m`) : null })(),
  ].filter(Boolean) as TickerFact[]

  const now = new Date()
  const nextEvent = json.events
    .filter((e: any) => new Date(e.deadline_time) > now)
    .sort((a: any, b: any) => new Date(a.deadline_time).getTime() - new Date(b.deadline_time).getTime())[0]

  const nextDeadline: string | null = nextEvent ? nextEvent.deadline_time : null
  const nextGwName: string = nextEvent ? `Gameweek ${nextEvent.id}` : "Gameweek"

  const data: ShowcasePlayers = { topPts, topForm, risers, differentials, mostSelected, mostBonus, injuryNews, tickerFacts, nextDeadline, nextGwName }
  cache = { data, ts: Date.now() }
  return NextResponse.json(data)
}
