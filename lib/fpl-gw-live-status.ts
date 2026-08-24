export interface FplFixtureLike {
  event: number;
  team_h: number;
  team_a: number;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time?: string | null;
}

export interface FplTeamLike {
  id: number;
  short_name: string;
  name: string;
}

export interface FplEventLike {
  id: number;
  name: string;
  is_current?: boolean;
  is_next?: boolean;
  finished?: boolean;
  deadline_time?: string;
}

export type TeamFixtureState = "not_started" | "live" | "finished" | "blank";

const FPL_FETCH_OPTS = { cache: "no-store" as const };

export function fplLiveFetchOptions() {
  return FPL_FETCH_OPTS;
}

export function isFixtureComplete(fixture: FplFixtureLike): boolean {
  return Boolean(fixture.finished || fixture.finished_provisional);
}

export function isGameweekComplete(
  gwId: number,
  eventFinished: boolean,
  fixtures: FplFixtureLike[],
): boolean {
  if (eventFinished) return true;
  const gwFixtures = fixtures.filter((f) => f.event === gwId);
  if (gwFixtures.length === 0) return false;
  return gwFixtures.every(isFixtureComplete);
}

/** Resolve which GW is live vs which GW captaincy/transfer advice should target. */
export function resolveFplGameweekContext(
  events: FplEventLike[],
  fixtures: FplFixtureLike[],
): {
  currentEvent: FplEventLike | null;
  nextEvent: FplEventLike | null;
  currentGwId: number;
  planningGwId: number;
  currentGwComplete: boolean;
} {
  const sorted = [...events].sort((a, b) => a.id - b.id);
  const currentEvent = events.find((e) => e.is_current) ?? sorted[0] ?? null;
  const nextEvent = events.find((e) => e.is_next) ?? null;
  const currentGwId = currentEvent?.id ?? 1;
  const currentGwComplete = isGameweekComplete(
    currentGwId,
    Boolean(currentEvent?.finished),
    fixtures,
  );
  const maxGwId = sorted[sorted.length - 1]?.id ?? currentGwId;
  const planningGwId =
    nextEvent?.id ??
    (currentGwComplete ? Math.min(currentGwId + 1, maxGwId) : currentGwId);

  return {
    currentEvent,
    nextEvent,
    currentGwId,
    planningGwId,
    currentGwComplete,
  };
}

/** Parse an explicit GW number from the user's message (e.g. "GW2"). */
export function parseAdviceGameweekFromMessage(message: string, fallback: number): number {
  const match =
    message.match(/\bgw\s*(\d+)\b/i) ?? message.match(/\bgameweek\s*(\d+)\b/i);
  if (!match) return fallback;
  const gw = Number.parseInt(match[1], 10);
  if (!Number.isFinite(gw) || gw < 1 || gw > 38) return fallback;
  return gw;
}

export function filterUpcomingFixtures(
  fixtures: FplFixtureLike[],
  startGw: number,
  window = 4,
): FplFixtureLike[] {
  return fixtures.filter(
    (f) =>
      f.event >= startGw &&
      f.event <= startGw + window &&
      !isFixtureComplete(f),
  );
}

