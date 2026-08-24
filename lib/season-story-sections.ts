import type { SeasonStoryFacts } from "./season-story"
import {
  gwName,
  phaseNote,
  pluralN,
  pts,
  ord,
  gwsRemaining,
  spellN,
  sanitizeParagraph,
  isFirstGameweek,
  canDiscussRankMovement,
  canDiscussRivalryArc,
  canDiscussGapChange,
} from "./season-story-copy"

type Tpl = (f: SeasonStoryFacts) => string

function wrap(templates: Tpl[]): Tpl[] {
  return templates.map((t) => (f) => sanitizeParagraph(t(f)))
}

function fixtureLine(f: SeasonStoryFacts): string {
  const ctx = f.fixtureContext
  if (!ctx) return ""
  if (ctx.isDGW && ctx.dgwTeamNames.length > 0) {
    const teams = ctx.dgwTeamNames.slice(0, 4).join(", ")
    return `A double gameweek shaped the wider game, with ${teams} among the clubs facing twice. `
  }
  if (ctx.isBGW && ctx.bgwTeamNames.length > 0) {
    const teams = ctx.bgwTeamNames.slice(0, 4).join(", ")
    return `A blank gameweek removed several clubs from the schedule, including ${teams}, which forced careful bench planning across the league. `
  }
  return ""
}

function personalityIntro(f: SeasonStoryFacts): string {
  if (isFirstGameweek(f.gw)) {
    return `The opening gameweek played out as a ${f.leaguePersonality.toLowerCase()} in ${f.leagueName}. `
  }
  return `This was a ${f.leaguePersonality.toLowerCase()} in ${f.leagueName}. `
}

function rivalGapPhrase(f: SeasonStoryFacts): string {
  if (!f.user || !f.directRival) return ""
  const gap = Math.abs(f.directRival.totalPts - f.user.totalPts)
  if (gap === 0) return `level with you on points`
  return f.directRival.totalPts > f.user.totalPts
    ? `${pts(gap)} ahead of you`
    : `${pts(gap)} behind you`
}

// ─── 1. Lede ─────────────────────────────────────────────────────────────────

const LEDE_GW1: Tpl[] = [
  (f) => `The ${f.leagueName} season is under way. ${fixtureLine(f)}${f.gwWinner.manager} and ${f.gwWinner.team} set the early standard with ${pts(f.gwWinner.gwPts)}, the best return among ${spellN(f.leagueSize)} managers. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}Across the mini-league, ${spellN(f.beatAvgCount)} managers beat the wider FPL average of ${pts(f.fplAvg)}.`,
  (f) => `Opening night in ${f.leagueName} belonged to ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} posted ${pts(f.gwWinner.gwPts)} to lead the weekly scoring charts on the first gameweek of the season. ${phaseNote(f.gw, f.phase, f.leagueName)} The FPL average was ${pts(f.fplAvg)}; inside this league, the mean return was ${pts(Math.round(f.leagueAvgGwPts))}.`,
  (f) => `${f.leagueName} has its first set of results. ${fixtureLine(f)}${f.gwWinner.team} topped the opening gameweek on ${pts(f.gwWinner.gwPts)}, with ${f.gwWinner.manager} claiming the first weekly bragging rights of the campaign. ${personalityIntro(f)}`,
  (f) => `The campaign opened in ${f.leagueName} with ${f.gwWinner.team} leading the way on ${pts(f.gwWinner.gwPts)}. ${fixtureLine(f)}That was the score to beat on the first weekend, with ${spellN(f.beatAvgCount)} managers finishing above the ${pts(f.fplAvg)} FPL average. ${phaseNote(f.gw, f.phase, f.leagueName)}`,
]

const LEDE_LATER: Tpl[] = [
  (f) => `${gwName(f.gw)} has added another chapter to the ${f.leagueName} season, and the weekly honours belong to ${f.gwWinner.manager} and ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} posted ${pts(f.gwWinner.gwPts)}, the best return in a league of ${spellN(f.leagueSize)} managers, while the wider FPL average sat at ${pts(f.fplAvg)}. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}Across this mini-league, ${spellN(f.beatAvgCount)} managers beat the global average.`,
  (f) => `The ${f.leagueName} table has shifted after ${gwName(f.gw)}. ${fixtureLine(f)}At the top of the weekly scoring charts, ${f.gwWinner.team} delivered ${pts(f.gwWinner.gwPts)} under ${f.gwWinner.manager}, setting a benchmark that framed every other result in the room. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}The league average for the week inside ${f.leagueName} was ${pts(Math.round(f.leagueAvgGwPts))}, compared with ${pts(f.fplAvg)} across FPL as a whole.`,
  (f) => `Another gameweek is in the books for ${f.leagueName}, and ${f.gwWinner.team} owns the bragging rights. ${fixtureLine(f)}${f.gwWinner.manager} produced ${pts(f.gwWinner.gwPts)} when rivals were searching for momentum. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}`,
  (f) => `${gwName(f.gw)} brought fresh talking points to ${f.leagueName}, not least the ${pts(f.gwWinner.gwPts)} posted by ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} claimed the weekly crown in a field where ${spellN(f.beatAvgCount)} managers cleared the ${pts(f.fplAvg)} FPL average.`,
]

