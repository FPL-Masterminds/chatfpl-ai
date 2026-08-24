import type { SeasonStoryFacts } from "./season-story"
import {
  gwName,
  pts,
  ord,
  gwsRemaining,
  spellN,
  sanitizeParagraph,
  isFirstGameweek,
  fplAvgComparisonShort,
  benchMentionMinPts,
  spoonRacePrefix,
  mgr,
  mgrTeam,
} from "./season-story-copy"
import { pickFromPool, composeStory, type StoryLine } from "./season-story-seed"
import {
  poolLedeGW1,
  poolLedeLater,
  poolStandingsGW1,
  poolStandingsLater,
  poolPodiumGW1,
  poolPersonalGW1,
  poolSpoonGW1,
  poolCodaGW1,
  poolPersonality,
} from "./season-story-pools"

type Tpl = (f: SeasonStoryFacts) => string

function wrap(templates: Tpl[]): Tpl[] {
  return templates.map((t) => (f) => sanitizeParagraph(t(f)))
}

function rivalGapPhrase(f: SeasonStoryFacts): string {
  if (!f.user || !f.directRival) return ""
  const gap = Math.abs(f.directRival.totalPts - f.user.totalPts)
  if (gap === 0) return `level with you on points`
  return f.directRival.totalPts > f.user.totalPts
    ? `${pts(gap)} ahead of you`
    : `${pts(gap)} behind you`
}

// ─── 1. Lede (composed pools) ────────────────────────────────────────────────

const LEDE_GW1: Tpl[] = [(f) => poolLedeGW1(f)]
const LEDE_LATER: Tpl[] = [(f) => poolLedeLater(f)]

// ─── 2. Standings (composed pools) ───────────────────────────────────────────

const STANDINGS_GW1: Tpl[] = [(f) => poolStandingsGW1(f)]
const STANDINGS_LATER: Tpl[] = [(f) => poolStandingsLater(f)]

// ─── 3. Podium ───────────────────────────────────────────────────────────────

const PODIUM_GW1: Tpl[] = [(f) => poolPodiumGW1(f)]

const PODIUM_LATER: Tpl[] = [
  (f) => {
    if (f.podiumJoined.length === 0 && f.podiumDropped.length === 0) {
      return sanitizeParagraph(composeStory(f, "podium", [
        [(ff) => `The top three held firm: ${ff.podium.map((p) => p.team).join(", ")}.`],
        [(ff) => `That kind of stability at the summit is valuable in a long mini-league season.`],
        [(ff) => `No new names broke into the podium places in ${gwName(ff.gw)}.`],
      ]))
    }
    const joined = f.podiumJoined.map((p) => p.team).join(", ")
    const dropped = f.podiumDropped.map((p) => p.team).join(", ")
    return sanitizeParagraph(composeStory(f, "podium", [
      [
        () => `The podium changed hands in ${gwName(f.gw)}.`,
        () => `There was movement at the sharp end in ${gwName(f.gw)}.`,
        () => `The top three reshuffled in ${gwName(f.gw)}.`,
        () => `Podium places were up for grabs in ${gwName(f.gw)}.`,
      ],
      [
        () => joined ? `${joined} joined the top three.` : "",
        () => dropped ? `${dropped} dropped out of the podium places.` : "",
        () => joined ? `${joined} climbed into the podium.` : dropped ? `${dropped} fell out of the top three.` : "",
      ],
      [
        (ff) => `The current top three reads ${ff.podium.map((p) => `${p.team} (${p.totalPts})`).join(", ")}.`,
        (ff) => `The new podium line is ${ff.podium.map((p, i) => `${ord(i + 1)} ${p.team}`).join(", ")}.`,
        (ff) => `The summit trio is now ${ff.podium.map((p) => p.team).join(", ")}.`,
      ],
    ]))
  },
  (f) => {
    const top3 = f.podium.map((p, i) => `${ord(i + 1)}: ${p.team}`).join("; ")
    if (f.podiumJoined.length > 0 || f.podiumDropped.length > 0) {
      return sanitizeParagraph(pickFromPool([
        (ff) => `Podium shuffle: ${ff.podiumDropped.map((p) => p.team).join(", ") || "nobody"} fell out of the top three, while ${ff.podiumJoined.map((p) => p.team).join(", ") || "nobody"} climbed into it. The new podium line is ${top3}.`,
        (ff) => `The top three turned over in ${gwName(ff.gw)}. Out: ${ff.podiumDropped.map((p) => p.team).join(", ") || "nobody"}. In: ${ff.podiumJoined.map((p) => p.team).join(", ") || "nobody"}. The podium now reads ${top3}.`,
        (ff) => `Fresh faces at the summit: ${ff.podiumJoined.map((p) => p.team).join(", ") || "none"} joined the podium after ${ff.podiumDropped.map((p) => p.team).join(", ") || "nobody"} dropped out. Current line: ${top3}.`,
      ], f, "podium", 0)(f))
    }
    return sanitizeParagraph(pickFromPool([
      (ff) => `The podium places are ${top3}. No change at the very top this week.`,
      (ff) => `The top three held: ${top3}. Stability at the summit.`,
      (ff) => `Same podium, same order: ${top3}.`,
    ], f, "podium", 1)(f))
  },
]

