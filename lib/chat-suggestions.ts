import { getComparisonHub } from "@/lib/fpl-comparison"

/** Pick a comparison prompt from the same eligible pool as /fpl/comparisons. */
export async function pickComparisonPrompt(): Promise<string | null> {
  const hub = await getComparisonHub()
  if (!hub?.pairs.length) return null

  const pool = hub.pairs.slice(0, 12)
  const pair = pool[Math.floor(Math.random() * pool.length)]
  return `Compare ${pair.nameA} vs ${pair.nameB}`
}
