import type { ChatModelProfile } from "@/lib/chat-model-profile";
import {
  normalizeAssistantChatFormatting,
  stripInvalidMarkdownImages,
} from "@/lib/chat-message-format";
import {
  fixAssistantMarkdownPlayerPhotos,
  type FplPhotoRow,
} from "@/lib/fpl-player-photo";

export const EMPTY_ASSISTANT_FALLBACK =
  "Sorry, I hit a glitch and did not return a proper answer that time. Please send the question again. If you were asking for a transfer replacement, name the player you want to sell and I will only suggest same-position options from live FPL data.";

export function postProcessAssistantAnswer(
  rawAnswer: string,
  photoRows: FplPhotoRow[],
  profile: ChatModelProfile,
): string {
  const processed = normalizeAssistantChatFormatting(
    stripInvalidMarkdownImages(
      fixAssistantMarkdownPlayerPhotos(rawAnswer, photoRows)
        .replace(/\u2014/g, " - ")
        .replace(/\u2013/g, " - "),
    ),
    profile,
  );
  return processed.trim() ? processed : EMPTY_ASSISTANT_FALLBACK;
}

/** Collect answer text from Dify SSE events (multiple event shapes). */
export function appendDifyStreamAnswer(evt: any, current: string): string {
  let next = current;
  if (evt.event === "message" || evt.event === "agent_message") {
    const rawChunk: string = evt.answer ?? "";
    const text = rawChunk.replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
    next += text;
    return next;
  }

  if (evt.event === "text_chunk" && typeof evt.data?.text === "string") {
    next += evt.data.text.replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
    return next;
  }

  if (evt.event === "workflow_finished" || evt.event === "node_finished") {
    const outputs = evt.data?.outputs ?? evt.outputs;
    const answer =
      (typeof outputs?.answer === "string" && outputs.answer) ||
      (typeof outputs?.text === "string" && outputs.text) ||
      (typeof evt.data?.text === "string" && evt.data.text) ||
      "";
    if (answer) {
      next += answer.replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
    }
  }

  return next;
}