// ─── 4. Movement (GW4+) ──────────────────────────────────────────────────────

function movementBody(f: SeasonStoryFacts): string {
  let line = ""
  if (f.biggestClimber && f.biggestClimber.rankChange >= 2) {
    line += `${f.biggestClimber.team} climbed ${spellN(f.biggestClimber.rankChange)} places to ${ord(f.biggestClimber.rank)}. `
  }
  if (f.biggestFaller && f.biggestFaller.rankChange >= 2) {
    line += `${f.biggestFaller.team} fell ${spellN(f.biggestFaller.rankChange)} places to ${ord(f.biggestFaller.rank)}. `
  }
  return line.trim()
}

const MOVEMENT_INTRO: StoryLine[] = [
  (f) => movementBody(f) ? `The ladder moved in ${gwName(f.gw)}.` : `League positions were relatively stable in ${gwName(f.gw)}.`,
  (f) => movementBody(f) ? `There was meaningful movement up and down the table.` : `This was a quiet week on the rank chart.`,
  (f) => movementBody(f) ? `The ${f.leagueName} table saw notable shifts.` : `Nobody made a dramatic leap in ${f.leagueName} this week.`,
  (f) => movementBody(f) ? `Rank changes defined the week in ${f.leagueName}.` : `Positions held fairly steady across ${f.leagueName}.`,
  (f) => movementBody(f) ? `The pecking order shifted in ${gwName(f.gw)}.` : `The pecking order barely budged in ${gwName(f.gw)}.`,
  (f) => movementBody(f) ? `Mini-league momentum swung on rank changes.` : `A calm week on the league ladder.`,
  (f) => movementBody(f) ? `Some managers climbed. Others slipped.` : `The table stayed largely intact.`,
  (f) => movementBody(f) ? `Movement mattered in ${gwName(f.gw)}.` : `Stability ruled the rank chart this week.`,
]

const MOVEMENT_BODY: StoryLine[] = [
  (f) => movementBody(f) || `No dramatic swings up or down the ${f.leagueName} table.`,
  (f) => movementBody(f) || `Sometimes a quiet week on the ladder is as informative as a chaotic one.`,
  (f) => movementBody(f) || `The standings barely moved, which can be a story in itself.`,
  (f) => movementBody(f) || `Everyone held roughly where they were.`,
  (f) => movementBody(f) || `The rank chart offered little drama.`,
  (f) => movementBody(f) || `No one made a statement climb or fall.`,
  (f) => movementBody(f) || `The table stayed tight and familiar.`,
  (f) => movementBody(f) || `Positions were largely unchanged.`,
]

