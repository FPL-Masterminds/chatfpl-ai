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
