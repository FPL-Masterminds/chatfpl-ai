import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Morning"
  if (h < 18) return "Afternoon"
  return "Evening"
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ alert: null })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { fpl_team_id: true },
    })

    if (!user?.fpl_team_id) return NextResponse.json({ alert: null })

    // Fetch user's squad picks
    const picksRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/event/current/picks/`,
      { next: { revalidate: 300 } }
    )

    // FPL returns 404 mid-season if GW not yet started - fallback gracefully
    if (!picksRes.ok) {
      // Try fetching the entry to get latest finished event
      const entryRes = await fetch(
        `https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/`,
        { next: { revalidate: 300 } }
      )
      if (!entryRes.ok) return NextResponse.json({ alert: null })
      const entryData = await entryRes.json()
      const lastGw = entryData.current_event || entryData.summary_event
      if (!lastGw) return NextResponse.json({ alert: null })

      const picks2Res = await fetch(
        `https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/event/${lastGw}/picks/`,
        { next: { revalidate: 300 } }
      )
      if (!picks2Res.ok) return NextResponse.json({ alert: null })
      const picks2Data = await picks2Res.json()
      return processAlert(picks2Data.picks || [])
    }

    const picksData = await picksRes.json()
    return processAlert(picksData.picks || [])
  } catch {
    return NextResponse.json({ alert: null })
  }
}

async function processAlert(picks: { element: number; multiplier: number }[]) {
  if (!picks.length) return NextResponse.json({ alert: null })

  // Fetch bootstrap for player data
  const bootstrapRes = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    { next: { revalidate: 300 } }
  )
  if (!bootstrapRes.ok) return NextResponse.json({ alert: null })

  const bootstrap = await bootstrapRes.json()
  const elements: any[] = bootstrap.elements || []

  const squadIds = new Set(picks.map((p: any) => p.element))
  const squadPlayers = elements.filter((e: any) => squadIds.has(e.id))

  // --- Priority 1: Injury / doubt flags ---
  const flagged = squadPlayers
    .filter((e: any) => e.status === "d" || e.status === "i" || e.status === "u" || e.status === "s")
    .map((e: any) => ({
      name: e.web_name,
      status: e.status,
      news: e.news || "",
    }))

  if (flagged.length > 0) {
    // Pick the most severe (injured > unavailable > suspended > doubtful)
    const priority: Record<string, number> = { i: 4, u: 3, s: 2, d: 1 }
    flagged.sort((a, b) => (priority[b.status] || 0) - (priority[a.status] || 0))
    const top = flagged[0]
    const label = top.status === "d" ? "flagged" : top.status === "i" ? "injured" : top.status === "s" ? "suspended" : "unavailable"
    const extra = flagged.length > 1 ? ` (+${flagged.length - 1} more in your squad)` : ""
    return NextResponse.json({
      alert: {
        type: "injury",
        message: `${greeting()}. Heads up - ${top.name} ${label}.${extra}`,
        detail: top.news || null,
        count: flagged.length,
      },
    })
  }

  // --- Priority 2: Heavily sold player in squad ---
  const heavilySold = squadPlayers
    .filter((e: any) => e.transfers_out_event > 100000)
    .sort((a: any, b: any) => b.transfers_out_event - a.transfers_out_event)

  if (heavilySold.length > 0) {
    const top = heavilySold[0]
    const sold = (top.transfers_out_event / 1000).toFixed(0)
    return NextResponse.json({
      alert: {
        type: "transfer",
        message: `${greeting()}. ${top.web_name} is being sold hard - ${sold}k transfers out this week.`,
        detail: null,
        count: heavilySold.length,
      },
    })
  }

  return NextResponse.json({ alert: null })
}
