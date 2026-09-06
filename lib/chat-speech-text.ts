/** Plain text for browser TTS from assistant markdown. */
export function textForSpeech(content: string): string {
  if (!content.trim()) return ""

  let text = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/[•·]/g, ". ")
    .replace(/^\s*-\s+/gm, ". ")
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/\s+/g, " ")
    .trim()

  const maxChars = 2800
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars).trim()}. The full answer is on screen.`
  }

  return text
}

/** Shorter plain text for local Voicebox TTS (faster generation). */
export function textForVoiceboxSpeech(content: string): string {
  const full = textForSpeech(content)
  if (!full) return ""

  const maxChars = 500
  if (full.length <= maxChars) return full

  const cut = full.slice(0, maxChars)
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "))
  const trimmed = (lastStop > 120 ? cut.slice(0, lastStop + 1) : cut).trim()
  return `${trimmed} The rest of the answer is on screen.`
}
