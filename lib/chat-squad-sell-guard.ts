import type { ChatPlayerRow } from "@/lib/chat-player-filter";

function sellUrgencyScore(p: ChatPlayerRow): number {
  const mins = Number(p.rawData.minutes ?? 0);
  const status = String(p.rawData.status ?? "a");
  const fit = Number(p.rawData.chance_of_playing_next_round ?? 100);
  const form = parseFloat(String(p.rawData.form ?? 0));
  const xp = parseFloat(String(p.rawData.ep_next ?? 0));

  let score = 0;
  if (status !== "a") score += 50;
  if (fit < 75) score += 20;
  if (mins === 0) score += 25;
  if (form <= 0.5) score += 10;
  if (xp <= 0 && status !== "a") score += 15;
  return score;
}

/**
 * Stops the model recommending sells for players who are not in the linked FPL squad.
 */
export function formatSquadOwnershipGuard(
  squadWebNames: string[],
  squadElementIds: number[],
  allPlayers: ChatPlayerRow[],
  isPersonalTeamQuery: boolean,
): string {
  if (squadWebNames.length === 0) {
    if (!isPersonalTeamQuery) return "";
    return `SQUAD OWNERSHIP GUARD (mandatory):
No FPL Team ID squad is loaded for this user. Do NOT name specific players as "your sell", "your bench problem", or "in your squad" unless the user named them in this message or pasted a squad in this chat.
Give generic FPL advice or ask them to link their public Team ID in Settings.`;
  }

  const squadSet = new Set(squadElementIds);
  const squadPlayers = allPlayers.filter((p) => squadSet.has(p.rawData.id));
  const roster = squadWebNames.join(", ");

  const flagged = squadPlayers
    .map((p) => ({ p, score: sellUrgencyScore(p) }))
    .filter((row) => row.score >= 25)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => {
      const price = (p.rawData.now_cost / 10).toFixed(1);
      return `- ${p.rawData.web_name} (${p.position}, £${price}m, status ${p.rawData.status}, ${p.rawData.minutes ?? 0} min, form ${p.rawData.form}, xPNext ${p.rawData.ep_next})`;
    })
    .join("\n");

  return `SQUAD OWNERSHIP GUARD (server-computed, mandatory - overrides all other player lists):
The user owns EXACTLY these 15 FPL players (web_names): ${roster}
OWNERSHIP IS CLOSED: no other player is in their team for this chat turn.
NEVER recommend selling, transferring out, benching, or captaining anyone not on that list.
NEVER write "he is your clearest sell", "sell him", "What I'd Do: Sell [name]", or "in your squad" for a player whose web_name is not listed above.
If a player appears in FILTERED PLAYER DATA, injury news, or trending transfers but not in this roster, they are NOT owned. Mention them only as transfer IN targets, never as sells.
${flagged ? `Only these owned players have sell/bench red flags in live data (use ONLY this list for sell advice):\n${flagged}` : "No strong automated sell flags in their owned squad; if suggesting moves, ask which roster player they want to change or pick from the 15 web_names only."}
`;
}
