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

export type ShowcasePlayers = {
  topPts: ShowcasePlayer[]
  topForm: ShowcasePlayer[]
  risers: ShowcasePlayer[]
  differentials: ShowcasePlayer[]
  mostSelected: EdgePlayer[]   // top 3 by ownership %
  mostBonus: EdgePlayer[]      // top 3 by season bonus points
  nextDeadline: string | null  // ISO string of next GW deadline
  nextGwName: string           // e.g. "Gameweek 32"
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  const res = await fetch(FPL_URL, { next: { revalidate: 1800 } })
  const json = await res.json()

  const teams: Record<number, string> = {}
  const teamCodes: Record<number, number> = {}
  for (const t of json.teams) {
    teams[t.id] = t.short_name
    teamCodes[t.id] = t.code
  }

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

  const now = new Date()
  const nextEvent = json.events
    .filter((e: any) => new Date(e.deadline_time) > now)
    .sort((a: any, b: any) => new Date(a.deadline_time).getTime() - new Date(b.deadline_time).getTime())[0]

  const nextDeadline: string | null = nextEvent ? nextEvent.deadline_time : null
  const nextGwName: string = nextEvent ? `Gameweek ${nextEvent.id}` : "Gameweek"

  const data: ShowcasePlayers = { topPts, topForm, risers, differentials, mostSelected, mostBonus, nextDeadline, nextGwName }
  cache = { data, ts: Date.now() }
  return NextResponse.json(data)
}
