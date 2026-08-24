import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAllSeasonStories, type MemberHistoryInput } from "@/lib/season-story"
import { getGWFixtureContext } from "@/lib/season-story-fixtures"

export const runtime = "nodejs"

const H = { "User-Agent": "ChatFPL/1.0" }
const MAX_LEAGUE_PAGES = 4
const HISTORY_BATCH = 15

async function fetchLeagueStandings(leagueId: number) {
  const firstRes = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`,
    { headers: H }
  )
  if (!firstRes.ok) return null
  const leagueData = await firstRes.json()
  let page = 2
  while (leagueData.standings?.has_next && page <= MAX_LEAGUE_PAGES) {
    const nextRes = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
      { headers: H }
    )
    if (!nextRes.ok) break
    const nextJson = await nextRes.json()
    leagueData.standings.results.push(...(nextJson.standings?.results ?? []))
    leagueData.standings.has_next = !!nextJson.standings?.has_next
    page += 1
  }
  return leagueData
}

async function fetchMemberHistories(
  entries: { entry: number; entry_name: string; player_name: string }[]
): Promise<MemberHistoryInput[]> {
  const results: MemberHistoryInput[] = []
  for (let i = 0; i < entries.length; i += HISTORY_BATCH) {
    const batch = entries.slice(i, i + HISTORY_BATCH)
    const batchResults = await Promise.all(
      batch.map(async (e) => {
        try {
          const r = await fetch(
            `https://fantasy.premierleague.com/api/entry/${e.entry}/history/`,
            { headers: H }
          )
          const hist = r.ok ? await r.json() : null
          return {
            entryId: e.entry,
            team: e.entry_name,
            manager: e.player_name,
            current: hist?.current ?? [],
            chips: hist?.chips ?? [],
          } satisfies MemberHistoryInput
        } catch {
          return {
            entryId: e.entry,
            team: e.entry_name,
            manager: e.player_name,
            current: [],
            chips: [],
          }
        }
      })
    )
    results.push(...batchResults)
  }
  return results
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.fpl_team_id) {
    return NextResponse.json({ error: "no_team_id" }, { status: 400 })
  }

  const teamId = user.fpl_team_id
  const url = new URL(request.url)
  const requestedLeagueId = Number(url.searchParams.get("league") ?? "")

  try {
    const [bootstrapRes, entryRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { headers: H }),
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`, { headers: H }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", { headers: H }),
    ])

    if (!bootstrapRes.ok || !entryRes.ok) {
      return NextResponse.json({ error: "FPL API unavailable" }, { status: 502 })
    }

    const bootstrap = await bootstrapRes.json()
    const entry = await entryRes.json()
    const fixtures: { event: number; team_h: number; team_a: number }[] = fixturesRes.ok ? await fixturesRes.json() : []
    const teams: { id: number; name: string; short_name: string }[] = bootstrap.teams ?? []

    const privateLeagues = (entry.leagues?.classic ?? []).filter(
      (l: { league_type: string }) => l.league_type === "x"
    )
    const activeLeague =
      privateLeagues.find((l: { id: number }) => l.id === requestedLeagueId) ??
      privateLeagues[0]

    if (!activeLeague) {
      return NextResponse.json({
        league_id: null,
        league_name: null,
        available_leagues: [],
        stories: [],
        completed_gws: [],
      })
    }

    const leagueData = await fetchLeagueStandings(activeLeague.id)
    if (!leagueData?.standings?.results?.length) {
      return NextResponse.json({
        league_id: activeLeague.id,
        league_name: leagueData?.league?.name ?? activeLeague.name,
        available_leagues: privateLeagues.map((l: { id: number; name: string; entry_rank: number }) => ({
          id: l.id,
          name: l.name,
          rank: l.entry_rank ?? 0,
        })),
        stories: [],
        completed_gws: [],
      })
    }

    const events: { id: number; finished: boolean; is_current?: boolean; average_entry_score?: number }[] =
      bootstrap.events ?? []
    const completedGws = events
      .filter((e) => e.finished)
      .map((e) => ({ gw: e.id, avg: e.average_entry_score ?? 0 }))

    const isAdmin = user.role === "admin"
    const liveGw = events.find((e) => e.is_current && !e.finished)
    if (isAdmin && liveGw && !completedGws.some((g) => g.gw === liveGw.id)) {
      completedGws.push({
        gw: liveGw.id,
        avg: liveGw.average_entry_score ?? 0,
        provisional: true,
      })
    }

    const members = await fetchMemberHistories(leagueData.standings.results)
    const leagueName = leagueData.league?.name ?? activeLeague.name

    const fixtureContexts = new Map(
      completedGws.map((g) => [g.gw, getGWFixtureContext(fixtures, teams, g.gw)])
    )

    const stories = generateAllSeasonStories(
      activeLeague.id,
      leagueName,
      members,
      teamId,
      completedGws,
      fixtureContexts
    )

    return NextResponse.json({
      league_id: activeLeague.id,
      league_name: leagueName,
      is_admin: isAdmin,
      available_leagues: privateLeagues.map((l: { id: number; name: string; entry_rank: number }) => ({
        id: l.id,
        name: l.name,
        rank: l.entry_rank ?? 0,
      })),
      stories,
      completed_gws: completedGws.filter((g) => !g.provisional).map((g) => g.gw),
      preview_gws: completedGws.filter((g) => g.provisional).map((g) => g.gw),
    })
  } catch (err) {
    console.error("Season story API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