const MOVEMENT_OUTRO: StoryLine[] = [
  (f) => f.tightLeague ? `In a compressed league where ${pts(f.pointsSpread)} separate first from last, even modest rank changes carry extra weight.` : `Across a table spanning ${pts(f.pointsSpread)} points, those movements help define who is building momentum.`,
  (f) => f.tightLeague ? `With only ${pts(f.pointsSpread)} between top and bottom, every place matters.` : `Over ${pts(f.pointsSpread)} points separate the extremes of this table.`,
  (f) => `Rank is often won in inches, not miles.`,
  (f) => `The ladder tells you who is building momentum.`,
  (f) => `These shifts will be remembered at the next deadline.`,
  (f) => `Small moves now can become big swings later.`,
  (f) => `The table is never static for long.`,
  (f) => `Momentum is a real asset in a mini-league.`,
]

const MOVEMENT_LATER: Tpl[] = [
  (f) => sanitizeParagraph(composeStory(f, "movement", [MOVEMENT_INTRO, MOVEMENT_BODY, MOVEMENT_OUTRO])),
]

// ─── 5. Gap dynamics (GW2+) ────────────────────────────────────────────────────

const GAP_GAIN: StoryLine[] = [
  (f) => `The gap to the leader moved in your favour this week.`,
  (f) => `You clawed ground back on the leader in ${gwName(f.gw)}.`,
  (f) => `The title race tightened from your perspective.`,
  (f) => `You gained meaningful ground on ${f.leader?.team ?? "the leader"}.`,
  (f) => `The chase felt a little closer after ${gwName(f.gw)}.`,
  (f) => `Your gap to the summit shrank this week.`,
  (f) => `The leader is still ahead, but not by as much.`,
  (f) => `You ate into the lead in ${gwName(f.gw)}.`,
]

const GAP_LOSS: StoryLine[] = [
  (f) => `The leader pulled further clear of you in ${gwName(f.gw)}.`,
  (f) => `The gap widened again this week.`,
  (f) => `You lost ground on ${f.leader?.team ?? "the leader"}.`,
  (f) => `The summit feels a little further away now.`,
  (f) => `The leader stretched their advantage.`,
  (f) => `Your chase hit a speed bump in ${gwName(f.gw)}.`,
  (f) => `The title gap grew this week.`,
  (f) => `You fell further behind the leader.`,
]

const GAP_STEADY: StoryLine[] = [
  (f) => `Your gap to ${f.leader?.team ?? "the leader"} held steady this week.`,
  (f) => `Neither side gained meaningful ground in the race for the summit.`,
  (f) => `The distance to the leader stayed the same.`,
  (f) => `A stalemate week in the title chase.`,
  (f) => `The gap neither grew nor shrank.`,
  (f) => `You and the leader traded blows without a decisive swing.`,
  (f) => `The chase paused for a week.`,
  (f) => `No change in the gap to the top.`,
]

const GAP_DETAIL: StoryLine[] = [
  (f) => f.gapToLeaderChange && f.gapToLeaderChange > 0 ? `You gained ${pts(f.gapToLeaderChange)} on ${f.leader.team} and now trail by ${pts(f.gapToLeader)} overall.` : "",
  (f) => f.gapToLeaderChange && f.gapToLeaderChange < 0 ? `The gap widened by ${pts(Math.abs(f.gapToLeaderChange))} and now stands at ${pts(f.gapToLeader)}.` : "",
  (f) => f.gapToLeaderChange === 0 ? `The gap remains ${pts(f.gapToLeader)} points.` : "",
  (f) => `You trail ${f.leader?.team ?? "the leader"} by ${pts(f.gapToLeader)} overall.`,
  (f) => `The deficit is ${pts(f.gapToLeader)} points.`,
  (f) => `${pts(f.gapToLeader)} points separate you from the top.`,
  (f) => `The chase stands at ${pts(f.gapToLeader)} points.`,
  (f) => `You are ${pts(f.gapToLeader)} off the pace.`,
]

