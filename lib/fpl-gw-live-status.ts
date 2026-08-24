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

export type TeamFixtureState = "not_started" | "live" | "finished" | "blank";

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
