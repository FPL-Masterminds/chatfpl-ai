import { prisma } from "@/lib/prisma";
import { expandAffirmativeFollowUpIfNeeded } from "@/lib/chat-follow-up";

const PROFANITY_RE =
  /\b(fuck(?:ing|ed|er)?|shit|bastard|wanker|twat|bollocks|prick|cunt|bitch|numpty|ripoff|scam|idiot|idio|dolt|moron|stupid|useless)\b/i;

const TRAILING_INSULT_RE =
  /\s*[,.\-!?\s]+(you\s+)?(f+?ucking\s+)?(idiot|idio|numpty|dolt|moron|ripoff|rip\s*off|scam|useless|shit|wanker|twat|stupid|dumbass)(?:\s+\w+){0,3}\s*$/i;

export const CHAT_ABUSE_HANDLING_RULES = `ABUSIVE OR FRUSTRATED USERS (MANDATORY):
- Users may swear, insult you, or vent when advice goes wrong. This is common in FPL chat, especially near deadlines.
- NEVER refuse to answer, go silent, retaliate, or lecture them about language.
- NEVER say you cannot continue until they are respectful, or that their message violated policies.
- Ignore insults completely. Do not repeat them. Do not take them personally.
- Answer the underlying FPL question directly using live data. Fix the mistake if your prior advice was wrong.
- If the message is only an insult with no FPL question, reply in one or two sentences: you are here for FPL help only, and ask what squad, transfer, or captain question they want answered.
- You may use one brief neutral line ("Fair enough - here is the fix.") then get straight to the FPL answer. No sermons.
- Swearing in the user message must NEVER cause you to return an empty response.`;

export type PreparedUserMessage = {
  /** Message sent to the model (insults stripped when possible). */
  modelMessage: string;
  /** Original user text (for DB). */
  originalMessage: string;
  hadAbuse: boolean;
  abuseNotice: string;
};

export function messageLooksAbusive(text: string): boolean {
  return PROFANITY_RE.test(text) || TRAILING_INSULT_RE.test(text);
}

export function stripTrailingInsults(text: string): string {
  let cleaned = text.trim();
  let prev = "";
  while (cleaned !== prev && TRAILING_INSULT_RE.test(cleaned)) {
    prev = cleaned;
    cleaned = cleaned.replace(TRAILING_INSULT_RE, "").trim();
  }
  return cleaned;
}

export async function getLastSubstantiveUserMessage(
  conversationId: string,
): Promise<string | null> {
  const rows = await prisma.message.findMany({
    where: { conversation_id: conversationId, role: "user" },
    orderBy: { timestamp: "desc" },
    take: 6,
    select: { content: true },
  });

  for (const row of rows) {
    const cleaned = stripTrailingInsults(row.content);
    if (cleaned.length >= 12 && !messageLooksAbusive(cleaned)) {
      return cleaned;
    }
    if (cleaned.length >= 20) {
      return cleaned;
    }
  }
  return null;
}

export function buildAbuseHandlingPromptNotice(firstName: string): string {
  return `

USER_FRUSTRATION_DETECTED: ${firstName} may be frustrated or used insults in this message.
- You MUST still produce a full FPL answer. Empty responses are forbidden.
- Ignore the insults. Do not mention moderation or ask them to calm down.
- Focus only on fixing the FPL question (transfers, squad, captaincy, wildcard, etc.).`;
}

export async function prepareUserMessageForModel(
  message: string,
  conversationId?: string | null,
  firstName = "there",
): Promise<PreparedUserMessage> {
  const originalMessage = message;
  const hadAbuse = messageLooksAbusive(message);
  let modelMessage = stripTrailingInsults(message);

  if (
    hadAbuse &&
    modelMessage.length < 12 &&
    conversationId
  ) {
    const prior = await getLastSubstantiveUserMessage(conversationId);
    if (prior) {
      modelMessage = prior;
    }
  }

  if (!modelMessage.trim()) {
    modelMessage = originalMessage.trim();
  }

  const followUpExpanded = await expandAffirmativeFollowUpIfNeeded(
    originalMessage,
    modelMessage,
    conversationId,
  );
  if (followUpExpanded) {
    modelMessage = followUpExpanded;
  }

  const abuseNotice = hadAbuse
    ? buildAbuseHandlingPromptNotice(firstName)
    : "";

  return {
    modelMessage,
    originalMessage,
    hadAbuse,
    abuseNotice,
  };
}

export const FRUSTRATED_USER_EMPTY_FALLBACK =
  "Sorry, I did not return an answer that time. I am here for FPL only. Ask your transfer, captain, or squad question again and I will answer on the live data. Swearing does not block me from helping.";
