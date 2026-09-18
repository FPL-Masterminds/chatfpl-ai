import {
  type FplEventLike,
  type FplFixtureLike,
  resolveSocialCardGameweek,
} from "@/lib/fpl-gw-live-status";

const FPL_HEADERS = { "User-Agent": "ChatFPL/1.0" };

export async function fetchSocialCardGameweek(): Promise<number> {
  try {
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        headers: FPL_HEADERS,
        cache: "no-store",
      }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", {
        headers: FPL_HEADERS,
        cache: "no-store",
      }),
    ]);

    if (!bootstrapRes.ok) return 1;
    const bootstrap = await bootstrapRes.json();
    const events = (bootstrap.events ?? []) as FplEventLike[];
    const fixtures: FplFixtureLike[] = fixturesRes.ok ? await fixturesRes.json() : [];

    return resolveSocialCardGameweek(events, fixtures);
  } catch {
    return 1;
  }
}
