import type { ChatPlayerRow } from "@/lib/chat-player-filter";

const DEFCON_QUERY_RE =
  /\b(defcon|defensive contribution|defensive_contribution|dc90|dc per 90|actions per 90)\b/i;

export function isDefconQuery(message: string): boolean {
  return DEFCON_QUERY_RE.test(message);
}

function dc90(p: ChatPlayerRow): number {
  return parseFloat(String(p.rawData.defensive_contribution_per_90 ?? 0));
}

function formatLine(p: ChatPlayerRow, rank: number): string {
  const price = (p.rawData.now_cost / 10).toFixed(1);
  const mins = p.rawData.minutes ?? 0;
  const dc = p.rawData.defensive_contribution ?? 0;
  const photo = p.formatted.split("|").pop() ?? "";
  return `${rank}. ${p.rawData.web_name} (${p.position}, ${p.team ?? "?"}, £${price}m, DC90 ${dc90(p).toFixed(2)}, season DC ${dc}, ${mins} min) PhotoURL:${photo}`;
}

/**
 * Pre-ranked DEFCON leaders so the model cannot claim it lacks live rows.
 */
export function formatDefconLeaderboardFacts(
  message: string,
  allPlayers: ChatPlayerRow[],
): string {
  if (!isDefconQuery(message)) return "";

  const wantsDefenders =
    /\b(defenders?|defence|defense|defs)\b/i.test(message) &&
    !/\b(midfielders?|mids)\b/i.test(message);

  const pool = allPlayers.filter((p) => {
    if (p.rawData.minutes < 90) return false;
    if (wantsDefenders) return p.position === "DEF";
    if (/\b(midfielders?|\bmids?\b)\b/i.test(message)) return p.position === "MID";
    return p.position === "DEF" || p.position === "MID";
  });

  const ranked = pool
    .filter((p) => dc90(p) > 0)
    .sort((a, b) => dc90(b) - dc90(a))
    .slice(0, 20);

  if (ranked.length === 0) {
    return `DEFCON LEADERBOARD (server-computed):
No players with DC90 > 0 in the current bootstrap excerpt. Say season minutes may still be low and suggest checking again after more gameweeks.`;
  }

  const scope = wantsDefenders
    ? "defenders (DEF)"
    : /\b(midfielders?|\bmids?\b)\b/i.test(message)
      ? "midfielders (MID)"
      : "defenders and midfielders (DEF/MID)";

  return `DEFCON LEADERBOARD (server-computed, mandatory source of truth):
Ranked by defensive_contribution_per_90 (DC90) for ${scope} with at least 90 minutes this season.
Use ONLY these names, prices, DC90 values, and PhotoURL suffixes in your answer. Do NOT ask the user to paste player rows.
${ranked.map((p, i) => formatLine(p, i + 1)).join("\n")}
`;
}
