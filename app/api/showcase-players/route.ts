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
  photoUrl: string  // full CDN URL built by the shared helper — always correct season
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

  const tickerFacts: TickerFact[] = [
    // Most expensive
    (() => {
      const p = [...allPlayers].sort((a, b) => b.now_cost - a.now_cost)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is the most expensive player in FPL this season at £${(p.now_cost / 10).toFixed(1)}m`)
    })(),
    // Highest form
    (() => {
      const p = [...active].sort((a, b) => parseFloat(b.form) - parseFloat(a.form))[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is the in-form player in FPL right now with a form score of ${parseFloat(p.form).toFixed(1)}`)
    })(),
    // Most owned
    (() => {
      const p = [...allPlayers].sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is the most-owned player in FPL — selected by ${parseFloat(p.selected_by_percent).toFixed(1)}% of managers`)
    })(),
    // Most transferred in this GW
    (() => {
      const p = [...allPlayers].sort((a, b) => b.transfers_in_event - a.transfers_in_event)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is the most-transferred-in player this gameweek with ${fmtTransfers(p.transfers_in_event)} transfers in`)
    })(),
    // Most total points
    (() => {
      const p = [...allPlayers].sort((a, b) => b.total_points - a.total_points)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} leads the FPL points table this season with ${p.total_points} points`)
    })(),
    // Top scorer
    (() => {
      const p = [...allPlayers].sort((a, b) => b.goals_scored - a.goals_scored)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is FPL's top scorer this season with ${p.goals_scored} goals`)
    })(),
    // Most assists
    (() => {
      const p = [...allPlayers].sort((a, b) => b.assists - a.assists)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} has more FPL assists than anyone else this season — ${p.assists} in total`)
    })(),
    // Most transferred out this GW
    (() => {
      const p = [...allPlayers].sort((a, b) => b.transfers_out_event - a.transfers_out_event)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} is the most-sold player this gameweek — ${fmtTransfers(p.transfers_out_event)} managers have moved on`)
    })(),
    // Most bonus points
    (() => {
      const p = [...allPlayers].sort((a, b) => b.bonus - a.bonus)[0]
      return toFact(p, `${p.first_name} ${p.second_name} of ${teamFullNames[p.team]} has earned more FPL bonus points than any other player this season — ${p.bonus} in total`)
    })(),
  ]

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