const GAP_LATER: Tpl[] = [
  (f) => {
    if (!f.user || f.gapToLeaderChange === null) return ""
    const pools =
      f.gapToLeaderChange > 0 ? [GAP_GAIN, GAP_DETAIL] : f.gapToLeaderChange < 0 ? [GAP_LOSS, GAP_DETAIL] : [GAP_STEADY, GAP_DETAIL]
    return sanitizeParagraph(composeStory(f, "gap", pools))
  },
]

// ─── 6. Subplots ───────────────────────────────────────────────────────────────

const SUBPLOTS_RAW: Tpl[] = [
  (f) => {
    const bits: string[] = []
    if (f.chipPlayers.length > 0) {
      bits.push(`${spellN(f.chipPlayers.length)} manager${f.chipPlayers.length > 1 ? "s" : ""} deployed chips, including ${f.chipPlayers.slice(0, 2).map((p) => p.team).join(" and ")}`)
    } else if (f.gw >= 2) {
      bits.push(`Nobody in ${f.leagueName} used a chip, leaving plenty of firepower in reserve`)
    }
    if (f.hitTakers.length > 0) {
      bits.push(`${f.hitTakers[0].team} paid ${pts(f.hitTakers[0].transferCost)} for extra transfers`)
    }
    if (f.benchHero && f.benchHero.benchPts >= benchMentionMinPts(f.gw)) {
      bits.push(`${f.benchHero.team} left ${pts(f.benchHero.benchPts)} on the bench`)
    }

    const intros: StoryLine[] = [
      () => "Away from the headline scores,",
      () => "Beneath the surface,",
      () => "The tactical layer mattered too:",
      () => "Off the pitch,",
      () => "Look past the totals and",
      () => "The margins told their own story:",
      () => "Decisions mattered as much as returns:",
      () => "The subplots were impossible to ignore:",
      () => "Beyond the weekly leaderboard,",
      () => "The fine print of the gameweek:",
      () => "Tactical FPL had its say:",
      () => "Chips, hits, and benches shaped the week:",
    ]

    const outros: StoryLine[] = [
      () => "Those calls will be debated before the next deadline.",
      () => "That is the stuff group chats thrive on.",
      () => "Some of those choices will age well. Others will not.",
      () => "Fine margins, big consequences.",
      () => "Tactical FPL at its most punishing.",
      () => "The weekly score never tells the full story.",
      () => "Chips, hits, and benches all left fingerprints.",
      () => "Details separate good weeks from great ones.",
      () => "The tactical layer always matters in mini-leagues.",
      () => "These are the decisions managers replay all week.",
      () => "Template and timing both showed up here.",
      () => "The subplots often outlive the headline score.",
    ]

    if (bits.length === 0) {
      return sanitizeParagraph(pickFromPool([
        (ff) => isFirstGameweek(ff.gw)
          ? `The opening gameweek was relatively straightforward tactically, with no major chip drama dominating week one.`
          : `This was a clean gameweek tactically. No chips burned, no major hits, no bench disasters.`,
        (ff) => isFirstGameweek(ff.gw)
          ? `Week one offered few tactical fireworks. No chips, no chaos.`
          : `A straightforward week on the tactical front in ${ff.leagueName}.`,
        (ff) => isFirstGameweek(ff.gw)
          ? `The tactical story was quiet on opening night.`
          : `Nobody lit a chip. Nobody paid a heavy price for hits.`,
      ], f, "subplots", 0)(f))
    }

    const intro = pickFromPool(intros, f, "subplots", 0)(f)
    const outro = pickFromPool(outros, f, "subplots", 1)(f)
    return sanitizeParagraph(`${intro} ${bits.join(". ")}. ${outro}`)
  },
]

