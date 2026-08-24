import type { SeasonStoryFacts } from "./season-story"
import { gwName, phaseNote, pluralN, pts, ord, gwsLeft, spellN, sanitizeParagraph } from "./season-story-copy"

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
  return `This was a ${f.leaguePersonality.toLowerCase()} in ${f.leagueName}. `
}

// ─── 1. Lede ─────────────────────────────────────────────────────────────────

const LEDE_RAW: Tpl[] = [
  (f) => `${gwName(f.gw)} has added another long chapter to the ${f.leagueName} season, and the weekly honours belong to ${f.gwWinner.manager} and ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} posted ${pts(f.gwWinner.gwPts)}, the best return in a league of ${spellN(f.leagueSize)} managers, while the wider FPL average sat at ${pts(f.fplAvg)}. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}Across this mini-league, ${spellN(f.beatAvgCount)} managers beat the global average, which tells you plenty about how competitive the week felt.`,
  (f) => `The ${f.leagueName} table has shifted again after ${gwName(f.gw)}. ${fixtureLine(f)}At the top of the weekly scoring charts, ${f.gwWinner.team} delivered ${pts(f.gwWinner.gwPts)} under ${f.gwWinner.manager}, setting a benchmark that framed every other result in the room. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}The league average for the week inside ${f.leagueName} was ${pts(Math.round(f.leagueAvgGwPts))}, compared with ${pts(f.fplAvg)} across FPL as a whole.`,
  (f) => `Another gameweek is in the books for ${f.leagueName}, and ${f.gwWinner.team} owns the bragging rights. ${fixtureLine(f)}${f.gwWinner.manager} produced ${pts(f.gwWinner.gwPts)} when rivals were searching for momentum, the highest score among ${spellN(f.leagueSize)} competing managers. ${phaseNote(f.gw, f.phase, f.leagueName)} ${personalityIntro(f)}`,
  (f) => `${gwName(f.gw)} brought fresh talking points to ${f.leagueName}, not least the ${pts(f.gwWinner.gwPts)} posted by ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} claimed the weekly crown in a field where ${spellN(f.beatAvgCount)} managers cleared the ${pts(f.fplAvg)} FPL average. ${phaseNote(f.gw, f.phase, f.leagueName)}`,
  (f) => `${f.leagueName} has processed ${gwName(f.gw)}, and the standout score belonged to ${f.gwWinner.team}. ${fixtureLine(f)}${f.gwWinner.manager} delivered when it mattered most, leading the mini-league on ${pts(f.gwWinner.gwPts)} while the wider game averaged ${pts(f.fplAvg)}. ${personalityIntro(f)}`,
]

// ─── 2. Standings ────────────────────────────────────────────────────────────

const STANDINGS_RAW: Tpl[] = [
  (f) => `At the summit of ${f.leagueName}, ${f.leader.manager} and ${f.leader.team} sit on ${f.leader.totalPts} points after ${pluralN(f.gw, "gameweek")} of action.${f.newLeader && f.leaderChangedFrom ? ` There was a change at the top: ${f.leader.team} has replaced ${f.leaderChangedFrom.team} as league leader.` : ""} ${f.second ? `${f.second.team} trails by ${pts(f.gapFirstSecond)} on ${f.second.totalPts} overall.` : ""} ${f.tightLeague ? `This remains a tight league, with ${pts(f.pointsSpread)} separating first from last.` : f.runawayLeader ? `The leader is beginning to create real separation at the top.` : `The standings are taking shape, but there is still a long road ahead.`}`,
  (f) => `The league table tells its own story after ${gwName(f.gw)}. ${f.leader.team} heads the standings on ${f.leader.totalPts} points.${f.newLeader && f.leaderChangedFrom ? ` ${f.leaderChangedFrom.team} held top spot last week; ${f.leader.team} leads now.` : ""} ${f.pointsSpread} points now cover the full ${f.leagueName} table from first to last, and ${f.leader.manager} will know that every rival is plotting a response.`,
  (f) => `First place belongs to ${f.leader.manager} and ${f.leader.team} on ${f.leader.totalPts} points.${f.newLeader ? ` That is a new name at the summit.` : ` They have held their position at the top.`} ${f.second ? `The nearest challenger is ${f.second.team} on ${f.second.totalPts}, ${pts(f.gapFirstSecond)} adrift.` : ""} In a league of ${spellN(f.leagueSize)} managers, the top line carries both pride and pressure.`,
]

