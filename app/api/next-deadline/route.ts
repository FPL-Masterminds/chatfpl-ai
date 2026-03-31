import { NextResponse } from "next/server"

export const revalidate = 3600 // re-fetch from FPL every hour

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      next: { revalidate: 3600 },
    })
    const data = await res.json()

    const now = Date.now()

    // Find the next event whose deadline is still in the future
    const next = (data.events as Array<{ id: number; deadline_time: string }>)
      .find((e) => new Date(e.deadline_time).getTime() > now)

    if (!next) {
      return NextResponse.json({ gw: null, deadline: null })
    }

    return NextResponse.json({ gw: next.id, deadline: next.deadline_time })
  } catch {
    return NextResponse.json({ gw: null, deadline: null }, { status: 500 })
  }
}
