import { prisma } from "@/lib/prisma";

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

export function buildAffirmativeFollowUpModelMessage(
  userReply: string,
  lastAssistantContent: string,
): string {
  const tail = lastAssistantContent.length > 1600
    ? lastAssistantContent.slice(-1600)
    : lastAssistantContent;

  return `FOLLOW-UP ACCEPTANCE: The user is saying yes to something you offered or asked in your previous message. Answer fully now. Do not ask them to repeat the question or say you need more detail.

User reply: "${userReply.trim()}"

Your previous assistant message (for context):
---
${tail}
---

Deliver what you offered (for example bench order, vice-captain cover, transfer plan, or captain advice) using their linked FPL squad and the live data in this prompt.`;
}

export async function expandAffirmativeFollowUpIfNeeded(
  originalMessage: string,
  currentModelMessage: string,
  conversationId?: string | null,
): Promise<string | null> {
  if (!conversationId || !isAffirmativeFollowUp(originalMessage)) {
    return null;
  }

  const lastAssistant = await getLastAssistantMessageContent(conversationId);
  if (!lastAssistant) {
    return null;
  }

  return buildAffirmativeFollowUpModelMessage(
    originalMessage,
    lastAssistant,
  );
}

export const FOLLOW_UP_ACCEPTANCE_RULES = `FOLLOW-UP ACCEPTANCE (user said yes / please / go on):
- When the user message is a short acceptance of your prior offer, treat it as a full FPL request. Fulfill the offer from your last turn.
- Never reply with "ask me an FPL question" or "I need more detail" when they already accepted something you proposed.
- Use their linked squad and live data in this prompt.`;