const CHIP_VERDICT_RAW: Tpl[] = [
  (f) => {
    if (f.chipVerdicts.length === 0) return ""
    const v = f.chipVerdicts[0]
    const verdict = v.vsFplAvg >= 10 ? "a strong return" : v.vsFplAvg >= 0 ? "a respectable return" : "a disappointing return"
    const vsLeague = Math.round(v.vsLeagueAvg)
    const leagueBit = vsLeague >= 0 ? `${pts(vsLeague)} above the ${f.leagueName} mean` : `${pts(Math.abs(vsLeague))} below the ${f.leagueName} mean`
    return `${v.team}'s ${v.chip} delivered ${pts(v.gwPts)}, ${verdict} against the FPL average of ${pts(f.fplAvg)} and ${leagueBit}. ${f.chipVerdicts.length > 1 ? `Others played chips too, but ${v.team} set the tone.` : ""}`
  },
]

const HIT_REGRET_RAW: Tpl[] = [
  (f) => {
    if (f.hitRegret.length === 0) return ""
    const names = f.hitRegret.slice(0, 3).map((h) => `${h.team} (${pts(h.gwPts)} after a ${pts(h.transferCost)} hit)`).join(", ")
    return `Transfer aggression did not pay off for everyone. ${names} ${f.hitRegret.length === 1 ? "still underperformed" : "all underperformed"} the ${pts(f.fplAvg)} gameweek average.`
  },
]

const MILESTONE_RAW: Tpl[] = [
  (f) => {
    if (f.milestones.length === 0) return ""
    if (isFirstGameweek(f.gw)) {
      return `${f.milestones[0]}. The first pecking order in ${f.leagueName} is on the board.`
    }
    return `Milestone watch: ${f.milestones.join(". ")}. These are the moments that turn a long season into a story worth following.`
  },
]

const CONSISTENCY_RAW: Tpl[] = [
  (f) => {
    if (!f.consistencyManager) return ""
    return `Consistency crown: over the last few gameweeks, ${f.consistencyManager.team} has been the steadiest manager in the room. ${f.consistencyManager.manager}'s returns have fluctuated less than anyone else's in ${f.leagueName}.`
  },
]

const RIVALRY_LATER: Tpl[] = [
  (f) => {
    if (!f.directRival || !f.user) return ""
    const gap = rivalGapPhrase(f)
    const streak =
      f.rivalStreakTotal >= 3
        ? `You have outscored ${f.directRival.team} in ${spellN(f.rivalStreakWins)} of the last ${spellN(f.rivalStreakTotal)} gameweeks.`
        : ""
    const h2h =
      f.h2hUserWins + f.h2hRivalWins + f.h2hDraws >= 3
        ? ` The season head-to-head record stands at ${f.h2hUserWins}-${f.h2hDraws}-${f.h2hRivalWins} in weekly matchups.`
        : ""

    return sanitizeParagraph(pickFromPool([
      (ff) => `Your nearest rival in the table is ${ff.directRival!.team}, managed by ${ff.directRival!.manager}, currently ${gap}.${streak ? ` ${streak}` : ""}${h2h} Mini-league FPL is personal, and this is the relationship that will shape your season.`,
      (ff) => `The manager just above or below you is ${ff.directRival!.team}, ${gap}.${streak ? ` ${streak}` : ""}${h2h} This is the rivalry that matters week to week.`,
      (ff) => `${ff.directRival!.team} is your direct rival in ${ff.leagueName}, ${gap}.${streak ? ` ${streak}` : ""}${h2h} Every gameweek is a mini derby.`,
      (ff) => `Keep an eye on ${ff.directRival!.manager} and ${ff.directRival!.team}. They sit ${gap}.${streak ? ` ${streak}` : ""}${h2h}`,
      (ff) => `The personal battle in ${ff.leagueName} is with ${ff.directRival!.team}, currently ${gap}.${streak ? ` ${streak}` : ""}${h2h}`,
      (ff) => `Your season-long subplot: ${ff.directRival!.team}, ${gap}.${streak ? ` ${streak}` : ""}${h2h}`,
      (ff) => `${ff.directRival!.team} is the name on your radar, ${gap}.${streak ? ` ${streak}` : ""}${h2h} Mini-league FPL gets personal fast.`,
      (ff) => `The rivalry column: ${ff.directRival!.team} (${gap}).${streak ? ` ${streak}` : ""}${h2h}`,
    ], f, "rivalry", 0)(f))
  },
]