// ─── 3. Podium ───────────────────────────────────────────────────────────────

const PODIUM_RAW: Tpl[] = [
  (f) => {
    if (f.gw < 2 || (f.podiumJoined.length === 0 && f.podiumDropped.length === 0)) {
      return `The podium places after ${gwName(f.gw)} are ${f.podium.map((p) => p.team).join(", ")} on ${f.podium.map((p) => p.totalPts).join(", ")} points respectively. ${f.podiumHeld.length === 3 ? `The top three held firm from last week, a sign of early consistency at the sharp end.` : `The top three is still settling, as you would expect this early in the season.`}`
    }
    const joined = f.podiumJoined.map((p) => p.team).join(", ")
    const dropped = f.podiumDropped.map((p) => p.team).join(", ")
    return `The podium changed hands in ${gwName(f.gw)}. ${joined ? `${joined} joined the top three.` : ""} ${dropped ? `${dropped} dropped out of the podium places.` : ""} The current top three reads ${f.podium.map((p) => `${p.team} (${p.totalPts})`).join(", ")}. In a mini-league, those swings are the difference between momentum and doubt.`
  },
  (f) => {
    const top3 = f.podium.map((p, i) => `${ord(i + 1)}: ${p.team}`).join("; ")
    if (f.podiumJoined.length === 0 && f.podiumDropped.length === 0) {
      return `The top three remained intact: ${top3}. That kind of stability at the summit is rare in FPL and suggests the early leaders have found reliable formulas.`
    }
    return `Podium shuffle: ${f.podiumDropped.map((p) => p.team).join(", ") || "nobody"} fell out of the top three, while ${f.podiumJoined.map((p) => p.team).join(", ") || "nobody"} climbed into it. The new podium line is ${top3}.`
  },
]

// ─── 4. Movement ─────────────────────────────────────────────────────────────

const MOVEMENT_RAW: Tpl[] = [
  (f) => {
    let line = ""
    if (f.biggestClimber && f.biggestClimber.rankChange >= 2) {
      line += `${f.biggestClimber.team} climbed ${spellN(f.biggestClimber.rankChange)} places to ${ord(f.biggestClimber.rank)}. `
    }
    if (f.biggestFaller && f.biggestFaller.rankChange >= 2) {
      line += `${f.biggestFaller.team} fell ${spellN(f.biggestFaller.rankChange)} places to ${ord(f.biggestFaller.rank)}. `
    }
    if (!line) line = `League positions were relatively stable this week, with no dramatic swings up or down the ${f.leagueName} table. `
    return `${line}${f.tightLeague ? `In a compressed league where ${pts(f.pointsSpread)} separate first from last, even modest rank changes carry extra weight.` : `Across a table spanning ${pts(f.pointsSpread)}, those movements help define who is building momentum and who is losing it.`}`
  },
]

// ─── 5. Gap dynamics ─────────────────────────────────────────────────────────

