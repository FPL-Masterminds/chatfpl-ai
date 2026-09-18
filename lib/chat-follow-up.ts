import { prisma } from "@/lib/prisma";
import { normalizeForChatMatch, type ChatPlayerRow } from "@/lib/chat-player-filter";

function normalizeForMatch(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .replace(/[!?.,"']/g, "")
    .replace(/\s+/g, " ");
}

const AFFIRMATIVE_FOLLOW_UP_RE =
  /^(yes( please| pls)?|yeah( please| pls)?|yep( please| pls)?|sure( please| pls)?|please|please do|go ahead|go on|do it|do that|sounds good|that would be (great|good|helpful)|ok(ay)?( please| pls)?|absolutely|definitely|100%|for sure)( thanks?| thank you)?$/;

/** Short "yes" style replies that should continue the prior assistant turn, not generic chat. */
export function isAffirmativeFollowUp(message: string): boolean {
  const normalized = normalizeForMatch(message);
  if (!normalized || normalized.length > 80) return false;
  return AFFIRMATIVE_FOLLOW_UP_RE.test(normalized);
}

export async function getLastAssistantMessageContent(
  conversationId: string,
): Promise<string | null> {
  const row = await prisma.message.findFirst({
    where: { conversation_id: conversationId, role: "assistant" },
    orderBy: { timestamp: "desc" },
    select: { content: true },
  });
  const content = row?.content?.trim();
  return content || null;
}

function mentionStrength(text: string, player: ChatPlayerRow): number {
  const norm = normalizeForChatMatch(text);
  if (!norm) return 0;

  let score = 0;
  const web = normalizeForChatMatch(player.rawData.web_name);
  if (web.length >= 3 && norm.includes(web)) {
    score += web.length * 4;
  }
  const full = normalizeForChatMatch(
    `${player.rawData.first_name} ${player.rawData.second_name}`,
  );
  if (full.length >= 5 && norm.includes(full)) {
    score += full.length * 3;
  }
  return score;
}

function positionHintFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(forward|forwards|striker|fwd)\b/.test(lower) && !/\bmidfield/.test(lower)) {
    return "FWD";
  }
  if (/\b(midfielder|midfield|mid)\b/.test(lower) && !/\bforward/.test(lower)) {
    return "MID";
  }
  if (/\b(defender|defence|defense|def)\b/.test(lower)) {
    return "DEF";
  }
  if (/\b(goalkeeper|keeper|gkp)\b/.test(lower)) {
    return "GKP";
  }
  return null;
}

/** Pick the player the thread is actually about (not every loose squad match). */
export function pickThreadFocusPlayer(
  assistantText: string,
  priorUserTexts: string[],
  allPlayers: ChatPlayerRow[],
  _squadElementIds: number[] = [],
): ChatPlayerRow | null {
  const scores = new Map<number, number>();

  for (let i = 0; i < priorUserTexts.length; i++) {
    const text = priorUserTexts[i];
    const weight = 40 + i * 5;
    for (const p of allPlayers) {
      const base = mentionStrength(text, p);
      if (base <= 0) continue;
      scores.set(p.rawData.id, (scores.get(p.rawData.id) ?? 0) + base * weight);
    }
  }

  for (const p of allPlayers) {
    const base = mentionStrength(assistantText, p);
    if (base <= 0) continue;
    scores.set(p.rawData.id, (scores.get(p.rawData.id) ?? 0) + base * 15);
  }

  if (scores.size === 0) return null;

  let candidates = allPlayers.filter((p) => (scores.get(p.rawData.id) ?? 0) > 0);
  const posHint = positionHintFromText(assistantText);
  if (posHint) {
    const filtered = candidates.filter((p) => p.position === posHint);
    if (filtered.length > 0) candidates = filtered;
  }

  candidates.sort(
    (a, b) => (scores.get(b.rawData.id) ?? 0) - (scores.get(a.rawData.id) ?? 0),
  );
  return candidates[0] ?? null;
}

function assistantOffersReplacements(text: string): boolean {
  return /\b(replacements?|instead of|who to get|bring in|transfer in|move on from|best\s+.+\s+at\s+£|give you the best)\b/i.test(
    text,
  );
}

