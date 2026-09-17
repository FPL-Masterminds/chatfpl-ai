import {
  findMentionedPlayers,
  type ChatPlayerRow,
} from "@/lib/chat-player-filter";

const SELL_OR_HOLDING_RE =
  /\b(sell|transfer\s+out|transferring\s+out|dump|move\s+on\s+from|bench|drop|your\s+clearest\s+sell|weakest\s+in\s+your\s+squad|dead\s+weight|in\s+your\s+squad|you\s+own|your\s+holdings?|your\s+bench\s+problem)\b/i;

function ownedSet(squadWebNames: string[]): Set<string> {
  return new Set(squadWebNames.map((n) => n.toLowerCase()));
}

function chunkImpliesPersonalHolding(chunk: string): boolean {
  return SELL_OR_HOLDING_RE.test(chunk);
}

function unownedMentionedInChunk(
  chunk: string,
  allPlayers: ChatPlayerRow[],
  owned: Set<string>,
): string[] {
  const mentioned = findMentionedPlayers(chunk, allPlayers, []);
  const bad: string[] = [];
  for (const p of mentioned) {
    const name = p.rawData.web_name;
    if (!owned.has(name.toLowerCase())) bad.push(name);
  }
  return bad;
}

/**
 * Removes paragraphs that tell the user to sell/bench players they do not own.
 */
export function enforceSquadOwnershipOnAnswer(
  answer: string,
  squadWebNames: string[],
  allPlayers: ChatPlayerRow[],
): string {
  if (!answer.trim() || squadWebNames.length === 0 || allPlayers.length === 0) {
    return answer;
  }

  const owned = ownedSet(squadWebNames);
  const chunks = answer.split(/\n{2,}/);
  const kept: string[] = [];
  const strippedNames: string[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (!chunkImpliesPersonalHolding(trimmed)) {
      kept.push(trimmed);
      continue;
    }

    const bad = unownedMentionedInChunk(trimmed, allPlayers, owned);
    if (bad.length === 0) {
      kept.push(trimmed);
      continue;
    }

    strippedNames.push(...bad);
  }

  if (strippedNames.length === 0) return answer;

  const unique = [...new Set(strippedNames)];
  const roster = squadWebNames.join(", ");
  const notice =
    `Important: I can only recommend sells or bench moves for your linked FPL squad (${roster}). ` +
    `I removed advice about ${unique.join(", ")} because they are not in that squad.\n\n`;

  const body = kept.join("\n\n").trim();
  if (!body) {
    return (
      notice +
      "Ask me to review your team again and I will only discuss players from your linked Team ID."
    );
  }

  return notice + body;
}
