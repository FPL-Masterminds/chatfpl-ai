/**
 * One-click prompts that need the user's linked FPL squad (not in the generic pool).
 */

type BootstrapElement = {
  id: number;
  web_name: string;
  now_cost: number;
  total_points: number;
  ep_next: string;
  selected_by_percent: string;
  status: string;
  minutes: number;
  element_type: number;
};

const MIN_OWNERSHIP_PCT = 8;
const MIN_PRICE_TENTHS = 75; // £7.5m+
const MAX_CANDIDATES = 40;

function parseNum(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  const n = parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Suggest a -4 hit prompt for a template-ish asset the user does not own.
 */
export function buildHitTransferSuggestionPrompt(
  squadElementIds: Set<number>,
  elements: BootstrapElement[],
): string | null {
  const candidates = elements
    .filter((p) => !squadElementIds.has(p.id))
    .filter((p) => p.status === "a")
    .filter((p) => p.minutes >= 360)
    .filter((p) => p.element_type === 3 || p.element_type === 4) // MID or FWD
    .filter((p) => p.now_cost >= MIN_PRICE_TENTHS)
    .filter((p) => parseNum(p.selected_by_percent) >= MIN_OWNERSHIP_PCT)
    .sort((a, b) => {
      const epDiff = parseNum(b.ep_next) - parseNum(a.ep_next);
      if (epDiff !== 0) return epDiff;
      return parseNum(b.selected_by_percent) - parseNum(a.selected_by_percent);
    })
    .slice(0, MAX_CANDIDATES);

  const pick =
    candidates.find((p) => parseNum(p.ep_next) >= 5) ??
    candidates[0] ??
    null;

  if (!pick?.web_name) return null;
  return `Should I take a -4 to bring in ${pick.web_name}?`;
}
