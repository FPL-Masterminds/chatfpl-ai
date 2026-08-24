export type ChatPlayerRow = {
  formatted: string;
  rawData: {
    id: number;
    web_name: string;
    first_name: string;
    second_name: string;
    [key: string]: unknown;
  };
  team?: string;
  position?: string;
};

export function normalizeForChatMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMentionedPlayers(
  message: string,
  allPlayers: ChatPlayerRow[],
  squadElementIds: number[] = [],
): ChatPlayerRow[] {
  const messageNorm = normalizeForChatMatch(message);
  if (!messageNorm) return [];

  const matches = allPlayers.filter((p) => {
    const candidates = [
      p.rawData.web_name,
      p.rawData.first_name,
      p.rawData.second_name,
      `${p.rawData.first_name} ${p.rawData.second_name}`,
    ].map(normalizeForChatMatch);

    return candidates.some((c) => {
      if (c.length < 3) return false;
      if (messageNorm.includes(c)) return true;
      const tokens = c.split(" ").filter((t) => t.length >= 3);
      return tokens.length > 0 && tokens.every((t) => messageNorm.includes(t));
    });
  });

  if (matches.length <= 1) return matches;

  const squadSet = new Set(squadElementIds);
  const inSquad = matches.filter((p) => squadSet.has(p.rawData.id));
  if (inSquad.length >= 1) return inSquad;

  return matches;
}

/** Pull named players out of "Compare Isak vs Watkins" style questions. */
export function findComparePlayers(
  message: string,
  allPlayers: ChatPlayerRow[],
): ChatPlayerRow[] {
  const lower = message.toLowerCase();
  if (!/\b(compare|vs|versus)\b/.test(lower)) return [];

  const patterns = [
    /\bcompare\s+(.+?)\s+(?:vs\.?|versus)\s+(.+?)(?:[?.!]|$)/i,
    /^(.+?)\s+(?:vs\.?|versus)\s+(.+?)(?:[?.!]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;
    const left = findMentionedPlayers(match[1], allPlayers);
    const right = findMentionedPlayers(match[2], allPlayers);
    if (left.length > 0 && right.length > 0) {
      return mergePlayers(left, right);
    }
  }

  return [];
}

export function isPlayerCompareQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return /\bcompare\b/.test(lower) || /\bvs\.?\b/.test(lower) || /\bversus\b/.test(lower);
}

export function injectRequestedPlayers(
  filteredPlayers: ChatPlayerRow[],
  requestedPlayers: ChatPlayerRow[],
): { players: ChatPlayerRow[]; noteSuffix: string } {
  if (requestedPlayers.length === 0) {
    return { players: filteredPlayers, noteSuffix: "" };
  }
  const before = filteredPlayers.length;
  const merged = mergePlayers(requestedPlayers, filteredPlayers);
  const added = merged.length - before;
  const noteSuffix =
    added > 0 || requestedPlayers.length > 0
      ? ` + ${requestedPlayers.length} requested player(s) pinned`
      : "";
  return { players: merged, noteSuffix };
}

export function formatRequestedPlayersContext(players: ChatPlayerRow[]): string {
  if (players.length === 0) return "";
  const names = players
    .map((p) => `${p.rawData.first_name} ${p.rawData.second_name}`.trim() || p.rawData.web_name)
    .join(", ");
  const rows = players.map((p) => p.formatted).join("\n");
  return `REQUESTED PLAYERS FOR THIS QUESTION (${names}):
The rows below are the exact live FPL data for the player(s) the user asked about. Use them directly. NEVER ask the user to paste player data.
${rows}`;
}

function playerDisplayName(row: ChatPlayerRow): string {
  const full = `${row.rawData.first_name} ${row.rawData.second_name}`.trim();
  return full || row.rawData.web_name;
}

function playerEpNext(row: ChatPlayerRow): number {
  const value = parseFloat(String(row.rawData.ep_next ?? "0"));
  return Number.isFinite(value) ? value : 0;
}

export function isCaptaincyQuery(message: string): boolean {
  return /\bcaptain(s|cy)?\b/i.test(message);
}

