import type { ChatPlayerRow } from "@/lib/chat-player-filter";

function playerDisplayName(row: ChatPlayerRow): string {
  const full = `${row.rawData.first_name} ${row.rawData.second_name}`.trim();
  return full || row.rawData.web_name;
}

function playerEpNext(row: ChatPlayerRow): number {
  const value = parseFloat(String(row.rawData.ep_next ?? "0"));
  return Number.isFinite(value) ? value : 0;
}

function playerForm(row: ChatPlayerRow): number {
  const value = parseFloat(String(row.rawData.form ?? "0"));
  return Number.isFinite(value) ? value : 0;
}

function playerPrice(row: ChatPlayerRow): string {
  const cost = Number(row.rawData.now_cost ?? 0);
  return `£${(cost / 10).toFixed(1)}m`;
}

export function isTeamStackQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /\btriple[\s-]?up\b/.test(lower) ||
    /\bthree[\s-]?up\b/.test(lower) ||
    /\bteam\s+stack/.test(lower) ||
    /\bstack(?:ing)?\s+(?:on\s+)?(?:a\s+)?team\b/.test(lower) ||
    /\b(?:three|3)\s+players?\s+from\s+(?:the\s+)?same\s+(?:club|team)\b/.test(lower) ||
    /\bbest\s+(?:teams?|clubs?)\s+to\s+(?:triple|stack)\b/.test(lower)
  );
}

/** Top outfield picks per club for triple-up / team-stack questions. */
export function buildTeamStackPlayerPool(
  allPlayers: ChatPlayerRow[],
  maxPerTeam = 4,
): ChatPlayerRow[] {
  const byTeam = new Map<string, ChatPlayerRow[]>();

  for (const player of allPlayers) {
    const teamCode = player.team;
    if (!teamCode) continue;
    if (player.position === "GKP") continue;
    if (playerEpNext(player) <= 0) continue;
    if (String(player.rawData.status ?? "a") === "u") continue;

    const list = byTeam.get(teamCode) ?? [];
    list.push(player);
    byTeam.set(teamCode, list);
  }

  const pool: ChatPlayerRow[] = [];
  for (const players of byTeam.values()) {
    const top = [...players]
      .sort((a, b) => playerEpNext(b) - playerEpNext(a))
      .slice(0, maxPerTeam);
    pool.push(...top);
  }

  return pool.sort((a, b) => playerEpNext(b) - playerEpNext(a));
}

export function formatTeamStackFactsContext(
  allPlayers: ChatPlayerRow[],
  teamFixtures: Record<string, string[]>,
  adviceGwId: number,
  maxTeams = 10,
  maxPlayersPerTeam = 3,
): string {
  const byTeam = new Map<string, ChatPlayerRow[]>();

  for (const player of allPlayers) {
    const teamCode = player.team;
    if (!teamCode) continue;
    if (player.position === "GKP") continue;
    if (playerEpNext(player) <= 0) continue;
    if (String(player.rawData.status ?? "a") === "u") continue;

    const list = byTeam.get(teamCode) ?? [];
    list.push(player);
    byTeam.set(teamCode, list);
  }

  const rankedTeams = [...byTeam.entries()]
    .map(([teamCode, players]) => {
      const top = [...players]
        .sort((a, b) => playerEpNext(b) - playerEpNext(a))
        .slice(0, maxPlayersPerTeam);
      const stackScore = top.reduce((sum, p) => sum + playerEpNext(p), 0);
      return { teamCode, top, stackScore };
    })
    .filter((entry) => entry.top.length >= 2)
    .sort((a, b) => b.stackScore - a.stackScore)
    .slice(0, maxTeams);

  if (rankedTeams.length === 0) return "";

  const lines = rankedTeams.map(({ teamCode, top, stackScore }, index) => {
    const fixture = teamFixtures[teamCode]?.[0] ?? "TBC";
    const playerLines = top
      .map((player, i) => {
        return `  ${i + 1}. ${playerDisplayName(player)} (${player.rawData.web_name}) - xPNext ${playerEpNext(player)}, form ${playerForm(player)}, ${playerPrice(player)}`;
      })
      .join("\n");

    return `${index + 1}. ${teamCode} (next fixture: ${fixture}, combined top-${top.length} xPNext: ${stackScore.toFixed(1)})\n${playerLines}`;
  });

  return `TEAM STACK FACTS (Gameweek ${adviceGwId}) - PRE-COMPUTED. MANDATORY for triple-up / team-stack answers:
- Each player is listed under their real FPL club from live data. NEVER assign a player to a different club.
- Only recommend a triple-up using three players from the SAME club heading below.
- If a player is not listed under a club, do not include them in that club's stack.
- Use the Club field in FILTERED PLAYER DATA rows as the final authority on which team a player plays for.
- Ranked team stacks (best combined xPNext first):
${lines.join("\n")}`;
}