export function buildFollowUpTransferQuery(
  focus: ChatPlayerRow,
  lastAssistant: string,
): string {
  const priceMatches = lastAssistant.match(/£(\d+(?:\.\d+)?)m/gi);
  const cap =
    priceMatches?.[priceMatches.length - 1] ??
    `£${(Number(focus.rawData.now_cost) / 10).toFixed(1)}m`;
  const pos = focus.position ?? "same position";
  return `Who are the best replacements instead of ${focus.rawData.web_name}? Budget ${cap}. Same position ${pos} only.`;
}

export type AffirmativeFollowUpExpansion = {
  modelMessage: string;
  transferQueryMessage: string | null;
  focusPlayer: ChatPlayerRow | null;
};

export function buildAffirmativeFollowUpModelMessage(
  userReply: string,
  lastAssistantContent: string,
  focus: ChatPlayerRow | null,
): string {
  const tail = lastAssistantContent.length > 1600
    ? lastAssistantContent.slice(-1600)
    : lastAssistantContent;

  const focusBlock = focus
    ? `THREAD FOCUS (mandatory): ${focus.rawData.web_name} (${focus.position ?? "unknown position"}, £${(Number(focus.rawData.now_cost) / 10).toFixed(1)}m). The user said yes to your prior offer about THIS player and topic only. Do not switch to other squad players (for example a random midfielder) unless the previous turn was clearly about them.\n\n`
    : "";

  return `FOLLOW-UP ACCEPTANCE: The user is saying yes to something you offered or asked in your previous message. Answer fully now. Do not ask them to repeat the question or say you need more detail.

${focusBlock}User reply: "${userReply.trim()}"

Your previous assistant message (for context):
---
${tail}
---

Deliver exactly what you offered in that message (bench order, vice-captain cover, replacement options, etc.) using their linked FPL squad and the live data in this prompt.`;
}

async function loadFollowUpThreadContext(conversationId: string) {
  const turns = await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { timestamp: "desc" },
    take: 12,
    select: { role: true, content: true },
  });

  const lastAssistant = turns.find((t) => t.role === "assistant")?.content?.trim() ?? "";
  const priorUserTexts = turns
    .filter((t) => t.role === "user")
    .slice(1)
    .map((t) => t.content.trim())
    .filter(Boolean);

  return { lastAssistant, priorUserTexts };
}

export async function expandAffirmativeFollowUpIfNeeded(
  originalMessage: string,
  _currentModelMessage: string,
  conversationId?: string | null,
  allPlayers?: ChatPlayerRow[],
  squadElementIds?: number[],
): Promise<AffirmativeFollowUpExpansion | null> {
  if (!conversationId || !isAffirmativeFollowUp(originalMessage)) {
    return null;
  }

  const { lastAssistant, priorUserTexts } = await loadFollowUpThreadContext(conversationId);
  if (!lastAssistant) {
    return null;
  }

  const focus =
    allPlayers && allPlayers.length > 0
      ? pickThreadFocusPlayer(
          lastAssistant,
          priorUserTexts,
          allPlayers,
          squadElementIds ?? [],
        )
      : null;

  const offersReplacements = assistantOffersReplacements(lastAssistant);
  const transferQueryMessage =
    focus && offersReplacements
      ? buildFollowUpTransferQuery(focus, lastAssistant)
      : null;

  return {
    modelMessage: buildAffirmativeFollowUpModelMessage(
      originalMessage,
      lastAssistant,
      focus,
    ),
    transferQueryMessage,
    focusPlayer: focus,
  };
}

export const FOLLOW_UP_ACCEPTANCE_RULES = `FOLLOW-UP ACCEPTANCE (user said yes / please / go on):
- When the user message is a short acceptance of your prior offer, treat it as a full FPL request. Fulfill the offer from your last turn.
- Never reply with "ask me an FPL question" or "I need more detail" when they already accepted something you proposed.
- Stay on the same player and topic as the previous assistant message. Do not pivot to unrelated squad members.
- Use their linked squad and live data in this prompt.`;
