export const FPL_TEAM_ID_SETTINGS_URL = "https://www.chatfpl.ai/admin";

export const FPL_TEAM_ID_WHY =
  "Linking your public FPL Team ID is the most reliable way to get personal advice. We pull your live 15, bank, chips, captain, and rank from the official FPL API every message.";

export const FPL_TEAM_ID_PASTE_WARNING =
  "Pasting a squad from the FPL app often drops players, mixes old picks, or loses bank balance, free transfers, and chip status. Context can get lost between messages, which leads to wrong transfer advice.";

export const FPL_TEAM_ID_CHAT_BANNER =
  "Link your FPL Team ID in Settings for reliable squad advice. Pasting 15 players from the app is a fallback only and context can get lost between messages.";

/** Injected on every chat request. ChatFPL cannot receive uploads or images. */
export const CHAT_NO_UPLOADS_RULES = `USER INPUT LIMITS (MANDATORY):
- ChatFPL is TEXT ONLY. Users cannot upload images, screenshots, files, or attachments in chat.
- NEVER ask for a screenshot, screen grab, photo, picture, or image of their team, app, or FPL screen.
- NEVER ask users to upload or send anything visual. We cannot see it.
- For personal squad advice, direct users to link their public FPL Team ID at ${FPL_TEAM_ID_SETTINGS_URL}, or send the numeric Team ID in chat, or paste player names as plain text only as a last resort.`;

export function chatWelcomeMessage(firstName: string, hasFplTeamId: boolean): string {
  const greeting = `Hi ${firstName}! I'm your ChatFPL AI analyst. Ask me about captains, transfers, differentials, fixtures - anything FPL.`;
  if (hasFplTeamId) return greeting;
  return `${greeting}\n\nFor questions about your squad, link your public FPL Team ID in Settings first (${FPL_TEAM_ID_SETTINGS_URL}). It takes about 10 seconds and is much more reliable than pasting players from the app.`;
}

export function buildNoTeamIdPromptNotice(firstName: string, questionPreview: string): string {
  return `

USER_TEAM_LINK_STATUS: NOT LINKED
The user is asking a personal-team question ("${questionPreview}") but has NOT linked their public FPL Team ID, so you do not have access to their squad, rank, transfers, chip status, or per-player picks.
You MUST handle this gracefully:
1. Briefly acknowledge the question in one short sentence.
2. Tell ${firstName} that the best way to get accurate advice is to link their public FPL Team ID at ${FPL_TEAM_ID_SETTINGS_URL}. It takes about 10 seconds, uses only the public ID from their FPL URL, and needs no password.
3. Explain clearly: ${FPL_TEAM_ID_PASTE_WARNING}
4. Only as a last resort, say they can paste their 15-player squad (web names + bank + free transfers + chips) in chat, but strongly recommend Team ID instead because pasted squads are error-prone.
5. They can also send their Team ID number directly in chat (e.g. 8688417) and you will load the squad automatically.
Do NOT invent a generic squad. Do NOT answer with "the average FPL manager would..." dressed up as personal advice. Do NOT recommend specific transfers or captains as if you know their current team. Keep the whole response short and friendly.`;
}

export function buildPastedSquadPromptNotice(firstName: string): string {
  return `

USER_SQUAD_PASTE_DETECTED: The user pasted a squad from the FPL app instead of linking their Team ID.
Before answering:
1. Tell ${firstName} politely that pasted squads are less reliable than linking their Team ID at ${FPL_TEAM_ID_SETTINGS_URL}.
2. Explain: ${FPL_TEAM_ID_PASTE_WARNING}
3. Use only the players explicitly in this paste for "my team" advice. Do not assume players from earlier messages unless they appear again in this paste.
4. If the paste looks incomplete or ambiguous, ask them to link their Team ID or resend the full 15 with bank and free transfers.
Then answer their question from the paste as carefully as you can.`;
}

/** FPL app copy-paste often includes prices, club names, and fixture lines. */
export function looksLikePastedFplSquad(message: string): boolean {
  const priceHits = message.match(/£\d+\.\d+m/gi)?.length ?? 0;
  const fixtureHits = message.match(/fixture:/gi)?.length ?? 0;
  const newlineBlocks = message.split(/\n/).filter((l) => l.trim().length > 2).length;
  return priceHits >= 4 && (fixtureHits >= 2 || newlineBlocks >= 10);
}
