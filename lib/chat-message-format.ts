import type { ChatModelProfile } from "@/lib/chat-model-profile";
import { isFplPlayerPhotoUrl } from "@/lib/fpl-player-photo";

export function normalizeAssistantChatFormatting(
  text: string,
  profile: ChatModelProfile = "legacy",
): string {
  if (profile !== "structured") return text;
  return text
    .replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n");
}

/** Remove markdown images the model invented for Reddit threads, emojis, or other non-player content. */
export function stripInvalidMarkdownImages(text: string): string {
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, _alt: string, url: string) => {
    if (isFplPlayerPhotoUrl(url)) return full;
    return "";
  });
}

const REDDIT_FORMATTING_RULES = `REDDIT FORMATTING (when summarising r/FantasyPL or community sentiment):
- NEVER use ![...](...) images for Reddit post titles, thread names, topics, or section headers. Images are ONLY for FPL players from LIVE FPL DATA.
- Format each Reddit thread as: plain title line (post title exactly as fetched), blank line, then 1-3 bullet points (• or -) with your summary.
- Example:
  Kneejerk Price Rise Central
  • Community is watching early price movers after the GW3 deadline.
  • Several threads debate whether rises are justified or knee-jerk.
- Do NOT prefix Reddit titles with photos, icons, or decorative markdown.`;

export const LEGACY_CHAT_FORMATTING_RULES = `FORMATTING RULES:
- Format your response with clear paragraphs separated by TWO blank lines
- Use bullet points (•) for lists and multiple items
- Add a blank line between each major section or topic
- Use hyphens ( - ) not em-dashes. This is mandatory.
- Keep each paragraph short (2-3 sentences max)
- IMPORTANT: When mentioning a player, ALWAYS include their photo using: ![Full Name Exactly As In Data](PhotoURL)
- PhotoURL MUST be copied character-for-character from the end of that player's row in LIVE FPL DATA (final field after the last |). Never invent, shorten, or alter the URL.
- Example shape: "![Mohamed Salah](PASTE_EXACT_PhotoURL_FROM_ROW) Mohamed Salah is in great form..."
${REDDIT_FORMATTING_RULES}`;

export const STRUCTURED_CHAT_FORMATTING_RULES = `FORMATTING RULES (plain text UI - do not use ** or ###):
- NEVER use **bold** or ### headers. They show as literal asterisks and hashes in the chat UI.
- Use short section titles as a plain line in Title Case, then a blank line.
- Use bullet points (•) for lists.
- Add a blank line between major sections.
- LENGTH: Match the depth the question needs. Simple questions can be concise. Team analyses, transfer plans, captaincy breakdowns, and player comparisons should be thorough - use as many bullets and paragraphs as needed. Do not artificially shorten a squad review.
- PLAYER PHOTOS (mandatory layout - same as gpt-5-mini):
  • ![Full Name Exactly As In Data](PhotoURL) Full Name - £X.Xm
  Put the photo, full name, hyphen, and price from LIVE FPL DATA all on ONE line. Never output a photo without the name and price on that same line.
  Then put your analysis on the next line(s), e.g. "- Why - ..." for transfer targets.
  Example:
  • ![Adrien Truffert](PhotoURL) Adrien Truffert - £4.7m
  - Why - Bournemouth have a strong run and he offers attacking upside from full-back.
- NEVER embed a photo in the middle of a sentence.
- PhotoURL MUST be copied character-for-character from the end of that player's row in LIVE FPL DATA.
- LIVE FPL DATA is injected server-side. NEVER ask the user to paste player rows or PhotoURLs.
- Use hyphens ( - ) not em-dashes.
${REDDIT_FORMATTING_RULES}`;

export function getChatFormattingRules(profile: ChatModelProfile): string {
  return profile === "structured"
    ? STRUCTURED_CHAT_FORMATTING_RULES
    : LEGACY_CHAT_FORMATTING_RULES;
}
