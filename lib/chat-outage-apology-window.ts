/** 6pm UK, 17 Sep 2026 through 6pm UK, 18 Sep 2026 (24h). */
export const OUTAGE_APOLOGY_WINDOW_START_MS = Date.parse(
  "2026-09-17T18:00:00+01:00",
);
export const OUTAGE_APOLOGY_WINDOW_END_MS = Date.parse(
  "2026-09-18T18:00:00+01:00",
);

export function isOutageApologyWindowActive(now = Date.now()): boolean {
  return (
    now >= OUTAGE_APOLOGY_WINDOW_START_MS && now < OUTAGE_APOLOGY_WINDOW_END_MS
  );
}