/** Players to rank when the user is comparing options or picking a captain. */
export function buildComparisonPool(
  message: string,
  requestedPlayers: ChatPlayerRow[],
  filteredPlayers: ChatPlayerRow[],
): ChatPlayerRow[] {
  if (requestedPlayers.length >= 2) return requestedPlayers;
  if (isPlayerCompareQuery(message) && requestedPlayers.length > 0) {
    return requestedPlayers;
  }
  if (isCaptaincyQuery(message)) {
    return [...filteredPlayers]
      .filter((p) => playerEpNext(p) > 0)
      .sort((a, b) => playerEpNext(b) - playerEpNext(a))
      .slice(0, 12);
  }
  return requestedPlayers.length === 1 ? requestedPlayers : [];
}

export function formatComparisonFactsContext(
  players: ChatPlayerRow[],
  teamFixtures: Record<string, string[]>,
  adviceGwId: number,
): string {
  if (players.length < 2) return "";

  const ranked = [...players].sort((a, b) => playerEpNext(b) - playerEpNext(a));
  const leader = ranked[0];
  const leaderName = playerDisplayName(leader);
  const leaderEp = playerEpNext(leader);

  const lines = ranked.map((p, i) => {
    const team = p.team ?? "?";
    const fixture = teamFixtures[team]?.[0] ?? "TBC";
    const ownership = parseFloat(String(p.rawData.selected_by_percent ?? "0"));
    const form = parseFloat(String(p.rawData.form ?? "0"));
    return `${i + 1}. ${playerDisplayName(p)} (${team}): xPNext=${playerEpNext(p)}, form=${form}, ownership=${ownership}%, next fixture=${fixture}`;
  });

  return `COMPARISON FACTS (Gameweek ${adviceGwId}) - PRE-COMPUTED. TRUST THIS BLOCK FOR RANKINGS:
- xPNext leader here: ${leaderName} at ${leaderEp}. Never call another player the xPNext leader unless their value below is higher.
- Ranked by xPNext (highest first):
${lines.join("\n")}
- You may recommend a lower-xPNext player as the safer template pick because of ownership or form. Say that explicitly. Do NOT claim they lead on xPNext.
- Next-fixture labels above come from TEAM FIXTURE RUNS. Do not substitute opponents from memory.`;
}

export function findMentionedTeamCodes(
  message: string,
  teams: Array<{ name: string; short_name: string }>,
): string[] {
  const messageNorm = normalizeForChatMatch(message);
  const codes: string[] = [];
  for (const team of teams) {
    const nameNorm = normalizeForChatMatch(team.name);
    const shortNorm = normalizeForChatMatch(team.short_name);
    if (
      (nameNorm.length >= 4 && messageNorm.includes(nameNorm)) ||
      (shortNorm.length >= 3 && messageNorm.includes(shortNorm))
    ) {
      codes.push(team.short_name);
    }
  }
  return codes;
}

export function mergePlayers(base: ChatPlayerRow[], extra: ChatPlayerRow[]): ChatPlayerRow[] {
  const seen = new Set(base.map((p) => p.rawData.id));
  const merged = [...base];
  for (const p of extra) {
    if (!seen.has(p.rawData.id)) {
      merged.push(p);
      seen.add(p.rawData.id);
    }
  }
  return merged;
}

export function injectSquadPlayers(
  filteredPlayers: ChatPlayerRow[],
  squadElementIds: number[],
  allPlayers: ChatPlayerRow[],
): { players: ChatPlayerRow[]; noteSuffix: string } {
  if (squadElementIds.length === 0) {
    return { players: filteredPlayers, noteSuffix: "" };
  }
  const squadSet = new Set(squadElementIds);
  const squadPlayers = allPlayers.filter((p) => squadSet.has(p.rawData.id));
  const before = filteredPlayers.length;
  const merged = mergePlayers(filteredPlayers, squadPlayers);
  const added = merged.length - before;
  const noteSuffix = added > 0 ? ` + ${added} squad player(s) from user's team` : "";
  return { players: merged, noteSuffix };
}
