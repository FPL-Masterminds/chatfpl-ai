import type { SeasonStoryFacts } from "./season-story"

function fnv1a(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Rich seed so each league + user + week gets distinct variant picks. */
export function storySeed(f: SeasonStoryFacts, slot: string, salt = 0): number {
  const key = [
    f.leagueId,
    f.gw,
    slot,
    salt,
    f.user?.entryId ?? 0,
    f.gwWinner.entryId,
    f.leader.entryId,
    f.leagueSize,
    f.beatAvgCount,
    Math.round(f.leagueAvgGwPts),
  ].join("|")
  return fnv1a(key)
}

export function pickFromPool<T>(pool: T[], f: SeasonStoryFacts, slot: string, salt = 0): T {
  if (pool.length === 0) throw new Error(`Empty pool for ${slot}`)
  return pool[storySeed(f, slot, salt) % pool.length]
}

export type StoryLine = (f: SeasonStoryFacts) => string

/** Stitch independent sentence pools for combinatorial variety per league. */
export function composeStory(
  f: SeasonStoryFacts,
  slot: string,
  pools: StoryLine[][]
): string {
  const sentences = pools
    .map((pool, i) => pickFromPool(pool, f, slot, i)(f))
    .filter((s) => s.trim().length > 0)
  return sentences.join(" ")
}
