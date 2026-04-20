import { NextResponse } from "next/server"

export const revalidate = 3600 // re-fetch from FPL every hour

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      next: { revalidate: 3600 },
    })
    const data = await res.json()

    const now = Date.now()
    const events = data.events as Array<{ id: number; deadline_time: string; finished?: boolean }>

    // Find the next event whose deadline is still in the future
    const next = events.find((e) => new Date(e.deadline_time).getTime() > now)

    if (!next) {
      // Determine whether the season is genuinely over or the API is temporarily
      // updating between gameweeks. The season is only truly over when GW38
      // (or the highest GW in the list) has its deadline in the past.
      const lastEvent = events[events.length - 1]
      const lastGW = lastEvent?.id ?? 0
      // Season is over when all GW deadlines have passed AND the last GW is 38
      const seasonOver = lastGW >= 38
      return NextResponse.json({ gw: null, deadline: null, seasonOver })
    }

    return NextResponse.json({ gw: next.id, deadline: next.deadline_time, seasonOver: false })
  } catch {
    // On API error, default to "between GWs" rather than "season over"
    return NextResponse.json({ gw: null, deadline: null, seasonOver: false })
  }
}
