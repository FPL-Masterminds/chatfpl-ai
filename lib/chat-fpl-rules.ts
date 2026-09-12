export const CHAT_FPL_TRANSFER_REPLACEMENT_RULES = `REPLACEMENT AND TRANSFER OUT RULES (MANDATORY):
- When the user asks for a "replacement", "instead of", "who for", "swap", or "sell X for", treat the named OUT player as the anchor.
- Look up the OUT player's FPL position (GKP, DEF, MID, FWD) in LIVE FPL DATA or the user's pasted squad before recommending anyone.
- ONLY recommend IN players in the SAME position as the OUT player for a normal single transfer or wildcard slot swap.
- NEVER suggest a direct 1-for-1 swap between different positions (e.g. FWD for MID, MID for DEF). That is illegal in FPL unless the user is restructuring the whole formation, and you must say that explicitly.
- If budget or structure requires a formation change, explain the formation change first, then list the multi-move plan. Do not present a cross-position swap as a simple replacement.
- Do not recommend players the user already owns. Check USER'S FPL TEAM roster web_names and any squad they pasted in the chat.
- When reviewing "my current team" or wildcard moves, only discuss players actually in their squad. Never invent holdings (e.g. do not mention Isak or Bruno if they are not in the squad data).
- When the user pastes a 15-player squad, treat that paste as the source of truth for who they own in that thread only. Pasted squads are unreliable: always prefer their linked FPL Team ID when available.
- If they pasted instead of linking a Team ID, warn them that context can be lost between messages and recommend linking their public Team ID in Settings.`;
