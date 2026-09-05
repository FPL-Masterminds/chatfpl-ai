/**
 * Quick sanity check: Season Story must use per-GW points from entry history,
 * not league standings event_total (which is always the live GW).
 */
import {
  buildProvisionalPreviewMembers,
  mergeLiveGwFromStandings,
} from "../lib/season-story-members.ts"

const standingsGw3 = [
  {
    entry: 1,
    entry_name: "Alpha FC",
    player_name: "Alice",
    total: 131,
    event_total: 25,
    points_on_bench: 4,
  },
  {
    entry: 2,
    entry_name: "Beta United",
    player_name: "Bob",
    total: 118,
    event_total: 18,
    points_on_bench: 2,
  },
]

const fullHistory = [
  {
    entryId: 1,
    team: "Alpha FC",
    manager: "Alice",
    current: [
      { event: 1, points: 50, total_points: 50, points_on_bench: 3 },
      { event: 2, points: 56, total_points: 106, points_on_bench: 5 },
      { event: 3, points: 25, total_points: 131, points_on_bench: 4 },
    ],
    chips: [],
  },
  {
    entryId: 2,
    team: "Beta United",
    manager: "Bob",
    current: [
      { event: 1, points: 44, total_points: 44, points_on_bench: 1 },
      { event: 2, points: 56, total_points: 100, points_on_bench: 2 },
      { event: 3, points: 18, total_points: 118, points_on_bench: 2 },
    ],
    chips: [],
  },
]

const snapshots = new Map([
  [
    1,
    {
      chips: [],
      gwRow: { event: 1, points: 50, total_points: 50, points_on_bench: 3 },
    },
  ],
  [
    2,
    {
      chips: [],
      gwRow: { event: 1, points: 44, total_points: 44, points_on_bench: 1 },
    },
  ],
])

const goodPreview = buildProvisionalPreviewMembers(standingsGw3, 1, snapshots)
if (goodPreview[0]?.current[0]?.points !== 50) {
  console.error("FAIL preview should use history points", goodPreview[0]?.current[0]?.points)
  process.exit(1)
}

const merged = mergeLiveGwFromStandings(fullHistory, standingsGw3, 3)
const gw3 = merged[0].current.find((c) => c.event === 3)
if (!gw3 || gw3.points !== 25) {
  console.error("FAIL live merge GW3 points", gw3?.points)
  process.exit(1)
}

const gw1AfterMerge = merged[0].current.find((c) => c.event === 1)
if (!gw1AfterMerge || gw1AfterMerge.points !== 50) {
  console.error("FAIL GW1 corrupted after live merge", gw1AfterMerge?.points)
  process.exit(1)
}

console.log("OK season story score checks passed")
