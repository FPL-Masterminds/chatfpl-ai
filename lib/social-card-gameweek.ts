import {
  type FplEventLike,
  type FplFixtureLike,
  resolveSocialCardGameweek,
} from "@/lib/fpl-gw-live-status";
import { getBootstrapFresh } from "@/lib/fpl-player-page";

const FPL_HEADERS = { "User-Agent": "ChatFPL/1.0" };

function gwFromBootstrap(bootstrap: {
  events?: FplEventLike[];
  fixtures?: FplFixtureLike[];
}): number {
  const events = (bootstrap.events ?? []) as FplEventLike[];
  const fixtures = (bootstrap.fixtures ?? []) as FplFixtureLike[];
  return resolveSocialCardGameweek(events, fixtures);
}

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

    if (bootstrapRes.ok) {
      const bootstrap = await bootstrapRes.json();
      const events = (bootstrap.events ?? []) as FplEventLike[];
      const fixtures: FplFixtureLike[] = fixturesRes.ok ? await fixturesRes.json() : [];
      return resolveSocialCardGameweek(events, fixtures);
    }
  } catch (error) {
    console.error("[fetchSocialCardGameweek] live FPL fetch failed", error);
  }

  try {
    const cached = await getBootstrapFresh();
    return gwFromBootstrap(cached);
  } catch (error) {
    console.error("[fetchSocialCardGameweek] bootstrap fallback failed", error);
  }

  throw new Error("Could not resolve social card gameweek");
}
