const FPL_QUERY_SIGNAL =
  /\b(captain|transfer|wildcard|free hit|bench boost|triple captain|differential|fixture|fpl|gameweek|gw\d|chip|squad|lineup|price rise|who should i|should i|compare|vs\b|versus|recommend|pick|sell|buy|haaland|salah|palmer|saka)\b/i

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
]

export function isConversationalMessage(message: string): boolean {
  const normalized = normalizeForMatch(message)
  if (!normalized || normalized.length > 100) return false
  if (FPL_QUERY_SIGNAL.test(normalized)) return false
  return CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function getConversationalReply(message: string, firstName: string): string {
  const normalized = normalizeForMatch(message)
  const name = firstName || "there"

  if (/thank|cheers|appreciat|\bta\b/.test(normalized)) {
    return `You're welcome, ${name}. Glad I could help. Ask anytime you want transfer, captaincy, or fixture advice.`
  }

  if (/no problem|no worries|np\b/.test(normalized)) {
    return `Any time, ${name}. I'm here when you need another FPL question answered.`
  }

  return `Happy to help, ${name}. Just ask when you want to dig into your team or the gameweek.`
}

export const CONVERSATIONAL_PROMPT_RULES = `CONVERSATIONAL MESSAGES (thanks, cheers, acknowledgements):
- If the user is only thanking you, saying goodbye, or acknowledging help, reply in 1-2 short friendly sentences.
- Do not pull in player stats, transfer ideas, or captain picks unless they ask a new FPL question in the same message.
- Do not say you lack data or cannot help. Keep it warm and human.`