const GAP_RAW: Tpl[] = [
  (f) => {
    if (!f.user || f.gapToLeaderChange === null) return ""
    if (f.gapToLeaderChange > 0) {
      return `The gap to the leader moved in your favour this week. You gained ${pts(f.gapToLeaderChange)} on ${f.leader.team} and now trail by ${pts(f.gapToLeader)} overall. That is the kind of weekly swing that keeps a chase alive without guaranteeing anything.`
    }
    if (f.gapToLeaderChange < 0) {
      return `The leader pulled further clear of you in ${gwName(f.gw)}. The gap widened by ${pts(Math.abs(f.gapToLeaderChange))} and now stands at ${pts(f.gapToLeader)}. If you are serious about winning ${f.leagueName}, that margin needs addressing sooner rather than later.`
    }
    return `Your gap to ${f.leader.team} held steady at ${pts(f.gapToLeader)} this week. Neither side gained meaningful ground in the head-to-head race for the summit.`
  },
  (f) => {
    if (!f.user) return ""
    return `You sit ${ord(f.user.rank)} on ${f.user.totalPts} points, ${pts(f.gapToLeader)} behind ${f.leader.team}.${f.gapToLeaderChange !== null && f.gapToLeaderChange > 0 ? ` You narrowed the deficit by ${pts(f.gapToLeaderChange)} this gameweek.` : f.gapToLeaderChange !== null && f.gapToLeaderChange < 0 ? ` The deficit grew by ${pts(Math.abs(f.gapToLeaderChange))}.` : ""} ${f.userVsMedian > 0 ? `Your score was ${pts(f.userVsMedian)} above the league median this week, a useful captaincy and selection proxy.` : f.userVsMedian < 0 ? `You finished ${pts(Math.abs(f.userVsMedian))} below the league median, which suggests your rivals had the stronger template overall.` : `You matched the league median almost exactly.`}`
  },
]

// ─── 6. Subplots / chips ─────────────────────────────────────────────────────

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
    if (bits.length === 0) return `Away from the headline scores, this was a relatively clean gameweek tactically. No chips were burned, no major transfer hits dominated the conversation, and the league moved on points alone.`
    return `Away from the raw totals, the tactical subplots mattered. ${bits.join(". ")}. Those decisions often age better or worse than the weekly score itself suggests.`
  },
]

// ─── 7. Chip verdicts ────────────────────────────────────────────────────────

const CHIP_VERDICT_RAW: Tpl[] = [
  (f) => {
    if (f.chipVerdicts.length === 0) return ""
    const v = f.chipVerdicts[0]
    const verdict = v.vsFplAvg >= 10 ? "a strong return" : v.vsFplAvg >= 0 ? "a respectable return" : "a disappointing return"
    return `${v.team}'s ${v.chip} delivered ${pts(v.gwPts)}, ${verdict} against the FPL average of ${pts(f.fplAvg)} and ${pts(Math.round(v.vsLeagueAvg))} versus the ${f.leagueName} mean. ${f.chipVerdicts.length > 1 ? `Others played chips too, but ${v.team} set the tone for how the week felt.` : `Chip timing will be debated, but the scoreboard records ${pts(v.gwPts)}.`}`
  },
]

// ─── 8. Hit regret ───────────────────────────────────────────────────────────

const HIT_REGRET_RAW: Tpl[] = [
  (f) => {
    if (f.hitRegret.length === 0) return ""
    const names = f.hitRegret.slice(0, 3).map((h) => `${h.team} (${pts(h.gwPts)} after a ${pts(h.transferCost)} hit)`).join(", ")
    return `Transfer aggression did not pay off for everyone. ${names} ${f.hitRegret.length === 1 ? "still underperformed" : "all underperformed"} the ${pts(f.fplAvg)} gameweek average, a reminder that paying for moves only works when the incoming players deliver immediately.`
  },
]

// ─── 9. Milestones ───────────────────────────────────────────────────────────

const MILESTONE_RAW: Tpl[] = [
  (f) => {
    if (f.milestones.length === 0) return ""
    return `Milestone watch: ${f.milestones.join(". ")}. These are the moments that turn a long season into a story worth following week after week.`
  },
  (f) => {
    if (f.isLeagueRecordGw) {
      return `${f.gwWinner.team} produced the highest gameweek score ${f.leagueName} has seen so far this season with ${pts(f.gwWinner.gwPts)}. ${f.milestones.length > 0 ? f.milestones.join(". ") + "." : ""}`
    }
    if (f.milestones.length === 0) return ""
    return `${f.milestones.join(". ")}. Small milestones accumulate across ${pluralN(f.gw, "gameweek")} and eventually define a mini-league campaign.`
  },
]