const PERSONAL_GW1: Tpl[] = [(f) => poolPersonalGW1(f)]

const PERSONAL_LATER: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    const rankBit =
      f.user.rankChange > 0
        ? ` You climbed ${spellN(f.user.rankChange)} places.`
        : f.user.rankChange < 0
          ? ` You fell ${spellN(Math.abs(f.user.rankChange))} places.`
          : f.gw >= 2
            ? ` Your league position held steady.`
            : ""
    const avgBit = f.user ? fplAvgComparisonShort(f.user.gwPts, f.fplAvg) : ""

    if (f.user.rank === 1) {
      return sanitizeParagraph(pickFromPool([
        (ff) => `From your chair, ${gwName(ff.gw)} was another week at the top of ${ff.leagueName}. You posted ${pts(ff.user!.gwPts)} and lead on ${ff.user!.totalPts} overall. The target is on your back now.`,
        (ff) => `You remain top of ${ff.leagueName} after ${pts(ff.user!.gwPts)} in ${gwName(ff.gw)}. ${ff.user!.totalPts} points overall. Everyone is hunting you.`,
        (ff) => `Still first in ${ff.leagueName}. ${pts(ff.user!.gwPts)} this week, ${ff.user!.totalPts} in total. The pressure stays on.`,
        (ff) => `You lead ${ff.leagueName} on ${ff.user!.totalPts} after ${pts(ff.user!.gwPts)} in ${gwName(ff.gw)}.`,
      ], f, "personal", 0)(f))
    }

    return sanitizeParagraph(pickFromPool([
      (ff) => `Your gameweek brought ${pts(ff.user!.gwPts)} and ${ord(ff.user!.rank)} place in ${ff.leagueName} on ${ff.user!.totalPts} overall.${rankBit} ${avgBit}`,
      (ff) => `From your side: ${pts(ff.user!.gwPts)}, ${ord(ff.user!.rank)} in ${ff.leagueName}, ${ff.user!.totalPts} overall.${rankBit} ${avgBit}`,
      (ff) => `You sit ${ord(ff.user!.rank)} on ${ff.user!.totalPts} after ${pts(ff.user!.gwPts)} in ${gwName(ff.gw)}.${rankBit} ${avgBit}`,
      (ff) => `${pts(ff.user!.gwPts)} and ${ord(ff.user!.rank)} place for you in ${ff.leagueName}.${rankBit} ${avgBit}`,
      (ff) => `Your week: ${pts(ff.user!.gwPts)}, rank ${ff.user!.rank}, ${ff.user!.totalPts} overall.${rankBit}`,
      (ff) => `In ${ff.leagueName}, you returned ${pts(ff.user!.gwPts)} and hold ${ord(ff.user!.rank)} on ${ff.user!.totalPts}.${rankBit}`,
      (ff) => `${gwName(ff.gw)} gave you ${pts(ff.user!.gwPts)}. You are ${ord(ff.user!.rank)} on ${ff.user!.totalPts}.${rankBit}`,
      (ff) => `Your numbers: ${pts(ff.user!.gwPts)} this week, ${ff.user!.totalPts} overall, ${ord(ff.user!.rank)} in the league.${rankBit}`,
    ], f, "personal", 1)(f))
  },
]

const SPOON_GW1: Tpl[] = [(f) => poolSpoonGW1(f)]

