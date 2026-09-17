/** Visible from 17 Sep 2026 (UK) until 6pm 18 Sep (24h from restore at 6pm 17 Sep). */
export const OUTAGE_APOLOGY_WINDOW_START_MS = Date.parse(
  "2026-09-17T17:00:00+01:00",
);
export const OUTAGE_APOLOGY_WINDOW_END_MS = Date.parse(
  "2026-09-18T18:00:00+01:00",
);

export function isOutageApologyWindowActive(now = Date.now()): boolean {
  return (
    now >= OUTAGE_APOLOGY_WINDOW_START_MS && now < OUTAGE_APOLOGY_WINDOW_END_MS
  );
}