// ─── 10. Consistency ─────────────────────────────────────────────────────────

const CONSISTENCY_RAW: Tpl[] = [
  (f) => {
    if (!f.consistencyManager) return ""
    return `Consistency crown: over the last few gameweeks, ${f.consistencyManager.team} has been the steadiest manager in the room. ${f.consistencyManager.manager}'s returns have fluctuated less than anyone else's in ${f.leagueName}, and in a long season that reliability often beats one explosive week.`
  },
]

// ─── 11. Rivalry ─────────────────────────────────────────────────────────────

const RIVALRY_RAW: Tpl[] = [
  (f) => {
    if (!f.directRival || !f.user) return ""
    const streak = f.rivalStreakTotal > 0
      ? `You have outscored ${f.directRival.team} in ${spellN(f.rivalStreakWins)} of the last ${spellN(f.rivalStreakTotal)} gameweeks.`
      : ""
    const h2h = f.h2hUserWins + f.h2hRivalWins + f.h2hDraws > 0
      ? `The season head-to-head record stands at ${f.h2hUserWins}-${f.h2hDraws}-${f.h2hRivalWins} in weekly matchups.`
      : ""
    return `Your direct rival in the table is ${f.directRival.team}, managed by ${f.directRival.manager}, currently ${pts(Math.abs(f.directRival.total - f.user.total))} ${f.directRival.total > f.user.total ? "ahead" : "behind"} you. ${streak} ${h2h} Mini-league FPL is personal, and this is the relationship that will shape your season.`
  },
]

// ─── 12. Personal ────────────────────────────────────────────────────────────

const PERSONAL_RAW: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    if (f.user.rank === 1) {
      return `From your chair, ${gwName(f.gw)} was another week at the top of ${f.leagueName}. You posted ${pts(f.user.gwPts)} and lead on ${f.user.totalPts} overall. The target is on your back now, and every rival will be studying your team for weakness.`
    }
    return `Your gameweek brought ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place in ${f.leagueName} on ${f.user.totalPts} overall.${f.user.rankChange > 0 ? ` You climbed ${spellN(f.user.rankChange)} places.` : f.user.rankChange < 0 ? ` You fell ${spellN(Math.abs(f.user.rankChange))} places.` : ` Your league position held steady.`} ${f.userBeatAvg ? `That beat the FPL average.` : `That fell short of the FPL average.`}`
  },
]

// ─── 13. Wooden spoon race ───────────────────────────────────────────────────

const SPOON_RAW: Tpl[] = [
  (f) => {
    const spoon = f.woodenSpoon
    const second = f.secondBottom
    const race = second && f.spoonRaceGap <= 8
      ? `The wooden spoon race is tight: ${second.team} is only ${pts(f.spoonRaceGap)} ahead of last place.`
      : `At the bottom, ${spoon.team} is ${pts(f.gapFirstLast)} off the leader.`
    return `${race} ${spoon.team} props up the table on ${spoon.totalPts} points after ${pts(spoon.gwPts)} in ${gwName(f.gw)}. ${f.gw < 38 ? `There is still time to climb, but the basement can become a habit if it is not addressed quickly.` : `The final table is set.`}`
  },
]

// ─── 14. Coda ────────────────────────────────────────────────────────────────

const CODA_RAW: Tpl[] = [
  (f) => `${f.leagueName} leaves ${gwName(f.gw)} with ${f.leader.team} on top, ${f.gwWinner.team} as the weekly champion, and ${gwsLeft(f.gw)}. The table will move again. It always does. Until then, this was the story of ${gwName(f.gw)}.`,
  (f) => `That is ${gwName(f.gw)} in ${f.leagueName}: ${personalityIntro(f)}${f.leader.team} lead, ${f.gwWinner.team} won the week, and the next deadline is already approaching. ${gwsLeft(f.gw).charAt(0).toUpperCase() + gwsLeft(f.gw).slice(1)}.`,
  (f) => `Roll on the next gameweek. ${f.leader.team} sit first, ${f.gwWinner.team} take the weekly honours, and ${f.leagueName} has ${gwsLeft(f.gw)} before the season is done. The narrative is only getting started.`,
]

