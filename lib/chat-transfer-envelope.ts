import { formatTransferReplacementFacts } from "@/lib/chat-transfer-replacement";
import type { ChatPlayerRow } from "@/lib/chat-player-filter";

export type ChatSquadContext = {
  allPlayers: ChatPlayerRow[];
  squadElementIds: number[];
  squadWebNames: string[];
};

/** Single call site for transfer-replacement facts (used by /api/chat and health smoke). */
export function getTransferReplacementFactsForChat(
  modelUserMessage: string,
  ctx: ChatSquadContext,
): string {
  return formatTransferReplacementFacts(
    modelUserMessage,
    ctx.allPlayers,
    ctx.squadElementIds,
    ctx.squadWebNames,
  );
}
