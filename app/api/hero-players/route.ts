import { NextResponse } from "next/server"
import { fplPhotoUrlFromElement } from "@/lib/fpl-player-photo"

const FPL_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

export type HeroPlayer = {
  name: string
  team: string
  photoUrl: string
}

type CacheShape = { data: HeroPlayer[]; ts: number }
let cache: CacheShape | null = null
const CACHE_MS = 30 * 60 * 1000

// Don't prerender at build time - FPL API is flaky from the build machine
// and we want a fresh in-memory cache started at first real request.
export const dynamic = "force-dynamic"
export const revalidate = 1800

/**
 * Returns the top ~8 relevant players for the homepage hero rotation.
 *
 * Ranking logic is resilient to any point in the FPL calendar:
 *   Preseason / GW1 (minutes ~ 0): falls back to selected_by_percent (community consensus)
 *   Mid-season:                    total_points and current form dominate
 *
 * Ensures team diversity (max 1 per team) so the hero doesn't cycle through
 * five Man City players. Filters unavailable players.
 */
export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  let json: any = null
  try {
    const res = await fetch(FPL_URL, { next: { revalidate: 1800 } })
    if (!res.ok) throw new Error(`FPL bootstrap HTTP ${res.status}`)
    const text = await res.text()
    if (!text) throw new Error("Empty FPL bootstrap response")
    json = JSON.parse(text)
  } catch (err) {
    console.warn("hero-players: FPL fetch failed", err)
    return NextResponse.json([], { status: 200 })
  }

  if (!json?.elements || !json?.teams) {
    return NextResponse.json([], { status: 200 })
  }

  const teamFullNames: Record<number, string> = {}
  for (const t of json.teams) teamFullNames[t.id] = t.name

  const eligible = json.elements.filter((p: any) => {
    if (p.status === "u") return false
    if (p.status === "s") return false
    const news = (p.news || "").toLowerCase()
    if (news.includes("loan")) return false
    if (news.includes("left the club")) return false
    if (news.includes("transferred")) return false
    return true
  })

  const scored = eligible.map((p: any) => {
    const form = parseFloat(p.form || "0")
    const ownership = parseFloat(p.selected_by_percent || "0")
    const epNext = parseFloat(p.ep_next || "0")
    const priorityScore = p.total_points * 2 + form * 20 + epNext * 15 + ownership
    return { p, score: priorityScore }
  })

  scored.sort((a: any, b: any) => b.score - a.score)

  const chosen: any[] = []
  const seenTeams = new Set<number>()
  for (const { p } of scored) {
    if (seenTeams.has(p.team)) continue
    chosen.push(p)
    seenTeams.add(p.team)
    if (chosen.length >= 8) break
  }

  const data: HeroPlayer[] = chosen.map((p: any) => ({
    name: `${p.first_name} ${p.second_name}`.trim(),
    team: teamFullNames[p.team] ?? "",
    photoUrl: fplPhotoUrlFromElement(p.photo, p.code),
  }))

  cache = { data, ts: Date.now() }
  return NextResponse.json(data)
}
