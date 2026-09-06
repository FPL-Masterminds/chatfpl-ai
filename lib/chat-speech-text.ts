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
