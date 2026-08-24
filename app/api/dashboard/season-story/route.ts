import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAllSeasonStories, type MemberHistoryInput } from "@/lib/season-story"
import { getGWFixtureContext, isGameweekStoryReady } from "@/lib/season-story-fixtures"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const H = { "User-Agent": "ChatFPL/1.0" }
const MAX_LEAGUE_PAGES = 4
const HISTORY_BATCH = 15

type StandingRow = {
  entry: number
  entry_name: string
  player_name: string
  total: number
  event_total: number
  points_on_bench?: number
}

type CompletedGw = { gw: number; avg: number; provisional?: boolean }

function membersFromStandings(rows: StandingRow[], gw: number): MemberHistoryInput[] {
  return rows.map((r) => ({
    entryId: r.entry,
    team: r.entry_name,
    manager: r.player_name,
    current: [
      {
        event: gw,
        points: r.event_total,
        total_points: r.total,
        points_on_bench: r.points_on_bench ?? 0,
      },
    ],
    chips: [],
  }))
}

function mergeMembersWithStandings(
  histories: MemberHistoryInput[],
  standings: StandingRow[],
  gw: number
): MemberHistoryInput[] {
  const byEntry = new Map(histories.map((m) => [m.entryId, m]))
  for (const row of standings) {
    const existing = byEntry.get(row.entry)
    const gwRow = {
      event: gw,
      points: row.event_total,
      total_points: row.total,
      points_on_bench: row.points_on_bench ?? 0,
    }
    if (!existing) {
      byEntry.set(row.entry, {
        entryId: row.entry,
        team: row.entry_name,
        manager: row.player_name,
        current: [gwRow],
        chips: [],
      })
      continue
    }
    if (!existing.current.some((c) => c.event === gw)) {
      existing.current.push(gwRow)
    }
  }
  return Array.from(byEntry.values())
}

function jsonResponse(body: Record<string, unknown>) {
  return NextResponse.json(body, { status: 200 })
}

function waitingResponse(
  leagueId: number,
  leagueName: string,
  leagueList: { id: number; name: string; rank: number }[],
  liveGwId: number,
  isAdmin: boolean
) {
  return jsonResponse({
    status: "waiting_for_gw",
    league_id: leagueId,
    league_name: leagueName,
    is_admin: isAdmin,
    available_leagues: leagueList,
    stories: [],
    completed_gws: [],
    preview_gws: [],
    live_gw: liveGwId,
  })
}

type TacticalSnapshot = {
  chips: { name: string; event: number }[]
  gwRow: {
    points_on_bench?: number
    event_transfers?: number
    event_transfers_cost?: number
  } | null
}

function buildMembersWithTactical(
  rows: StandingRow[],
  gw: number,
  tactical: Map<number, TacticalSnapshot>
): MemberHistoryInput[] {
  return rows.map((r) => {
    const snap = tactical.get(r.entry)
    const gwHistory = snap?.gwRow
    return {
      entryId: r.entry,
      team: r.entry_name,
      manager: r.player_name,
      current: [
        {
          event: gw,
          points: r.event_total,
          total_points: r.total,
          points_on_bench: gwHistory?.points_on_bench ?? 0,
          event_transfers: gwHistory?.event_transfers ?? 0,
          event_transfers_cost: gwHistory?.event_transfers_cost ?? 0,
        },
      ],
      chips: snap?.chips ?? [],
    }
  })
}

async function fetchMemberTacticalData(
  entries: { entry: number }[],
  gw: number
): Promise<Map<number, TacticalSnapshot>> {
  const map = new Map<number, TacticalSnapshot>()
  for (let i = 0; i < entries.length; i += HISTORY_BATCH) {
    const batch = entries.slice(i, i + HISTORY_BATCH)
    await Promise.all(
      batch.map(async (e) => {
        const empty: TacticalSnapshot = { chips: [], gwRow: null }
        try {
          const r = await fetch(
            `https://fantasy.premierleague.com/api/entry/${e.entry}/history/`,
            { headers: H }
          )
          if (!r.ok) {
            map.set(e.entry, empty)
            return
          }
          const hist = await r.json()
          map.set(e.entry, {
            chips: hist?.chips ?? [],
            gwRow:
              (hist?.current ?? []).find((c: { event: number }) => c.event === gw) ?? null,
          })
        } catch {
          map.set(e.entry, empty)
        }
      })
    )
  }
  return map
}