// ─── Fixture context ─────────────────────────────────────────────────────────

const FIXTURE_RAW: Tpl[] = [
  (f) => {
    const ctx = f.fixtureContext
    if (!ctx || (!ctx.isDGW && !ctx.isBGW)) return ""
    if (ctx.isDGW) {
      return `The wider Premier League schedule made this a double gameweek, with ${ctx.dgwTeamNames.join(", ")} among the clubs facing twice. That shaped template decisions across ${f.leagueName}, even for managers who did not own the obvious premiums.`
    }
    return `The wider game was a blank gameweek for ${ctx.bgwTeamNames.join(", ")}, which meant bench planning and squad structure mattered as much as captaincy. Several managers in ${f.leagueName} were forced into awkward compromises before a ball was kicked.`
  },
]

// ─── League personality ──────────────────────────────────────────────────────

const PERSONALITY_RAW: Tpl[] = [
  (f) => `If you had to label ${gwName(f.gw)} in one phrase, it was a ${f.leaguePersonality.toLowerCase()}. The internal league average of ${pts(Math.round(f.leagueAvgGwPts))} compared with ${pts(f.fplAvg)} across FPL tells you whether this mini-league lived above or below the global curve.`,
  (f) => `Characterise the week and you land on this: a ${f.leaguePersonality.toLowerCase()}. ${spellN(f.beatAvgCount)} of ${spellN(f.leagueSize)} managers beat the FPL average, and ${pts(f.pointsSpread)} separated top from bottom in ${f.leagueName}.`,
  (f) => `The personality of the gameweek? A ${f.leaguePersonality.toLowerCase()}. That is the lens through which every other result in ${f.leagueName} should be read.`,
]

// ─── Captaincy proxy ─────────────────────────────────────────────────────────

const CAPTAINCY_RAW: Tpl[] = [
  (f) => {
    if (!f.user) return ""
    const diff = f.userVsMedian
    if (diff >= 8) return `Your ${pts(f.user.gwPts)} sat well above the league median of ${pts(Math.round(f.leagueMedianGwPts))}, a rough proxy for winning the captaincy and template battle this week. Rivals will have felt that swing.`
    if (diff <= -8) return `Your ${pts(f.user.gwPts)} finished below the league median of ${pts(Math.round(f.leagueMedianGwPts))}, which often points to a losing captaincy call or a squad missing the main returns. Fixable, but it hurt this week.`
    return `Your ${pts(f.user.gwPts)} landed close to the league median of ${pts(Math.round(f.leagueMedianGwPts))}, suggesting you broadly matched the template without gaining a decisive captaincy edge.`
  },
]

export const LEDE = wrap(LEDE_RAW)
export const FIXTURE = wrap(FIXTURE_RAW)
export const PERSONALITY = wrap(PERSONALITY_RAW)
export const CAPTAINCY = wrap(CAPTAINCY_RAW)
export const STANDINGS = wrap(STANDINGS_RAW)
export const PODIUM = wrap(PODIUM_RAW)
export const MOVEMENT = wrap(MOVEMENT_RAW)
export const GAP_DYNAMICS = wrap(GAP_RAW)
export const SUBPLOTS = wrap(SUBPLOTS_RAW)
export const CHIP_VERDICT = wrap(CHIP_VERDICT_RAW)
export const HIT_REGRET = wrap(HIT_REGRET_RAW)
export const MILESTONES = wrap(MILESTONE_RAW)
export const CONSISTENCY = wrap(CONSISTENCY_RAW)
export const RIVALRY = wrap(RIVALRY_RAW)
export const PERSONAL = wrap(PERSONAL_RAW)
export const SPOON_RACE = wrap(SPOON_RAW)
export const CODA = wrap(CODA_RAW)