function formatKickoffUk(isoString: string): string {
  const date = new Date(isoString);
  const ukDate = new Date(date.toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const day = String(ukDate.getDate()).padStart(2, "0");
  const month = String(ukDate.getMonth() + 1).padStart(2, "0");
  const hours = String(ukDate.getHours()).padStart(2, "0");
  const minutes = String(ukDate.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

export function teamFixtureStateInGw(
  teamId: number,
  gwId: number,
  fixtures: FplFixtureLike[],
): TeamFixtureState {
  const teamFixtures = fixtures.filter(
    (f) => f.event === gwId && (f.team_h === teamId || f.team_a === teamId),
  );
  if (teamFixtures.length === 0) return "blank";
  if (teamFixtures.every((f) => f.finished || f.finished_provisional)) return "finished";
  if (teamFixtures.some((f) => f.started)) return "live";
  return "not_started";
}

export function formatTeamFixtureStateLabel(state: TeamFixtureState): string {
  switch (state) {
    case "not_started":
      return "yet to play this GW";
    case "live":
      return "fixture live";
    case "finished":
      return "fixture finished";
    case "blank":
      return "blank GW (no fixture)";
  }
}

export function formatPlanningGwFixtureStatus(
  planningGwId: number,
  events: FplEventLike[],
  fixtures: FplFixtureLike[],
  teams: FplTeamLike[],
): string {
  const planningEvent = events.find((e) => e.id === planningGwId);
  const gwName = planningEvent?.name ?? `Gameweek ${planningGwId}`;
  const gwFixtures = fixtures.filter((f) => f.event === planningGwId);
  if (!gwFixtures.length) return "";

  const fixtureLines = gwFixtures.map((f) => {
    const home = teams.find((t) => t.id === f.team_h)?.short_name ?? "???";
    const away = teams.find((t) => t.id === f.team_a)?.short_name ?? "???";
    const kick = f.kickoff_time ? formatKickoffUk(f.kickoff_time) : "TBC";
    if (isFixtureComplete(f)) return `${home} v ${away}: finished`;
    if (f.started) return `${home} v ${away}: live`;
    return `${home} v ${away}: kicks off ${kick} UK`;
  });

  return [
    `PLANNING GAMEWEEK FIXTURES (${gwName}, ID ${planningGwId}):`,
    "- Use this block for captaincy, transfer, and fixture-run advice.",
    "- TEAM FIXTURE RUNS below start from this gameweek. The first opponent listed for each club is their NEXT fixture.",
    "- NEVER describe a fixture marked finished here as upcoming, next, or still to play.",
    `- Fixtures: ${fixtureLines.join(" | ")}`,
  ].join("\n");
}

export function formatAdviceGameweekNote(
  currentGwId: number,
  currentGwComplete: boolean,
  adviceGwId: number,
): string {
  if (!currentGwComplete && adviceGwId === currentGwId) {
    return `ADVICE GAMEWEEK: ${adviceGwId} (same as the live/current round).`;
  }
  if (currentGwComplete && adviceGwId > currentGwId) {
    return [
      `ADVICE GAMEWEEK: ${adviceGwId}.`,
      `CRITICAL: Gameweek ${currentGwId} is COMPLETE (all fixtures finished).`,
      `Captaincy, transfers, and fixture mentions must target Gameweek ${adviceGwId} only.`,
      `xPNext on each player row is FPL's official prediction FOR Gameweek ${adviceGwId}.`,
      `Do NOT cite Gameweek ${currentGwId} opponents as next or upcoming.`,
    ].join("\n");
  }
  return `ADVICE GAMEWEEK: ${adviceGwId}.`;
}

export function formatCurrentGwFixtureStatus(
  gwId: number,
  gwName: string,
  gwFinished: boolean,
  fixtures: FplFixtureLike[],
  teams: FplTeamLike[],
): string {
  const gwFixtures = fixtures.filter((f) => f.event === gwId);
  if (!gwFixtures.length) return "";

  const finishedCount = gwFixtures.filter((f) => f.finished || f.finished_provisional).length;
  const startedCount = gwFixtures.filter((f) => f.started).length;

  const fixtureLines = gwFixtures.map((f) => {
    const home = teams.find((t) => t.id === f.team_h)?.short_name ?? "???";
    const away = teams.find((t) => t.id === f.team_a)?.short_name ?? "???";
    const kick = f.kickoff_time ? formatKickoffUk(f.kickoff_time) : "TBC";
    if (f.finished || f.finished_provisional) return `${home} v ${away}: finished`;
    if (f.started) return `${home} v ${away}: live`;
    return `${home} v ${away}: kicks off ${kick} UK`;
  });

  return [
    `CURRENT GW FIXTURE STATUS (${gwName}, ID ${gwId}):`,
    `- Gameweek finished flag: ${gwFinished ? "Yes" : "No"} (${finishedCount}/${gwFixtures.length} fixtures complete, ${startedCount}/${gwFixtures.length} started)`,
    `- CRITICAL: Finished: No only means the gameweek round is not fully settled. Individual fixtures may still be live or not yet kicked off.`,
    `- Fixtures: ${fixtureLines.join(" | ")}`,
    "",
    "LIVE GW POINTS INTERPRETATION (mandatory):",
    "- GWpts on each player row is their score THIS gameweek only.",
    "- GWpts of 0 does NOT automatically mean a bad return. Check fixture status for that player's club in CURRENT GW FIXTURE STATUS first.",
    "- If their club's fixture has NOT started: say they are yet to play this gameweek. Do not call it a blank or poor return.",
    "- If their fixture is live: they may still be playing or points may update.",
    "- Only criticise 0 GWpts as a blank once their club's fixture is finished.",
  ].join("\n");
}