// ─── 2. Standings ────────────────────────────────────────────────────────────

const STANDINGS_GW1: Tpl[] = [
  (f) => `After the opening gameweek, ${f.leader.team} leads ${f.leagueName} on ${f.leader.totalPts} points. ${f.second ? `${f.second.team} sits second on ${f.second.totalPts}, just ${pts(f.gapFirstSecond)} back.` : ""} The first leaderboard of the season is on the wall, and ${f.leader.manager} will enjoy an early night at the top.`,
  (f) => `${f.leader.manager} and ${f.leader.team} head the table after gameweek one on ${f.leader.totalPts} points. ${f.second ? `Closest challenger: ${f.second.team} on ${f.second.totalPts}.` : ""} It is far too early to call the league, but someone had to strike first.`,
  (f) => `The opening standings have ${f.leader.team} in front on ${f.leader.totalPts}. ${f.pointsSpread} points separate first from last already, which hints at how competitive ${f.leagueName} could become over the months ahead.`,
]

const STANDINGS_LATER: Tpl[] = [
  (f) => `At the summit of ${f.leagueName}, ${f.leader.manager} and ${f.leader.team} sit on ${f.leader.totalPts} points after ${pluralN(f.gw, "gameweek")} of action.${f.newLeader && f.leaderChangedFrom ? ` There was a change at the top: ${f.leader.team} has replaced ${f.leaderChangedFrom.team} as league leader.` : ""} ${f.second ? `${f.second.team} trails by ${pts(f.gapFirstSecond)} on ${f.second.totalPts} overall.` : ""} ${f.tightLeague && f.gw >= 3 ? `This remains a tight league, with ${pts(f.pointsSpread)} separating first from last.` : f.runawayLeader ? `The leader is beginning to create real separation at the top.` : `The standings are taking shape, but there is still a long road ahead.`}`,
  (f) => `The league table tells its own story after ${gwName(f.gw)}. ${f.leader.team} heads the standings on ${f.leader.totalPts} points.${f.newLeader && f.leaderChangedFrom ? ` ${f.leaderChangedFrom.team} held top spot last week; ${f.leader.team} leads now.` : ""} ${pts(f.pointsSpread)} points now cover the full ${f.leagueName} table from first to last.`,
  (f) => `First place belongs to ${f.leader.manager} and ${f.leader.team} on ${f.leader.totalPts} points.${f.newLeader ? ` That is a new name at the summit.` : f.gw >= 2 ? ` They have held their position at the top.` : ""} ${f.second ? `The nearest challenger is ${f.second.team} on ${f.second.totalPts}, ${pts(f.gapFirstSecond)} adrift.` : ""}`,
]

// ─── 3. Podium ───────────────────────────────────────────────────────────────

const PODIUM_GW1: Tpl[] = [
  (f) => `The opening top three: ${f.podium.map((p) => p.team).join(", ")}. That is where ${f.leagueName} begins, with ${f.podium[0]?.team ?? "the leader"} setting the early pace at the sharp end.`,
  (f) => `After gameweek one, the podium reads ${f.podium.map((p, i) => `${ord(i + 1)} ${p.team}`).join(", ")}. Every season needs a starting order, and this is yours.`,
]

const PODIUM_LATER: Tpl[] = [
  (f) => {
    if (f.podiumJoined.length === 0 && f.podiumDropped.length === 0) {
      return `The top three held firm: ${f.podium.map((p) => p.team).join(", ")}. That kind of stability at the summit is valuable in a long mini-league season.`
    }
    const joined = f.podiumJoined.map((p) => p.team).join(", ")
    const dropped = f.podiumDropped.map((p) => p.team).join(", ")
    return `The podium changed hands in ${gwName(f.gw)}. ${joined ? `${joined} joined the top three.` : ""} ${dropped ? `${dropped} dropped out of the podium places.` : ""} The current top three reads ${f.podium.map((p) => `${p.team} (${p.totalPts})`).join(", ")}.`
  },
  (f) => {
    const top3 = f.podium.map((p, i) => `${ord(i + 1)}: ${p.team}`).join("; ")
    if (f.podiumJoined.length > 0 || f.podiumDropped.length > 0) {
      return `Podium shuffle: ${f.podiumDropped.map((p) => p.team).join(", ") || "nobody"} fell out of the top three, while ${f.podiumJoined.map((p) => p.team).join(", ") || "nobody"} climbed into it. The new podium line is ${top3}.`
    }
    return `The podium places are ${top3}. No change at the very top this week.`
  },
]

