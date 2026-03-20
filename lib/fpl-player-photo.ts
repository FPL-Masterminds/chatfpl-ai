/**
 * Official FPL headshots on Premier League CDN.
 * Season folder changes each campaign — override with FPL_PLAYER_PHOTO_BASE if needed.
 */
export function getFplPlayerPhotoBase(): string {
  const fromEnv = process.env.FPL_PLAYER_PHOTO_BASE?.trim().replace(/\/$/, "");
  return (
    fromEnv ||
    "https://resources.premierleague.com/premierleague25/photos/players/110x140"
  );
}

/** Build PNG URL from bootstrap `elements[].photo` (e.g. "154561.jpg") or numeric `code`. */
export function fplPhotoUrlFromElement(photo: string | undefined, code: number | undefined): string {
  const base = getFplPlayerPhotoBase();
  const stripped = String(photo || "")
    .replace(/\.(jpg|jpeg|png)$/i, "")
    .trim();
  const id = stripped || (code != null ? String(code) : "");
  if (!id) return "";
  return `${base}/${id}.png`;
}

export type FplPhotoRow = {
  web_name: string;
  first_name: string;
  second_name: string;
  photoUrl: string;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** How well alt text matches this player (higher = better). */
function scoreAltToRow(altNorm: string, row: FplPhotoRow): number {
  const full = normalize(`${row.first_name} ${row.second_name}`);
  const web = normalize(row.web_name);
  const last = normalize(row.second_name);
  const first = normalize(row.first_name);

  if (!altNorm || altNorm.length < 2) return 0;

  if (altNorm === full) return 100;
  if (altNorm === web) return 98;
  if (altNorm === `${first} ${last}`) return 100;

  if (altNorm.startsWith(first) && altNorm.endsWith(last) && last.length > 2) return 96;
  if (altNorm.includes(first) && altNorm.includes(last) && last.length > 2) return 92;

  // Last name only is ambiguous (e.g. several "Pereira") — low score
  if (altNorm === last) return 35;

  return 0;
}

function bestPhotoRowForAlt(alt: string, rows: FplPhotoRow[]): FplPhotoRow | null {
  const altNorm = normalize(alt);
  let best: { row: FplPhotoRow; score: number } | null = null;

  for (const row of rows) {
    const s = scoreAltToRow(altNorm, row);
    if (s > (best?.score ?? 0)) best = { row, score: s };
  }

  if (!best) return null;

  // Require strong match unless unambiguous single last-name hit
  if (best.score >= 90) return best.row;

  if (best.score >= 35 && best.score < 90) {
    const last = normalize(best.row.second_name);
    const sameLast = rows.filter((r) => normalize(r.second_name) === last);
    if (sameLast.length === 1) return best.row;
    return null;
  }

  return null;
}

/**
 * Rewrite ![alt](url) in model output so URLs always match live FPL headshots when alt text identifies a player.
 * Fixes broken images when the LLM guesses wrong asset IDs or paths.
 */
export function fixAssistantMarkdownPlayerPhotos(
  answer: string,
  rows: FplPhotoRow[]
): string {
  if (!answer || !rows.length) return answer;

  return answer.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string) => {
    const row = bestPhotoRowForAlt(alt, rows);
    if (!row?.photoUrl) return full;
    return `![${alt}](${row.photoUrl})`;
  });
}