async function resolveStoryMembers(
  standingsRows: StandingRow[],
  maxFinishedGw: number,
  liveGwId: number | null,
  needsFullHistory: boolean,
  mergeLiveProvisional: boolean
): Promise<MemberHistoryInput[]> {
  if (needsFullHistory) {
    let members = await fetchMemberHistories(standingsRows)
    if (mergeLiveProvisional && liveGwId) {
      members = mergeMembersWithStandings(members, standingsRows, liveGwId)
    }
    const targetGw = maxFinishedGw || liveGwId || 1
    if (!membersHaveGwData(members, targetGw)) {
      const tactical = await fetchMemberTacticalData(standingsRows, targetGw)
      return buildMembersWithTactical(standingsRows, targetGw, tactical)
    }
    return members
  }

  const gw = maxFinishedGw || liveGwId || 1
  const tactical = await fetchMemberTacticalData(standingsRows, gw)
  return buildMembersWithTactical(standingsRows, gw, tactical)
}

function membersHaveGwData(members: MemberHistoryInput[], gw: number): boolean {
  return members.some((m) => m.current.some((c) => c.event === gw))
}

function tryGenerateStories(
  leagueId: number,
  leagueName: string,
  members: MemberHistoryInput[],
  teamId: number,
  completedGws: CompletedGw[],
  fixtures: { event: number; team_h: number; team_a: number }[],
  teams: { id: number; name: string; short_name: string }[]
) {
  const fixtureContexts = new Map(
    completedGws.map((g) => [g.gw, getGWFixtureContext(fixtures, teams, g.gw)])
  )
  return generateAllSeasonStories(
    leagueId,
    leagueName,
    members,
    teamId,
    completedGws,
    fixtureContexts
  )
}

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
  let resolvedLeague: { id: number; name: string } | null = null
  let resolvedLiveGw: number | null = null
  let resolvedLeagueList: { id: number; name: string; rank: number }[] = []
  const isAdmin = user.role === "admin"

  try {
    const [bootstrapRes, entryRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { headers: H }),
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`, { headers: H }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", { headers: H }),
    ])

    if (!bootstrapRes.ok || !entryRes.ok) {
      return NextResponse.json(
        {
          status: "unavailable",
          league_id: null,
          league_name: null,
          available_leagues: [],
          stories: [],
          completed_gws: [],
        },
        { status: 200 }
      )
    }

    const bootstrap = await bootstrapRes.json()
    const entry = await entryRes.json()
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : []
    const teams: { id: number; name: string; short_name: string }[] = bootstrap.teams ?? []

    const privateLeagues = (entry.leagues?.classic ?? []).filter(
      (l: { league_type: string }) => l.league_type === "x"
    )
    const activeLeague =
      privateLeagues.find((l: { id: number }) => l.id === requestedLeagueId) ??
      privateLeagues[0]

    if (!activeLeague) {
      return NextResponse.json({
        status: "no_league",
        league_id: null,
        league_name: null,
        available_leagues: [],
        stories: [],
        completed_gws: [],
        live_gw: null,
      })
    }

    const leagueData = await fetchLeagueStandings(activeLeague.id)
    const leagueList = privateLeagues.map((l: { id: number; name: string; entry_rank: number }) => ({
      id: l.id,
      name: l.name,
      rank: l.entry_rank ?? 0,
    }))
    resolvedLeagueList = leagueList

    if (!leagueData?.standings?.results?.length) {
      return NextResponse.json({
        status: "league_unavailable",
        league_id: activeLeague.id,
        league_name: leagueData?.league?.name ?? activeLeague.name,
        available_leagues: leagueList,
        stories: [],
        completed_gws: [],
        live_gw: null,
      })
    }

    const events: { id: number; finished: boolean; is_current?: boolean; average_entry_score?: number }[] =
      bootstrap.events ?? []
    const finishedGws: CompletedGw[] = events
      .filter((e) => isGameweekStoryReady(e.id, e.finished, fixtures))
      .map((e) => ({ gw: e.id, avg: e.average_entry_score ?? 0 }))

    const currentEvent = events.find((e) => e.is_current) ?? null
    const liveGw =
      currentEvent && !isGameweekStoryReady(currentEvent.id, currentEvent.finished, fixtures)
        ? currentEvent
        : null

    const standingsRows = leagueData.standings.results as StandingRow[]
    const leagueName = leagueData.league?.name ?? activeLeague.name
    resolvedLeague = { id: activeLeague.id, name: leagueName }
    resolvedLiveGw = liveGw?.id ?? null

    // Opening gameweek still live: fast path for everyone. Admins may get a preview.
    if (liveGw && finishedGws.length === 0) {
      if (isAdmin) {
        try {
          const previewGws: CompletedGw[] = [
            { gw: liveGw.id, avg: liveGw.average_entry_score ?? 0, provisional: true },
          ]
          const tactical = await fetchMemberTacticalData(standingsRows, liveGw.id)
          const members = buildMembersWithTactical(standingsRows, liveGw.id, tactical)
          const stories = tryGenerateStories(
            activeLeague.id,
            leagueName,
            members,
            teamId,
            previewGws,
            fixtures,
            teams
          )
          if (stories.length > 0) {
            return jsonResponse({
              status: "ready",
              league_id: activeLeague.id,
              league_name: leagueName,
              is_admin: true,
              available_leagues: leagueList,
              stories,
              completed_gws: [],
              preview_gws: [liveGw.id],
              live_gw: liveGw.id,
            })
          }
        } catch (previewErr) {
          console.error("Season story admin preview error:", previewErr)
        }
      }
      return waitingResponse(activeLeague.id, leagueName, leagueList, liveGw.id, isAdmin)
    }

    const completedGws: CompletedGw[] = [...finishedGws]
    if (isAdmin && liveGw && !completedGws.some((g) => g.gw === liveGw.id)) {
      completedGws.push({
        gw: liveGw.id,
        avg: liveGw.average_entry_score ?? 0,
        provisional: true,
      })
    }

    const maxFinishedGw = finishedGws.length > 0 ? Math.max(...finishedGws.map((g) => g.gw)) : 0
    const needsFullHistory = maxFinishedGw > 1
    const mergeLiveProvisional = Boolean(
      isAdmin && liveGw && completedGws.some((g) => g.provisional && g.gw === liveGw.id)
    )

    const members = await resolveStoryMembers(
      standingsRows,
      maxFinishedGw,
      liveGw?.id ?? null,
      needsFullHistory,
      mergeLiveProvisional
    )

    let stories: ReturnType<typeof generateAllSeasonStories> = []
    try {
      stories = tryGenerateStories(
        activeLeague.id,
        leagueName,
        members,
        teamId,
        completedGws,
        fixtures,
        teams
      )
    } catch (genErr) {
      console.error("Season story generation error:", genErr)
    }

    const finishedGwCount = finishedGws.length
    let status: "ready" | "waiting_for_gw" | "unavailable" = "ready"
    if (stories.length === 0) {
      status =
        liveGw && finishedGwCount === 0
          ? "waiting_for_gw"
          : finishedGwCount > 0
            ? "unavailable"
            : "waiting_for_gw"
    }

    return jsonResponse({
      status,
      league_id: activeLeague.id,
      league_name: leagueName,
      is_admin: isAdmin,
      available_leagues: leagueList,
      stories,
      completed_gws: completedGws.filter((g) => !g.provisional).map((g) => g.gw),
      preview_gws: completedGws.filter((g) => g.provisional).map((g) => g.gw),
      live_gw: liveGw?.id ?? null,
    })
  } catch (err) {
    console.error("Season story API error:", err)
    if (resolvedLeague && resolvedLiveGw) {
      return waitingResponse(
        resolvedLeague.id,
        resolvedLeague.name,
        resolvedLeagueList,
        resolvedLiveGw,
        isAdmin
      )
    }
    return jsonResponse({
      status: "unavailable",
      league_id: resolvedLeague?.id ?? null,
      league_name: resolvedLeague?.name ?? null,
      available_leagues: resolvedLeagueList,
      stories: [],
      completed_gws: [],
      live_gw: resolvedLiveGw,
    })
  }
}