// ─── 4. Movement (GW4+) ──────────────────────────────────────────────────────

const MOVEMENT_LATER: Tpl[] = [
  (f) => {
    let line = ""
    if (f.biggestClimber && f.biggestClimber.rankChange >= 2) {
      line += `${f.biggestClimber.team} climbed ${spellN(f.biggestClimber.rankChange)} places to ${ord(f.biggestClimber.rank)}. `
    }
    if (f.biggestFaller && f.biggestFaller.rankChange >= 2) {
      line += `${f.biggestFaller.team} fell ${spellN(f.biggestFaller.rankChange)} places to ${ord(f.biggestFaller.rank)}. `
    }
    if (!line) {
      return `League positions were relatively stable in ${gwName(f.gw)}, with no dramatic swings up or down the ${f.leagueName} table. Sometimes a quiet week on the ladder is as informative as a chaotic one.`
    }
    return `${line}${f.tightLeague ? `In a compressed league where ${pts(f.pointsSpread)} separate first from last, even modest rank changes carry extra weight.` : `Across a table spanning ${pts(f.pointsSpread)}, those movements help define who is building momentum.`}`
  },
]

// ─── 5. Gap dynamics (GW2+) ────────────────────────────────────────────────────

const GAP_LATER: Tpl[] = [
  (f) => {
    if (!f.user || f.gapToLeaderChange === null) return ""
    if (f.gapToLeaderChange > 0) {
      return `The gap to the leader moved in your favour this week. You gained ${pts(f.gapToLeaderChange)} on ${f.leader.team} and now trail by ${pts(f.gapToLeader)} overall.`
    }
    if (f.gapToLeaderChange < 0) {
      return `The leader pulled further clear of you in ${gwName(f.gw)}. The gap widened by ${pts(Math.abs(f.gapToLeaderChange))} and now stands at ${pts(f.gapToLeader)}.`
    }
    return `Your gap to ${f.leader.team} held steady at ${pts(f.gapToLeader)} this week. Neither side gained meaningful ground in the race for the summit.`
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
    if (f.benchHero && f.benchHero.benchPts >= 12) {
      bits.push(`${f.benchHero.team} left ${pts(f.benchHero.benchPts)} on the bench`)
    }
    if (bits.length === 0) {
      return isFirstGameweek(f.gw)
        ? `Away from the headline scores, the opening gameweek was relatively straightforward tactically. No major chip drama dominated the conversation on week one.`
        : `Away from the headline scores, this was a relatively clean gameweek tactically. No chips were burned and the league moved on points alone.`
    }
    return `Away from the raw totals, the tactical subplots mattered. ${bits.join(". ")}. Those decisions often age better or worse than the weekly score itself suggests.`
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
    return `Your nearest rival in the table is ${f.directRival.team}, managed by ${f.directRival.manager}, currently ${gap}.${streak ? ` ${streak}` : ""}${h2h} Mini-league FPL is personal, and this is the relationship that will shape your season.`
  },
]

const PERSONAL_GW1: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    if (f.user.rank === 1) {
      return `You top the league after the opening gameweek with ${pts(f.user.gwPts)}. The target is on your back already, and every rival knows your name sits first.`
    }
    return `Your opening gameweek brought ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place in ${f.leagueName}.${f.userBeatAvg ? ` That beat the FPL average of ${pts(f.fplAvg)}.` : ` That fell short of the FPL average of ${pts(f.fplAvg)}.`} The season is only just underway.`
  },
  (f) => {
    if (!f.user) return ""
    return `From your side of the table, gameweek one delivered ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place.${f.gapToLeader > 0 ? ` You trail ${f.leader.team} by ${pts(f.gapToLeader)}.` : ` You share top spot.`} Plenty of time to change the picture.`
  },
]