const SPOON_LATER: Tpl[] = [
  (f) => {
    const spoon = f.woodenSpoon
    const race = spoonRacePrefix(f)

    return sanitizeParagraph(pickFromPool([
      (ff) => `${race}${mgr(spoon)} props up the table on ${spoon.totalPts} points after ${pts(spoon.gwPts)} in ${gwName(ff.gw)}. ${ff.gw < 38 ? `There is still time to climb.` : `The final table is set.`}`,
      (ff) => `${race}Last place belongs to ${mgr(spoon)} on ${spoon.totalPts} after ${gwName(ff.gw)}.`,
      (ff) => `${race}${mgr(spoon)} anchors the basement on ${spoon.totalPts}.`,
      (ff) => `${race}The foot of ${ff.leagueName} is occupied by ${mgr(spoon)}.`,
      (ff) => `${race}${mgrTeam(spoon)} sit last on ${spoon.totalPts}.`,
      (ff) => `${race}The basement: ${mgr(spoon)}, ${spoon.totalPts} points.`,
      (ff) => `${race}${mgr(spoon)} is propping up the table after ${pts(spoon.gwPts)} in ${gwName(ff.gw)}.`,
      (ff) => `${race}Wooden spoon watch: ${mgr(spoon)} on ${spoon.totalPts}.`,
    ], f, "spoon", 0)(f))
  },
]

const CODA_GW1: Tpl[] = [(f) => poolCodaGW1(f)]

const CODA_LATER: Tpl[] = [
  (f) => sanitizeParagraph(pickFromPool([
    (ff) => `${ff.leagueName} leaves ${gwName(ff.gw)} with ${ff.leader.team} on top and ${ff.gwWinner.team} as the weekly champion. ${gwsRemaining(ff.gw).charAt(0).toUpperCase() + gwsRemaining(ff.gw).slice(1)}.`,
    (ff) => `Roll on the next gameweek. ${ff.leader.team} sit first, ${ff.gwWinner.team} take the weekly honours, and ${ff.leagueName} has ${gwsRemaining(ff.gw)} before the season is done.`,
    (ff) => `${gwName(ff.gw)} is logged. ${ff.leader.team} lead, ${ff.gwWinner.team} won the week. ${gwsRemaining(ff.gw)}.`,
    (ff) => `Until next time: ${ff.leader.team} on top, ${ff.gwWinner.team} with the weekly crown.`,
    (ff) => `The chapter closes with ${ff.leader.team} first and ${ff.gwWinner.team} best of the week.`,
    (ff) => `${ff.leagueName} moves on. Leader: ${ff.leader.team}. Weekly winner: ${ff.gwWinner.team}.`,
    (ff) => `Next deadline awaits. ${ff.leader.team} lead the chase.`,
    (ff) => `${gwName(ff.gw)} done. ${gwsRemaining(ff.gw)} in ${ff.leagueName}.`,
  ], f, "coda", 0)(f)),
]

const FIXTURE_RAW: Tpl[] = [
  (f) => {
    const ctx = f.fixtureContext
    if (!ctx || (!ctx.isDGW && !ctx.isBGW)) return ""
    if (ctx.isDGW) {
      return `The wider Premier League schedule made this a double gameweek, with ${ctx.dgwTeamNames.join(", ")} among the clubs facing twice. That shaped template decisions across ${f.leagueName}.`
    }
    return `The wider game was a blank gameweek for ${ctx.bgwTeamNames.join(", ")}, which meant bench planning mattered as much as captaincy in ${f.leagueName}.`
  },
]

const PERSONALITY_RAW: Tpl[] = [(f) => poolPersonality(f)]

