export type ChatModelProfile = "legacy" | "structured";

/**
 * Set CHAT_LLM_MODEL to match the model selected in Dify.
 * - gpt-5-mini (default): legacy formatting and renderer (historical behaviour)
 * - gpt-5.4-mini: structured formatting for models that emit heavy ** / ###
 */
export function getChatModelProfile(): ChatModelProfile {
  const model = (process.env.CHAT_LLM_MODEL || "gpt-5-mini").toLowerCase();
  if (model.includes("5.4") || model.includes("5-4")) return "structured";
  return "legacy";
}

export function getChatModelLabel(): string {
  return process.env.CHAT_LLM_MODEL || "gpt-5-mini";
}
