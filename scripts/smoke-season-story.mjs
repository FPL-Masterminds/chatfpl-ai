/**
 * Local smoke test: fetch a real mini-league and generate Season Story chapters.
 * Usage: npx tsx scripts/smoke-season-story.mjs [leagueId] [userEntryId]
 */
import { generateAllSeasonStories } from "../lib/season-story.ts"
import { isGameweekStoryReady } from "../lib/season-story-fixtures.ts"

const H = { "User-Agent": "ChatFPL/1.0" }
const BATCH = 15

const leagueId = Number(process.argv[2] || 98520)
const userEntryId = Number(process.argv[3] || 2695355)

async function fetchHistories(rows) {
  const results = []
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const batchResults = await Promise.all(
      batch.map(async (row) => {
        const r = await fetch(
          `https://fantasy.premierleague.com/api/entry/${row.entry}/history/`,
          { headers: H }
        )
        const hist = r.ok ? await r.json() : null
        return {
          entryId: row.entry,
          team: row.entry_name,
          manager: row.player_name,
          current: hist?.current ?? [],
          chips: hist?.chips ?? [],
        }
      })
    )
    results.push(...batchResults)
  }
  return results
}

const bootstrap = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
  headers: H,
}).then((r) => r.json())
const fixtures = await fetch("https://fantasy.premierleague.com/api/fixtures/", { headers: H }).then(
  (r) => r.json()
)
const leagueData = await fetch(
  `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`,
  { headers: H }
).then((r) => r.json())

const rows = leagueData.standings?.results ?? []
const members = await fetchHistories(rows)

const finishedGws = (bootstrap.events ?? [])
  .filter((e) => isGameweekStoryReady(e.id, e.finished, fixtures))
  .map((e) => ({ gw: e.id, avg: e.average_entry_score ?? 0 }))

console.log("league", leagueData.league?.name, "managers", rows.length)
console.log("finishedGws", finishedGws.map((g) => g.gw))
console.log(
  "members with gw1/2",
  members.filter((m) => m.current.some((c) => c.event === 1)).length,
  members.filter((m) => m.current.some((c) => c.event === 2)).length
)

const stories = generateAllSeasonStories(
  leagueId,
  leagueData.league?.name ?? "League",
  members,
  userEntryId,
  finishedGws
)

console.log("stories", stories.length, stories.map((s) => s.gw))
if (stories[0]) {
  const gw1Winner = stories[0].paragraphs.find((p) => p.slot === "lede")?.text?.slice(0, 120)
  console.log("GW1 lede preview:", gw1Winner)
}