const PERSONAL_LATER: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    if (f.user.rank === 1) {
      return `From your chair, ${gwName(f.gw)} was another week at the top of ${f.leagueName}. You posted ${pts(f.user.gwPts)} and lead on ${f.user.totalPts} overall. The target is on your back now.`
    }
    const rankBit =
      f.user.rankChange > 0
        ? ` You climbed ${spellN(f.user.rankChange)} places.`
        : f.user.rankChange < 0
          ? ` You fell ${spellN(Math.abs(f.user.rankChange))} places.`
          : f.gw >= 2
            ? ` Your league position held steady.`
            : ""
    return `Your gameweek brought ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place in ${f.leagueName} on ${f.user.totalPts} overall.${rankBit} ${f.userBeatAvg ? `That beat the FPL average.` : `That fell short of the FPL average.`}`
  },
]

const SPOON_GW1: Tpl[] = [
  (f) => {
    const spoon = f.woodenSpoon
    const second = f.secondBottom
    const race =
      second && f.spoonRaceGap <= 8
        ? `${second.team} sits just ${pts(f.spoonRaceGap)} above last place. `
        : ""
    return `${race}${spoon.team} props up the table after the opening gameweek. There is a long season ahead to climb out of the basement.`
  },
]

const SPOON_LATER: Tpl[] = [
  (f) => {
    const spoon = f.woodenSpoon
    const second = f.secondBottom
    const race =
      second && f.spoonRaceGap <= 8
        ? `The wooden spoon race is tight: ${second.team} is only ${pts(f.spoonRaceGap)} ahead of last place. `
        : `At the bottom, ${spoon.team} is ${pts(f.gapFirstLast)} off the leader. `
    return `${race}${spoon.team} props up the table on ${spoon.totalPts} points after ${pts(spoon.gwPts)} in ${gwName(f.gw)}. ${f.gw < 38 ? `There is still time to climb.` : `The final table is set.`}`
  },
]

const CODA_GW1: Tpl[] = [
  (f) => `The opening gameweek is in the books. ${f.leader.team} lead, ${f.gwWinner.team} posted the best weekly score, and ${gwsRemaining(f.gw)} in ${f.leagueName}. The story starts here.`,
  (f) => `Gameweek one is done in ${f.leagueName}. ${f.leader.team} sit top, ${f.gwWinner.team} won the week, and a full season lies ahead.`,
]

const CODA_LATER: Tpl[] = [
  (f) => `${f.leagueName} leaves ${gwName(f.gw)} with ${f.leader.team} on top and ${f.gwWinner.team} as the weekly champion. ${gwsRemaining(f.gw).charAt(0).toUpperCase() + gwsRemaining(f.gw).slice(1)}.`,
  (f) => `Roll on the next gameweek. ${f.leader.team} sit first, ${f.gwWinner.team} take the weekly honours, and ${f.leagueName} has ${gwsRemaining(f.gw)} before the season is done.`,
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

const PERSONALITY_RAW: Tpl[] = [
  (f) => {
    if (isFirstGameweek(f.gw)) {
      return `Label the opening week and you get a ${f.leaguePersonality.toLowerCase()}. The internal league average of ${pts(Math.round(f.leagueAvgGwPts))} compared with ${pts(f.fplAvg)} across FPL sets the tone for week one.`
    }
    return `If you had to label ${gwName(f.gw)} in one phrase, it was a ${f.leaguePersonality.toLowerCase()}. The internal league average of ${pts(Math.round(f.leagueAvgGwPts))} compared with ${pts(f.fplAvg)} across FPL tells you how this mini-league lived relative to the global curve.`
  },
  (f) => {
    const beat = `${spellN(f.beatAvgCount)} of ${spellN(f.leagueSize)} managers beat the FPL average`
    if (isFirstGameweek(f.gw)) {
      return `On the opening gameweek, ${beat}, and ${pts(f.pointsSpread)} separated top from bottom in ${f.leagueName}.`
    }
    return `Characterise the week and you land on a ${f.leaguePersonality.toLowerCase()}. ${beat}, and ${pts(f.pointsSpread)} separated top from bottom.`
  },
]

const CAPTAINCY_RAW: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    const diff = f.userVsMedian
    const median = pts(Math.round(f.leagueMedianGwPts))
    if (diff >= 8) return `Your ${pts(f.user.gwPts)} sat well above the league median of ${median}, a rough proxy for winning the template battle this week.`
    if (diff <= -8) return `Your ${pts(f.user.gwPts)} finished below the league median of ${median}, which often points to a weaker template or captaincy call.`
    return `Your ${pts(f.user.gwPts)} landed close to the league median of ${median}, suggesting you broadly matched the field without a decisive edge.`
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
