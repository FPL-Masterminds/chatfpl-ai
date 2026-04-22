import { NextResponse } from "next/server"

export const revalidate = 1800 // refresh every 30 minutes

export async function GET() {
  try {
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        next: { revalidate: 1800 },
      }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", {
        next: { revalidate: 1800 },
      }),
    ])

    if (!bootstrapRes.ok || !fixturesRes.ok) {
      return NextResponse.json({ gw: null, hasDGW: false, dgwTeamCount: 0 })
    }

    const bootstrap = await bootstrapRes.json()
    const fixtures = await fixturesRes.json()

    const now = Date.now()
    const events: Array<{ id: number; deadline_time: string; finished?: boolean }> =
      bootstrap.events ?? []

    // Next GW = the one whose deadline is still in the future (what prompts refer to)
    const nextEvent = events.find(
      (e) => new Date(e.deadline_time).getTime() > now
    )
    // Fallback: first unfinished event, or last event if all done
    const fallbackEvent =
      events.find((e) => !e.finished) ?? events[events.length - 1]
    const nextGW = nextEvent?.id ?? fallbackEvent?.id ?? null

    // DGW detection: check the SAME gameweek shown in the prompts (nextGW)
    const teams: Array<{ id: number; name: string }> = bootstrap.teams ?? []
    const dgwTeams = nextGW
      ? teams.filter(
          (team) =>
            (fixtures as Array<{ event: number; team_h: number; team_a: number }>).filter(
              (f) =>
                f.event === nextGW &&
                (f.team_h === team.id || f.team_a === team.id)
            ).length >= 2
        )
      : []

    return NextResponse.json({
      gw: nextGW,
      hasDGW: dgwTeams.length > 0,
      dgwTeamCount: dgwTeams.length,
    })
  } catch {
    return NextResponse.json({ gw: null, hasDGW: false, dgwTeamCount: 0 })
  }
}
