import {
  findMentionedPlayers,
  normalizeForChatMatch,
  type ChatPlayerRow,
} from "@/lib/chat-player-filter";

const REPLACEMENT_QUERY_RE =
  /\b(replacement|instead of|who for|swap|sell|replace|alternative to|who instead of|transfer out|move on from|dump)\b/i;

const OUT_PLAYER_PATTERNS = [
  /\binstead of\s+(.+?)(?:\?|\.|$)/i,
  /\breplacement for\s+(.+?)(?:\?|\.|$)/i,
  /\bwho\s+(?:for|instead of)\s+(.+?)(?:\?|\.|$)/i,
  /\breplace\s+(.+?)(?:\?|\.|$)/i,
  /\bsell\s+(.+?)(?:\?|\.|$)/i,
  /\bmove on from\s+(.+?)(?:\?|\.|$)/i,
  /\balternative to\s+(.+?)(?:\?|\.|$)/i,
];

export function isTransferReplacementQuery(message: string): boolean {
  if (message.includes("FOLLOW-UP ACCEPTANCE:")) {
    return false;
  }
  return REPLACEMENT_QUERY_RE.test(message);
}

function scorePlayerInMessage(message: string, player: ChatPlayerRow): number {
  const norm = normalizeForChatMatch(message);
  if (!norm) return 0;
  let score = 0;
  const web = normalizeForChatMatch(player.rawData.web_name);
  if (web.length >= 3 && norm.includes(web)) score += web.length * 4;
  const full = normalizeForChatMatch(
    `${player.rawData.first_name} ${player.rawData.second_name}`,
  );
  if (full.length >= 5 && norm.includes(full)) score += full.length * 3;
  return score;
}

function pickBestMentionedPlayer(
  message: string,
  mentioned: ChatPlayerRow[],
  squadElementIds: number[],
): ChatPlayerRow | null {
  if (mentioned.length === 0) return null;
  if (mentioned.length === 1) return mentioned[0];

  const squadSet = new Set(squadElementIds);
  const ranked = [...mentioned].sort(
    (a, b) => scorePlayerInMessage(message, b) - scorePlayerInMessage(message, a),
  );

  const squadHits = ranked.filter((p) => squadSet.has(p.rawData.id));
  if (squadHits.length === 1) return squadHits[0];
  if (squadHits.length > 1) {
    return squadHits.sort(
      (a, b) => scorePlayerInMessage(message, b) - scorePlayerInMessage(message, a),
    )[0];
  }
  return ranked[0];
}

function extractOutPlayerPhrase(message: string): string | null {
  for (const pattern of OUT_PLAYER_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim().replace(/\s+(you\s+)?(idiot|please).*$/i, "").trim();
    }
  }
  return null;
}

export function findTransferOutPlayer(
  message: string,
  allPlayers: ChatPlayerRow[],
  squadElementIds: number[] = [],
): ChatPlayerRow | null {
  const phrase = extractOutPlayerPhrase(message);
  if (phrase) {
    const fromPhrase = findMentionedPlayers(phrase, allPlayers, squadElementIds);
    if (fromPhrase.length === 1) return fromPhrase[0];
    if (fromPhrase.length > 1 && squadElementIds.length) {
      const inSquad = fromPhrase.find((p) => squadElementIds.includes(p.rawData.id));
      if (inSquad) return inSquad;
    }
    if (fromPhrase.length > 0) return fromPhrase[0];
  }

  if (!isTransferReplacementQuery(message)) return null;

  const mentioned = findMentionedPlayers(message, allPlayers, squadElementIds);
  return pickBestMentionedPlayer(message, mentioned, squadElementIds);
}

export function formatTransferReplacementFacts(
  message: string,
  allPlayers: ChatPlayerRow[],
  squadElementIds: number[],
  squadWebNames: string[],
): string {
  if (!isTransferReplacementQuery(message)) return "";

  const outPlayer = findTransferOutPlayer(message, allPlayers, squadElementIds);
  if (!outPlayer?.position) return "";

  const squadSet = new Set(squadElementIds);
  const ownedList =
    squadWebNames.length > 0
      ? squadWebNames.join(", ")
      : squadElementIds.length
        ? "(linked squad)"
        : "(unknown - prefer linked Team ID)";

  const samePositionPool = allPlayers
    .filter(
      (p) =>
        p.position === outPlayer.position &&
        !squadSet.has(p.rawData.id) &&
        p.rawData.status === "a",
    )
    .filter((p) => parseFloat(String(p.rawData.ep_next ?? 0)) > 0)
    .sort(
      (a, b) =>
        parseFloat(String(b.rawData.ep_next ?? 0)) -
        parseFloat(String(a.rawData.ep_next ?? 0)),
    )
    .slice(0, 25);

  const candidateLines = samePositionPool
    .map(
      (p) =>
        `- ${p.rawData.web_name} (${p.position}, £${(p.rawData.now_cost / 10).toFixed(1)}m, xPNext ${p.rawData.ep_next})`,
    )
    .join("\n");

  return `TRANSFER REPLACEMENT FACTS (server-computed, mandatory):
OUT player: ${outPlayer.rawData.web_name} (${outPlayer.position})
RULE: Recommend only ${outPlayer.position} players as direct IN replacements for ${outPlayer.rawData.web_name}. A MID cannot replace a FWD, etc., unless you explicitly describe a multi-move formation change.
User already owns: ${ownedList}
NEVER recommend any owned player as a transfer IN option.
Same-position IN pool (not in user's squad, top xPNext):
${candidateLines || `(none found in live data - say so and suggest another ${outPlayer.position} search)`}
`;
}
