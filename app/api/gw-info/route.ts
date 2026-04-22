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

    // Active GW = first unfinished event, or last event if all done
    const activeEvent =
      events.find((e) => !e.finished) ?? events[events.length - 1]
    const activeGW = activeEvent?.id ?? null

    // Next GW (deadline still in future) for display in prompts
    const nextEvent = events.find(
      (e) => new Date(e.deadline_time).getTime() > now
    )
    const nextGW = nextEvent?.id ?? activeGW

    // DGW detection: teams with 2+ fixtures in the active GW
    const teams: Array<{ id: number; name: string }> = bootstrap.teams ?? []
    const dgwTeams = activeGW
      ? teams.filter(
          (team) =>
            (fixtures as Array<{ event: number; team_h: number; team_a: number }>).filter(
              (f) =>
                f.event === activeGW &&
                (f.team_h === team.id || f.team_a === team.id)
            ).length >= 2
        )
      : []

    return NextResponse.json({
      gw: nextGW,
      activeGW,
      hasDGW: dgwTeams.length > 0,
      dgwTeamCount: dgwTeams.length,
    })
  } catch {
    return NextResponse.json({ gw: null, hasDGW: false, dgwTeamCount: 0 })
  }
}