const CAPTAINCY_RAW: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    const diff = f.userVsMedian
    const median = pts(Math.round(f.leagueMedianGwPts))
    return sanitizeParagraph(pickFromPool([
      (ff) => diff >= 8 ? `Your ${pts(ff.user!.gwPts)} sat well above the league median of ${median}, a rough proxy for winning the template battle this week.` : diff <= -8 ? `Your ${pts(ff.user!.gwPts)} finished below the league median of ${median}, which often points to a weaker template or captaincy call.` : `Your ${pts(ff.user!.gwPts)} landed close to the league median of ${median}, suggesting you broadly matched the field without a decisive edge.`,
      (ff) => diff >= 8 ? `Template check: ${pts(ff.user!.gwPts)} for you against a ${f.leagueName} median of ${median}. You won the week structurally.` : diff <= -8 ? `Against a median of ${median}, your ${pts(ff.user!.gwPts)} suggests the template or captain let you down.` : `You and the league median (${median}) were in the same ballpark on ${pts(ff.user!.gwPts)}.`,
      (ff) => `The league median was ${median}; you returned ${pts(ff.user!.gwPts)}.${diff >= 8 ? " That is a strong template week." : diff <= -8 ? " That is a template miss." : " That is middle of the pack."}`,
      (ff) => diff >= 8 ? `You beat the ${f.leagueName} median by ${pts(diff)}. Captaincy and structure likely worked.` : diff <= -8 ? `You finished ${pts(Math.abs(diff))} below the league median. The template battle went against you.` : `Your score tracked the league median almost exactly.`,
      (ff) => `Median score in ${f.leagueName}: ${median}. Yours: ${pts(ff.user!.gwPts)}.${diff >= 8 ? " A clear edge." : diff <= -8 ? " A clear miss." : " No decisive edge."}`,
      (ff) => `Your return versus the field median is a useful captaincy proxy. This week: ${pts(ff.user!.gwPts)} vs ${median}.`,
      (ff) => diff >= 8 ? `Rivals will have felt your ${pts(ff.user!.gwPts)} against a ${median} median.` : diff <= -8 ? `A ${pts(ff.user!.gwPts)} return against a ${median} median hurts.` : `You matched the field on template this week.`,
      (ff) => `Captaincy proxy: ${pts(ff.user!.gwPts)} against a ${median} league median.`,
    ], f, "captaincy", 0)(f))
  },
]

export function ledeFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? LEDE_GW1 : LEDE_LATER
}

export function standingsFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? STANDINGS_GW1 : STANDINGS_LATER
}

export function podiumFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? PODIUM_GW1 : PODIUM_LATER
}

export function personalFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? PERSONAL_GW1 : PERSONAL_LATER
}

export function spoonFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? SPOON_GW1 : SPOON_LATER
}

export function codaFor(f: SeasonStoryFacts): Tpl[] {
  return isFirstGameweek(f.gw) ? CODA_GW1 : CODA_LATER
}

export const LEDE = wrap([...LEDE_GW1, ...LEDE_LATER])
export const FIXTURE = wrap(FIXTURE_RAW)
export const PERSONALITY = wrap(PERSONALITY_RAW)
export const CAPTAINCY = wrap(CAPTAINCY_RAW)
export const STANDINGS = wrap([...STANDINGS_GW1, ...STANDINGS_LATER])
export const PODIUM = wrap([...PODIUM_GW1, ...PODIUM_LATER])
export const MOVEMENT = wrap(MOVEMENT_LATER)
export const GAP_DYNAMICS = wrap(GAP_LATER)
export const SUBPLOTS = wrap(SUBPLOTS_RAW)
export const CHIP_VERDICT = wrap(CHIP_VERDICT_RAW)
export const HIT_REGRET = wrap(HIT_REGRET_RAW)
export const MILESTONES = wrap(MILESTONE_RAW)
export const CONSISTENCY = wrap(CONSISTENCY_RAW)
export const RIVALRY = wrap(RIVALRY_LATER)
export const PERSONAL = wrap([...PERSONAL_GW1, ...PERSONAL_LATER])
export const SPOON_RACE = wrap([...SPOON_GW1, ...SPOON_LATER])
export const CODA = wrap([...CODA_GW1, ...CODA_LATER])
