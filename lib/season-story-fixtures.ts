export interface GWFixtureContext {
  isDGW: boolean
  isBGW: boolean
  dgwTeamNames: string[]
  bgwTeamNames: string[]
}

type FPLFixture = {
  event: number
  team_h: number
  team_a: number
  finished?: boolean
  finished_provisional?: boolean
}

/** True when FPL has closed the GW or every fixture in it is done (incl. provisional). */
export function isGameweekStoryReady(
  gw: number,
  eventFinished: boolean,
  fixtures: FPLFixture[]
): boolean {
  if (eventFinished) return true
  const gwFixtures = fixtures.filter((f) => f.event === gw)
  if (gwFixtures.length === 0) return false
  return gwFixtures.every((f) => f.finished || f.finished_provisional)
}

export function getGWFixtureContext(
  fixtures: FPLFixture[],
  teams: { id: number; name: string; short_name: string }[],
  gw: number
): GWFixtureContext {
  const teamMap = new Map(teams.map((t) => [t.id, t.short_name]))
  const gwFix = fixtures.filter((f) => f.event === gw)
  const counts: Record<number, number> = {}
  gwFix.forEach((f) => {
    counts[f.team_h] = (counts[f.team_h] ?? 0) + 1
    counts[f.team_a] = (counts[f.team_a] ?? 0) + 1
  })
  const active = new Set(Object.keys(counts).map(Number))
  const dgwTeamNames = Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .map(([id]) => teamMap.get(Number(id)) ?? "")
    .filter(Boolean)
  const bgwTeamNames = teams
    .filter((t) => !active.has(t.id))
    .map((t) => t.short_name)

  return {
    isDGW: dgwTeamNames.length > 0,
    isBGW: bgwTeamNames.length > 0,
    dgwTeamNames,
    bgwTeamNames,
  }
}
