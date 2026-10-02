/**
 * When PL premierleague25 CDN serves the wrong face for a bootstrap `code`
 * (HTTP 200 but not that player), map FPL element id -> verified headshot URL.
 * Add entries after human check; remove when PL fixes the CDN asset.
 */
export const FPL_HEADSHOT_OVERRIDES_BY_ELEMENT_ID: Readonly<Record<number, string>> = {
  // Pascal Struijk (328): code 222694 PNG is Pascal Groß on PL CDN (Oct 2026).
  328: "/fpl-headshots/328.jpg",
};

export function fplHeadshotOverrideUrl(elementId: number | undefined | null): string | null {
  if (elementId == null || elementId <= 0) return null;
  const path = FPL_HEADSHOT_OVERRIDES_BY_ELEMENT_ID[elementId];
  return path ?? null;
}
