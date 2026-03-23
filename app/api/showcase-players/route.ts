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

export type ShowcasePlayers = {
  topPts: ShowcasePlayer[]    // top 3 by total points
  topForm: ShowcasePlayer[]   // top 3 by form
  risers: ShowcasePlayer[]    // top 3 price risers this week
  differentials: ShowcasePlayer[] // top 3 <10% owned, good form
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  const res = await fetch(FPL_URL, { next: { revalidate: 1800 } })
  const json = await res.json()

  const teams: Record<number, string> = {}
  for (const t of json.teams) teams[t.id] = t.short_name

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

  const data: ShowcasePlayers = { topPts, topForm, risers, differentials }
  cache = { data, ts: Date.now() }
  return NextResponse.json(data)
}
