import { isFplPlayerPhotoUrl } from "@/lib/fpl-player-photo"

/** Plain text for sharing assistant replies (no chat links, no markdown). */
export function textForShare(content: string): string {
  if (!content.trim()) return ""

  let text = content
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, url: string) => {
      if (isFplPlayerPhotoUrl(url)) {
        const label = String(alt || "Player").trim()
        return label ? `${label}: ${url}` : url
      }
      return ""
    })
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/[•·]/g, "- ")
    .replace(/^\s*-\s+/gm, "- ")
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const footer = "\n\nShared from ChatFPL AI (https://www.chatfpl.ai)"
  const maxChars = 6000
  if (text.length + footer.length > maxChars) {
    text = `${text.slice(0, maxChars - footer.length).trim()}...`
  }

  return `${text}${footer}`
}
