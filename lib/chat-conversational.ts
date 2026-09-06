const FPL_QUERY_SIGNAL =
  /\b(captain|transfer|wildcard|free hit|bench boost|triple captain|differential|fixture|fpl|gameweek|gw\d|chip|squad|lineup|price rise|who should i|should i|compare|vs\b|versus|recommend|pick|sell|buy|haaland|salah|palmer|saka|worth it|points per|ownership|clean sheet|defcon|blank|double gameweek|dgw|bgw)\b/i

function normalizeForMatch(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .replace(/[!?.,"']/g, "")
    .replace(/\s+/g, " ")
}

const CONVERSATIONAL_PATTERNS: RegExp[] = [
  /^(no problem|np|not a problem)( thank you| thanks)?$/,
  /^thanks?( you( so much| very much)?)?$/,
  /^thank you( so much| very much)?$/,
  /^cheers$/,
  /^ta$/,
  /^much appreciated$/,
  /^appreciate it$/,
  /^(ok|okay)( thanks?| thank you)?$/,
  /^(great|lovely|brilliant|perfect|awesome|nice one|wicked)( thanks?| thank you)?$/,
  /^(that helps|that helped|that s helpful|that s great|that s perfect)$/,
  /^got it( thanks?| thank you)?$/,
  /^all good$/,
  /^sorted( thanks?| thank you)?$/,
  /^you re welcome$/,
  /^no worries$/,
  /^(hi|hello|hey|hiya|yo|morning|evening)( there)?$/,
  /^(bye|goodbye|see you|see ya|laters|catch you later)$/,
  /^how are you(\s+today)?$/,
  /^what s up$/,
  /^you (ok|alright)(\?)?$/,
  /\b(fancy a|want a|grab a|come for a|up for a)\s+(pint|beer|drink|coffee|cuppa)\b/,
  /\b(go to the pub|down the pub|at the pub)\b/,
  /\b(are you (real|human|alive|a bot|an ai|actually ai))\b/,
  /\b(who (made|built|created) you)\b/,
  /\b(tell me a joke|make me laugh)\b/,
  /\b(love you|marry me|date me)\b/,
  /\b(what do you do for fun|do you sleep|do you eat)\b/,
]

/** Short social / off-topic chat that should not trigger the full FPL data pipeline. */
export function isConversationalMessage(message: string): boolean {
  const normalized = normalizeForMatch(message)
  if (!normalized || normalized.length > 140) return false
  if (FPL_QUERY_SIGNAL.test(normalized)) return false

  if (CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true
  }

  // Short message, no FPL signals, and clearly chatting to the assistant (not asking about players).
  if (
    normalized.length <= 70 &&
    /\b(you|your|u)\b/.test(normalized) &&
    !/\b(player|team|club|defender|midfielder|forward|goalkeeper|gkp|def|mid|fwd)\b/.test(normalized)
  ) {
    return true
  }

  return false
}

export function getConversationalReply(message: string, firstName: string): string {
  const normalized = normalizeForMatch(message)
  const name = firstName || "there"

  if (/\b(fancy a|want a|grab a|come for a|up for a)\s+(pint|beer|drink)/.test(normalized) || /\b(pub)\b/.test(normalized)) {
    return `Ha! I'm flattered, ${name}, but I'm only good for FPL advice, not real pints. Ask me about captaincy, transfers, or fixtures whenever you like.`
  }

  if (/^(hi|hello|hey|hiya|yo|morning|evening)/.test(normalized)) {
    return `Hey ${name}. I'm ChatFPL AI - ask me anything about your team, transfers, captaincy, or fixtures.`
  }

  if (/^(bye|goodbye|see you|see ya|laters)/.test(normalized)) {
    return `Catch you later, ${name}. Good luck with the gameweek.`
  }

  if (/thank|cheers|appreciat|\bta\b/.test(normalized)) {
    return `You're welcome, ${name}. Glad I could help. Ask anytime you want transfer, captaincy, or fixture advice.`
  }

  if (/no problem|no worries|np\b/.test(normalized)) {
    return `Any time, ${name}. I'm here when you need another FPL question answered.`
  }

  if (/\b(are you (real|human|alive|a bot|an ai))\b/.test(normalized) || /\bwho (made|built|created) you\b/.test(normalized)) {
    return `I'm ChatFPL AI, ${name} - built to help with Fantasy Premier League. I don't do general chat, but I'm sharp on squads, chips, and gameweeks.`
  }

  if (/\b(joke|make me laugh)\b/.test(normalized)) {
    return `My best joke is recommending a defender on a blank gameweek. For actual help, ${name}, hit me with a transfer or captain question.`
  }

  if (/\b(love you|marry me|date me)\b/.test(normalized)) {
    return `Charming, ${name}, but I'm married to the FPL API. What do you want to look at - transfers, captain, or differentials?`
  }

  if (/\b(how are you|what s up|you ok|you alright)\b/.test(normalized)) {
    return `All good on my side, ${name}. How's your team looking? Happy to dig into transfers or captaincy if you want.`
  }

  return `I'm here for FPL, ${name}. If you want banter, I'm limited - but captaincy, transfers, and fixtures I'm your guy. What do you want to look at?`
}

export const CONVERSATIONAL_PROMPT_RULES = `CONVERSATIONAL MESSAGES (thanks, greetings, banter, off-topic chat):
- If the user is thanking you, saying hello/goodbye, joking, or chatting off-topic (e.g. drinks, pub, "are you real"), reply in 1-3 short friendly sentences.
- Stay in character as ChatFPL AI. You can be light and human, but steer back to FPL when natural.
- Do not pull in player stats, transfer ideas, or captain picks unless they ask a new FPL question in the same message.
- Do not say you lack data or refuse in a robotic way. Keep it warm.`
