import type { SeasonStoryFacts } from "./season-story"

type Tpl = (f: SeasonStoryFacts) => string

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function chipLabel(name: string): string {
  const map: Record<string, string> = { wildcard: "Wildcard", freehit: "Free Hit", "3xc": "Triple Captain", bboost: "Bench Boost" }
  return map[name] ?? name
}

function phaseNote(f: SeasonStoryFacts): string {
  if (f.phase === "opening") return `With only ${f.gw} gameweeks gone, the picture is still forming, but habits are already emerging.`
  if (f.phase === "second_half") return `The second half of the season brings fresh chips and renewed urgency.`
  if (f.phase === "run_in") return `The run-in has arrived, and every gameweek now carries the weight of the full season behind it.`
  if (f.phase === "final") return `This was the final gameweek. There are no more chances after this.`
  return `We are deep enough into the campaign for patterns to matter more than luck.`
}

function leaderLine(f: SeasonStoryFacts): string {
  if (f.runawayLeader) {
    return `${f.leader.team} commands the league on ${f.leader.totalPts} points, ${f.gapFirstSecond} clear of ${f.second?.team ?? "the chasing pack"}.`
  }
  if (f.tightLeague) {
    return `${f.leader.team} leads on ${f.leader.totalPts} points, but only ${f.gapFirstSecond} separate them from ${f.second?.team ?? "second place"}.`
  }
  return `${f.leader.team} sits top of ${f.leagueName} on ${f.leader.totalPts} points.`
}

function newLeaderLine(f: SeasonStoryFacts): string {
  if (!f.newLeader || !f.leaderChangedFrom) return ""
  return ` There was a change at the summit: ${f.leader.team} has replaced ${f.leaderChangedFrom.team} as league leader.`
}

function moverLines(f: SeasonStoryFacts): string {
  const parts: string[] = []
  if (f.biggestClimber && f.biggestClimber.rankChange >= 2) {
    parts.push(`${f.biggestClimber.team} climbed ${f.biggestClimber.rankChange} places to ${ord(f.biggestClimber.rank)}`)
  }
  if (f.biggestFaller && f.biggestFaller.rankChange >= 2) {
    parts.push(`${f.biggestFaller.team} fell ${f.biggestFaller.rankChange} places to ${ord(f.biggestFaller.rank)}`)
  }
  if (parts.length === 0) return `League positions were relatively stable this week, with no dramatic swings up or down the ${f.leagueName} table.`
  if (parts.length === 1) return `The biggest shift on the leaderboard came from ${parts[0]}.`
  return `On the move this week: ${parts[0]}, while ${parts[1]}.`
}

function subplotLines(f: SeasonStoryFacts): string {
  const bits: string[] = []
  if (f.chipPlayers.length === 1) {
    bits.push(`${f.chipPlayers[0].team} deployed ${chipLabel(f.chipPlayers[0].chipsPlayed[0])}`)
  } else if (f.chipPlayers.length > 1) {
    bits.push(`${f.chipPlayers.length} managers played chips, including ${f.chipPlayers.slice(0, 2).map((p) => p.team).join(" and ")}`)
  } else if (f.gw >= 3) {
    bits.push(`Nobody in ${f.leagueName} used a chip this gameweek, leaving plenty of firepower in reserve`)
  }
  if (f.hitTakers.length > 0) {
    const h = f.hitTakers[0]
    bits.push(`${h.team} paid a ${h.transferCost}-point price for extra transfers`)
  }
  if (f.benchHero && f.benchHero.benchPts >= 12) {
    bits.push(`${f.benchHero.team} left ${f.benchHero.benchPts} points on the bench`)
  }
  if (bits.length === 0) return `It was a straightforward gameweek off the pitch, with no chips, hits, or bench disasters to speak of.`
  return bits.join(". ") + "."
}

function userLine(f: SeasonStoryFacts): string {
  if (!f.user) return ""
  const rank = ord(f.user.rank)
  if (f.user.rank === 1) {
    return `You lead ${f.leagueName} on ${f.user.totalPts} points after a ${f.user.gwPts}-point gameweek. The target is on your back now.`
  }
  if (f.user.rankChange > 0) {
    return `You scored ${f.user.gwPts} points and climbed ${f.user.rankChange} places to ${rank}, now ${f.gapToLeader} points off the lead.`
  }
  if (f.user.rankChange < 0) {
    return `Your ${f.user.gwPts} points were not enough to hold position. You dropped ${Math.abs(f.user.rankChange)} places to ${rank}, ${f.gapToLeader} behind ${f.leader.team}.`
  }
  if (f.userBeatAvg) {
    return `You posted ${f.user.gwPts} points, above the ${f.fplAvg}-point gameweek average, and hold ${rank} place on ${f.user.totalPts} overall.`
  }
  return `You managed ${f.user.gwPts} points this gameweek and sit ${rank} in the league on ${f.user.totalPts} total, ${f.gapToLeader} points behind the leader.`
}

// ─── Paragraph 1: Lede ───────────────────────────────────────────────────────

export const LEDE: Tpl[] = [
  (f) => `Gameweek ${f.gw} has added another chapter to the ${f.leagueName} season. ${f.gwWinner.manager} set the weekly standard with ${f.gwWinner.gwPts} points from ${f.gwWinner.team}, the best return in a league of ${f.leagueSize} managers. ${phaseNote(f)} Across the wider game, the average stood at ${f.fplAvg} points, with ${f.beatAvgCount} managers in this league clearing that mark.`,
  (f) => `The ${f.leagueName} table has shifted again after Gameweek ${f.gw}. At the top of the weekly scoring charts, ${f.gwWinner.team} posted ${f.gwWinner.gwPts} points under ${f.gwWinner.manager}, setting the pace for everyone else to chase. ${phaseNote(f)} ${f.beatAvgCount} of ${f.leagueSize} managers beat the FPL average of ${f.fplAvg} this week.`,
  (f) => `Another gameweek is in the books for ${f.leagueName}, and ${f.gwWinner.team} owns the bragging rights. ${f.gwWinner.gwPts} points from ${f.gwWinner.manager} was the number to beat in Gameweek ${f.gw}. ${phaseNote(f)} The wider FPL average was ${f.fplAvg}; ${f.beatAvgCount} managers here went above it.`,
  (f) => `Gameweek ${f.gw} brought fresh talking points to ${f.leagueName}. ${f.gwWinner.team} led the way on ${f.gwWinner.gwPts} points, with ${f.gwWinner.manager} claiming the weekly honours in a competitive field of ${f.leagueSize}. ${phaseNote(f)}`,
  (f) => `${f.leagueName} has processed Gameweek ${f.gw}, and the standout score belonged to ${f.gwWinner.team}. ${f.gwWinner.manager} delivered ${f.gwWinner.gwPts} points when rivals were searching for momentum. ${f.beatAvgCount} managers beat the ${f.fplAvg}-point gameweek average.`,
  (f) => `If Gameweek ${f.gw} proved anything in ${f.leagueName}, it is that one strong week can redraw the mood across the league. ${f.gwWinner.team} topped the scoring with ${f.gwWinner.gwPts} points. ${phaseNote(f)} The FPL average was ${f.fplAvg}.`,
  (f) => `The dust has settled on Gameweek ${f.gw} in ${f.leagueName}. ${f.gwWinner.manager} and ${f.gwWinner.team} posted the week's high score of ${f.gwWinner.gwPts}, a benchmark that framed the rest of the results. ${f.beatAvgCount} of ${f.leagueSize} beat the ${f.fplAvg}-point average.`,
  (f) => `Gameweek ${f.gw} delivered exactly the kind of weekend ${f.leagueName} was built for. ${f.gwWinner.team} finished top of the weekly pile on ${f.gwWinner.gwPts} points, while ${f.beatAvgCount} managers cleared the ${f.fplAvg}-point FPL average. ${phaseNote(f)}`,
  (f) => `${f.leagueName} moves on from Gameweek ${f.gw} with ${f.gwWinner.team} holding the weekly crown. ${f.gwWinner.gwPts} points from ${f.gwWinner.manager} set the tone in a league where ${f.pointsSpread} points now separate first from last. ${phaseNote(f)}`,
  (f) => `Gameweek ${f.gw} was another reminder that mini-league FPL is as much about weekly momentum as season-long totals. ${f.gwWinner.team} scored ${f.gwWinner.gwPts} to lead the gameweek, with the wider average sitting at ${f.fplAvg}.`,
  (f) => `In ${f.leagueName}, Gameweek ${f.gw} belonged to ${f.gwWinner.manager}. A ${f.gwWinner.gwPts}-point haul from ${f.gwWinner.team} was the week's best return, and ${f.beatAvgCount} managers finished above the ${f.fplAvg}-point benchmark.`,
  (f) => `The Gameweek ${f.gw} story in ${f.leagueName} opens with ${f.gwWinner.team} and ${f.gwWinner.gwPts} points. That was the score to beat in a week where patience, captaincy, and fixture luck all played their part. ${phaseNote(f)}`,
  (f) => `Gameweek ${f.gw} is complete in ${f.leagueName}, and ${f.gwWinner.team} wrote the headline. ${f.gwWinner.manager} posted ${f.gwWinner.gwPts} points, leading a field where ${f.beatAvgCount} managers beat the FPL average of ${f.fplAvg}.`,
  (f) => `Another week, another shake-up in ${f.leagueName}. Gameweek ${f.gw} was defined by ${f.gwWinner.team}'s ${f.gwWinner.gwPts}-point return, the highest in the league this week. ${phaseNote(f)}`,
  (f) => `${f.leagueName} after Gameweek ${f.gw}: ${f.gwWinner.team} on ${f.gwWinner.gwPts} points at the top of the weekly charts, ${f.beatAvgCount} managers above the ${f.fplAvg}-point average, and plenty still to play for. ${phaseNote(f)}`,
  (f) => `Gameweek ${f.gw} did not lack for narrative in ${f.leagueName}. ${f.gwWinner.manager} led the scoring race with ${f.gwWinner.gwPts} points from ${f.gwWinner.team}, setting a standard that ${f.leagueSize - 1} other managers could not match.`,
  (f) => `The weekly honours in ${f.leagueName} go to ${f.gwWinner.team} after a ${f.gwWinner.gwPts}-point Gameweek ${f.gw}. ${phaseNote(f)} ${f.beatAvgCount} managers finished above the ${f.fplAvg}-point FPL average.`,
  (f) => `Gameweek ${f.gw} has been filed away in ${f.leagueName}, with ${f.gwWinner.team} finishing as the week's top scorer on ${f.gwWinner.gwPts}. The league average across FPL was ${f.fplAvg}; ${f.beatAvgCount} managers here beat it.`,
  (f) => `${f.leagueName} emerges from Gameweek ${f.gw} with ${f.gwWinner.manager} and ${f.gwWinner.team} at the front of the weekly queue on ${f.gwWinner.gwPts} points. ${phaseNote(f)}`,
  (f) => `Gameweek ${f.gw} in ${f.leagueName} will be remembered first for ${f.gwWinner.team}'s ${f.gwWinner.gwPts}-point return. That was the peak score in a week where the FPL average landed on ${f.fplAvg}.`,
  (f) => `The ${f.leagueName} mini-league has turned the page on Gameweek ${f.gw}. ${f.gwWinner.team} set the weekly high with ${f.gwWinner.gwPts} points, while ${f.beatAvgCount} of ${f.leagueSize} managers cleared the ${f.fplAvg}-point average.`,
  (f) => `Gameweek ${f.gw} offered ${f.leagueName} another instalment of table tension and weekly rivalry. ${f.gwWinner.manager} topped the gameweek on ${f.gwWinner.gwPts} points with ${f.gwWinner.team}. ${phaseNote(f)}`,
  (f) => `In a league of ${f.leagueSize}, Gameweek ${f.gw} still found a clear weekly winner: ${f.gwWinner.team} on ${f.gwWinner.gwPts} points. ${phaseNote(f)} The FPL average was ${f.fplAvg}.`,
  (f) => `Gameweek ${f.gw} brought points, pressure, and position changes to ${f.leagueName}. The best weekly score came from ${f.gwWinner.team}, with ${f.gwWinner.manager} posting ${f.gwWinner.gwPts}.`,
  (f) => `${f.leagueName} has its Gameweek ${f.gw} report, and it starts with ${f.gwWinner.team}. Their ${f.gwWinner.gwPts} points were the week's best, ${f.beatAvgCount} managers beat the ${f.fplAvg}-point average, and the season continues with ${38 - f.gw} gameweeks left.`,
]

// ─── Paragraph 2: Standings ──────────────────────────────────────────────────

export const STANDINGS: Tpl[] = [
  (f) => `${leaderLine(f)}${newLeaderLine(f)} ${f.tightLeague ? `This remains a tight league, with only ${f.pointsSpread} points from top to bottom after ${f.gw} gameweeks.` : f.runawayLeader ? `The gap at the top is starting to look significant.` : `The standings are taking shape, but there is still a long way to go.`}`,
  (f) => `At the summit of ${f.leagueName}, ${f.leader.manager} and ${f.leader.team} sit on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.gapFirstSecond > 0 ? `${f.second?.team ?? "Second place"} trails by ${f.gapFirstSecond}.` : ""}`,
  (f) => `The league table tells its own story after Gameweek ${f.gw}. ${leaderLine(f)}${newLeaderLine(f)} ${f.pointsSpread} points now separate first from last in ${f.leagueName}.`,
  (f) => `${f.leader.team} heads the ${f.leagueName} standings on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.tightLeague ? `With the pack still bunched, one strong gameweek could change everything.` : `The chasing managers need a response.`}`,
  (f) => `First place belongs to ${f.leader.manager} and ${f.leader.team} on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.second ? `${f.second.team} is the nearest challenger on ${f.second.totalPts}.` : ""}`,
  (f) => `After Gameweek ${f.gw}, ${f.leader.team} leads ${f.leagueName} on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.runawayLeader ? `A ${f.gapFirstSecond}-point cushion gives them breathing room.` : `The margin over second is just ${f.gapFirstSecond} points.`}`,
  (f) => `${leaderLine(f)}${newLeaderLine(f)} In a league of ${f.leagueSize} managers, the top spot carries both pride and a target on your back.`,
  (f) => `The ${f.leagueName} leaderboard after Gameweek ${f.gw} has ${f.leader.team} in front on ${f.leader.totalPts}.${newLeaderLine(f)} ${f.tightLeague ? `This is still anyone's league.` : `The leader will feel the pressure from behind.`}`,
  (f) => `${f.leader.manager} tops ${f.leagueName} with ${f.leader.totalPts} points after Gameweek ${f.gw}.${newLeaderLine(f)} ${f.gapFirstLast} points separate the leader from ${f.woodenSpoon.team} at the bottom.`,
  (f) => `Standings update: ${f.leader.team} first on ${f.leader.totalPts}.${newLeaderLine(f)} ${f.second ? `Behind them, ${f.second.team} sits on ${f.second.totalPts}, ${f.gapFirstSecond} adrift.` : ""}`,
  (f) => `${f.leagueName}'s top line reads ${f.leader.team} on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.tightLeague ? `The league is compressed and competitive.` : `Gaps are opening across the table.`}`,
  (f) => `Gameweek ${f.gw} leaves ${f.leader.team} in charge of ${f.leagueName} on ${f.leader.totalPts} points.${newLeaderLine(f)}`,
  (f) => `${leaderLine(f)}${newLeaderLine(f)} ${f.phase === "run_in" || f.phase === "final" ? `At this stage of the season, every point at the top is precious.` : `There is still time for the picture to change dramatically.`}`,
  (f) => `The race for ${f.leagueName} supremacy has ${f.leader.team} in front on ${f.leader.totalPts}.${newLeaderLine(f)} ${f.gapFirstSecond <= 8 ? `Second place is within striking distance.` : `The chasers have ground to make up.`}`,
  (f) => `${f.leader.manager} leads the way on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.tightLeague ? `No one is running away with it yet.` : `The league leader has created separation.`}`,
  (f) => `At the top of ${f.leagueName}, ${f.leader.team} has ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.second ? `${f.second.manager} in second will have taken note.` : ""}`,
  (f) => `${leaderLine(f)}${newLeaderLine(f)} The season total now matters as much as the weekly score, and ${f.leader.team} has the edge.`,
  (f) => `Gameweek ${f.gw} confirms ${f.leader.team} as league leader on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.pointsSpread} points cover the full ${f.leagueName} table.`,
  (f) => `${f.leader.team} remains the team to catch on ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.tightLeague ? `The league feels wide open.` : `The chasing pack needs a statement week.`}`,
  (f) => `First place after Gameweek ${f.gw}: ${f.leader.team} (${f.leader.totalPts} pts).${newLeaderLine(f)} ${f.second ? `In pursuit: ${f.second.team} on ${f.second.totalPts}.` : ""}`,
  (f) => `${f.leagueName} has a leader, and it is ${f.leader.manager} with ${f.leader.totalPts} points from ${f.leader.team}.${newLeaderLine(f)}`,
  (f) => `The summit of ${f.leagueName} belongs to ${f.leader.team} on ${f.leader.totalPts}.${newLeaderLine(f)} ${f.gapFirstSecond > 0 ? `The nearest rival is ${f.gapFirstSecond} points back.` : ""}`,
  (f) => `${leaderLine(f)}${newLeaderLine(f)} That is the picture at the top after Gameweek ${f.gw}.`,
  (f) => `League leader ${f.leader.team} has ${f.leader.totalPts} points.${newLeaderLine(f)} ${f.tightLeague ? `With tight margins throughout, the weekly scores will keep deciding narratives.` : `The table is beginning to stretch.`}`,
  (f) => `After Gameweek ${f.gw}, ${f.leader.manager} and ${f.leader.team} sit above the rest on ${f.leader.totalPts} points.${newLeaderLine(f)} ${38 - f.gw} gameweeks remain.`,
]

// ─── Paragraph 3: Movement ───────────────────────────────────────────────────

export const MOVEMENT: Tpl[] = [
  (f) => moverLines(f) + ` ${f.tightLeague ? `That kind of movement matters even more in a league where ${f.pointsSpread} points cover the entire table.` : `In a league now spanning ${f.pointsSpread} points from top to bottom, rank swings like these carry real weight.`}`,
  (f) => `The league table was not static this week. ${moverLines(f)} ${f.tightLeague ? `Every climb and fall lands harder when the league is this tight.` : `These are the swings that define a long season.`}`,
  (f) => `${moverLines(f)} ${f.biggestClimber && f.biggestClimber.rankChange >= 2 ? `Momentum like that can change the mood of a mini-league quickly.` : `Sometimes a steady gameweek is as telling as a dramatic one.`}`,
  (f) => `Rank movement was a major subplot in Gameweek ${f.gw}. ${moverLines(f)}`,
  (f) => `Beyond the points totals, the league positions shifted. ${moverLines(f)}`,
  (f) => `${moverLines(f)} ${f.leagueSize} managers, one table, and another week of movement in ${f.leagueName}.`,
  (f) => `The middle and lower reaches of the table were just as active as the top. ${moverLines(f)}`,
  (f) => `Gameweek ${f.gw} reshuffled more than just the weekly scoring chart. ${moverLines(f)}`,
  (f) => `${moverLines(f)} In ${f.leagueName}, those changes will not go unnoticed in the group chat.`,
  (f) => `Position changes gave Gameweek ${f.gw} an extra layer of drama. ${moverLines(f)}`,
  (f) => `${moverLines(f)} ${f.tightLeague ? `In a bunched league, even a two-place climb feels significant.` : `The table is starting to create clear tiers.`}`,
  (f) => `Some managers climbed, others slipped. ${moverLines(f)}`,
  (f) => `The leaderboard movement this week deserved attention. ${moverLines(f)}`,
  (f) => `${moverLines(f)} That is the rank story of Gameweek ${f.gw} in ${f.leagueName}.`,
  (f) => `Not everyone held their ground. ${moverLines(f)}`,
  (f) => `Gameweek ${f.gw} produced real movement on the ${f.leagueName} ladder. ${moverLines(f)}`,
  (f) => `${moverLines(f)} ${f.biggestFaller && f.biggestFaller.rankChange >= 2 ? `A fall like that can force a rethink before the next deadline.` : `The league order looks relatively settled for now.`}`,
  (f) => `The rank changes were part of the wider Gameweek ${f.gw} picture. ${moverLines(f)}`,
  (f) => `${moverLines(f)} ${f.biggestClimber && f.biggestClimber.rankChange >= 2 ? `${f.biggestClimber.manager} will feel that climb.` : `There was little change in league positions this week.`}`,
  (f) => `Mini-league FPL is about season totals, but weekly rank swings still sting. ${moverLines(f)}`,
  (f) => `${moverLines(f)} ${f.tightLeague ? `Nobody is safe, and nobody is out of it.` : `The table is separating into contenders and chasers.`}`,
  (f) => `Gameweek ${f.gw} moved people up and down the ${f.leagueName} order. ${moverLines(f)}`,
  (f) => `${moverLines(f)} Another week, another reshuffle.`,
  (f) => `The rank chart told a story of its own. ${moverLines(f)}`,
  (f) => `${moverLines(f)} That movement will shape the mood heading into Gameweek ${f.gw + 1}.`,
]

// ─── Paragraph 4: Subplots ───────────────────────────────────────────────────

export const SUBPLOTS: Tpl[] = [
  (f) => `Away from the raw totals, the subplots mattered too. ${subplotLines(f)}`,
  (f) => `There was more to Gameweek ${f.gw} than the headline scores. ${subplotLines(f)}`,
  (f) => `The tactical side of the gameweek was just as revealing. ${subplotLines(f)}`,
  (f) => `Chips, transfers, and bench calls all played their part. ${subplotLines(f)}`,
  (f) => `Beneath the surface, ${f.leagueName} had its share of mini-dramas. ${subplotLines(f)}`,
  (f) => `Not every story this week was about the highest score. ${subplotLines(f)}`,
  (f) => `The details separated managers as much as the totals. ${subplotLines(f)}`,
  (f) => `Gameweek ${f.gw} also delivered its share of cautionary tales. ${subplotLines(f)}`,
  (f) => `For some managers, the week was defined by decisions as much as returns. ${subplotLines(f)}`,
  (f) => `The league had its own tactical narrative this week. ${subplotLines(f)}`,
  (f) => `Transfers, chips, and bench order all left fingerprints on Gameweek ${f.gw}. ${subplotLines(f)}`,
  (f) => `Some managers will look back at the margins as much as the totals. ${subplotLines(f)}`,
  (f) => `The weekly leaderboard does not capture everything. ${subplotLines(f)}`,
  (f) => `In ${f.leagueName}, the fine details still mattered. ${subplotLines(f)}`,
  (f) => `Gameweek ${f.gw} was not only about who scored most. ${subplotLines(f)}`,
  (f) => `There were subplots worth noting before we move on. ${subplotLines(f)}`,
  (f) => `The league had its share of transfer hits, chip calls, and bench regrets. ${subplotLines(f)}`,
  (f) => `Tactical choices shaped the gameweek as much as player returns. ${subplotLines(f)}`,
  (f) => `Some weeks are remembered for one big score. Others for one bad bench call. ${subplotLines(f)}`,
  (f) => `The extra layers of Gameweek ${f.gw} are worth recording. ${subplotLines(f)}`,
  (f) => `${f.leagueName} had its own version of the wider gameweek story. ${subplotLines(f)}`,
  (f) => `Beyond the leaderboard, there were decisions to debate. ${subplotLines(f)}`,
  (f) => `The gameweek had texture as well as numbers. ${subplotLines(f)}`,
  (f) => `For a handful of managers, the week turned on more than captaincy alone. ${subplotLines(f)}`,
  (f) => `The supporting cast of Gameweek ${f.gw} was just as interesting. ${subplotLines(f)}`,
]

// ─── Paragraph 5: Personal ───────────────────────────────────────────────────

export const PERSONAL: Tpl[] = [
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `From your perspective, Gameweek ${f.gw} brought ${f.user.gwPts} points and ${ord(f.user.rank)} place in ${f.leagueName}. ${f.user.rank === 1 ? `Leading the league is a position of strength, but everyone is hunting you now.` : f.gapToLeader > 0 ? `${f.gapToLeader} points separate you from ${f.leader.team} at the top.` : ""}` : "",
  (f) => f.user ? `Your gameweek: ${f.user.gwPts} points, ${f.user.totalPts} overall, and ${ord(f.user.rank)} in the league. ${f.userBeatAvg ? `That beat the ${f.fplAvg}-point average.` : `That fell short of the ${f.fplAvg}-point average.`}` : "",
  (f) => f.user ? userLine(f) + ` ${f.user.gwPts === f.gwWinner.gwPts ? `You matched the league's top score this week.` : `${f.gwWinner.gwPts - f.user.gwPts} points separated you from the weekly high.`}` : "",
  (f) => f.user ? `For your team, Gameweek ${f.gw} was a ${f.userBeatAvg ? "productive" : "frustrating"} one. ${f.user.gwPts} points leave you ${ord(f.user.rank)} on ${f.user.totalPts} overall.` : "",
  (f) => f.user ? `You sit ${ord(f.user.rank)} in ${f.leagueName} after ${f.user.gwPts} points in Gameweek ${f.gw}. ${f.user.rankChange > 0 ? `A gain of ${f.user.rankChange} places.` : f.user.rankChange < 0 ? `A drop of ${Math.abs(f.user.rankChange)} places.` : `Your league position held steady.`}` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `Your Gameweek ${f.gw} return of ${f.user.gwPts} points ${f.userBeatAvg ? "was above average" : "was below average"}, leaving you ${ord(f.user.rank)} in the table.` : "",
  (f) => f.user ? `In personal terms, ${f.user.gwPts} points and ${ord(f.user.rank)} place define your Gameweek ${f.gw}. ${f.gapToLeader === 0 ? `You are the one everyone is chasing.` : `${f.gapToLeader} points off top spot.`}` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `Your position in ${f.leagueName}: ${ord(f.user.rank)} on ${f.user.totalPts} points after a ${f.user.gwPts}-point gameweek.` : "",
  (f) => f.user ? `Gameweek ${f.gw} for you: ${f.user.gwPts} points, ${f.user.rankChange > 0 ? `up ${f.user.rankChange} places` : f.user.rankChange < 0 ? `down ${Math.abs(f.user.rankChange)}` : "unchanged in rank"}.` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `You finished the gameweek on ${f.user.gwPts} points and remain ${ord(f.user.rank)} in ${f.leagueName}.` : "",
  (f) => f.user ? `Your story this week is ${f.user.gwPts} points and ${ord(f.user.rank)} place. ${f.user.rank <= 3 ? `You are in the podium places.` : f.user.rank >= f.leagueSize - 2 ? `You are in the bottom reaches of the table.` : `There is ground to make up, but also time to make it.`}` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `From where you sit, Gameweek ${f.gw} delivered ${f.user.gwPts} points and a league rank of ${f.user.rank}.` : "",
  (f) => f.user ? `Your totals now read ${f.user.totalPts} points and ${ord(f.user.rank)} place after ${f.user.gwPts} this gameweek.` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `You are ${ord(f.user.rank)} in ${f.leagueName}, ${f.gapToLeader} points behind the leader, with ${f.user.gwPts} added in Gameweek ${f.gw}.` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `Your gameweek score was ${f.user.gwPts}. ${f.userBeatAvg ? `That was better than the FPL average of ${f.fplAvg}.` : `The FPL average was ${f.fplAvg}.`}` : "",
  (f) => f.user ? userLine(f) : "",
  (f) => f.user ? `In ${f.leagueName}, you are ${ord(f.user.rank)} after Gameweek ${f.gw} on the back of ${f.user.gwPts} points.` : "",
  (f) => f.user ? userLine(f) : "",
]

// ─── Paragraph 6: Coda ───────────────────────────────────────────────────────

export const CODA: Tpl[] = [
  (f) => `At the bottom end, ${f.woodenSpoon.team} props up the table on ${f.woodenSpoon.totalPts} points after ${f.woodenSpoon.gwPts} in Gameweek ${f.gw}. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} arrives next, and the ${f.leagueName} story is far from finished.` : `That brings the season to a close in ${f.leagueName}.`}`,
  (f) => `${f.woodenSpoon.manager} and ${f.woodenSpoon.team} sit last on ${f.woodenSpoon.totalPts} points, ${f.gapFirstLast} behind the leader. ${38 - f.gw > 0 ? `There are still ${38 - f.gw} gameweeks left to rewrite the narrative.` : `The final standings are set.`}`,
  (f) => `The foot of the table belongs to ${f.woodenSpoon.team} on ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `Plenty of season remains, and one gameweek rarely defines a mini-league.` : `The campaign ends here.`}`,
  (f) => `${f.woodenSpoon.team} is last on ${f.woodenSpoon.totalPts} after a ${f.woodenSpoon.gwPts}-point gameweek. ${38 - f.gw > 0 ? `On to Gameweek ${f.gw + 1}, where the margins will shift again.` : `The ${f.leagueName} season is complete.`}`,
  (f) => `Last place: ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts} pts). ${38 - f.gw > 0 ? `The race continues with ${38 - f.gw} gameweeks still to play.` : `The trophy race is over.`}`,
  (f) => `${f.woodenSpoon.manager} anchors the bottom of ${f.leagueName} on ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} is the next chapter.` : `Final standings locked in.`}`,
  (f) => `The cellar dwellers this week are ${f.woodenSpoon.team}, on ${f.woodenSpoon.totalPts} points and ${f.gapFirstLast} off the pace. ${38 - f.gw > 0 ? `The season has more to give.` : `That is the final word on ${f.leagueName}.`}`,
  (f) => `${f.woodenSpoon.team} remains at the foot of the table. ${38 - f.gw > 0 ? `Next gameweek, the whole league starts again with fresh hope and fresh fear.` : `The long season ends here.`}`,
  (f) => `Propping up the standings are ${f.woodenSpoon.team} with ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} offers another chance to climb.` : `The final table stands.`}`,
  (f) => `${f.woodenSpoon.team} is bottom on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `The ${f.leagueName} story rolls on.` : `The curtain falls on another season.`}`,
  (f) => `At the very bottom, ${f.woodenSpoon.manager} and ${f.woodenSpoon.team} have ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `Still ${38 - f.gw} gameweeks to change that.` : `No more gameweeks left to change it.`}`,
  (f) => `${f.woodenSpoon.team} sits last after Gameweek ${f.gw}. ${38 - f.gw > 0 ? `The league resets and goes again next week.` : `The campaign is over.`}`,
  (f) => `The wooden spoon position belongs to ${f.woodenSpoon.team} on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} is already on the horizon.` : `Final positions confirmed.`}`,
  (f) => `${f.woodenSpoon.team} finished Gameweek ${f.gw} at the bottom of ${f.leagueName}. ${38 - f.gw > 0 ? `There is a long way still to go.` : `The season ends with the table as it stands.`}`,
  (f) => `Bottom of the pile: ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts} pts). ${38 - f.gw > 0 ? `Onwards to Gameweek ${f.gw + 1}.` : `The final whistle on the season.`}`,
  (f) => `${f.woodenSpoon.manager} is last on ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `The ${f.leagueName} race continues.` : `The league is decided.`}`,
  (f) => `${f.woodenSpoon.team} props up the league on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `Another gameweek, another chance for everyone.` : `That concludes the ${f.leagueName} season.`}`,
  (f) => `The bottom rung is occupied by ${f.woodenSpoon.team}. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} awaits.` : `The story ends here.`}`,
  (f) => `${f.woodenSpoon.team} on ${f.woodenSpoon.totalPts} points is last. ${38 - f.gw > 0 ? `The league marches on with ${38 - f.gw} gameweeks left.` : `Final standings in ${f.leagueName}.`}`,
  (f) => `Last in the table: ${f.woodenSpoon.team}. ${38 - f.gw > 0 ? `Next week brings another swing of the pendulum.` : `The season is complete.`}`,
  (f) => `${f.woodenSpoon.team} remains in last place on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `Roll on Gameweek ${f.gw + 1}.` : `The final chapter is written.`}`,
  (f) => `The foot of ${f.leagueName} belongs to ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts} pts). ${38 - f.gw > 0 ? `The season story continues.` : `The tale is told.`}`,
  (f) => `${f.woodenSpoon.manager} and ${f.woodenSpoon.team} are last on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `Gameweek ${f.gw + 1} is next.` : `End of season.`}`,
  (f) => `Anchoring the bottom: ${f.woodenSpoon.team} with ${f.woodenSpoon.totalPts} points. ${38 - f.gw > 0 ? `The ${f.leagueName} narrative is only just building.` : `The final table is set.`}`,
  (f) => `${f.woodenSpoon.team} closes out the bottom of the table on ${f.woodenSpoon.totalPts}. ${38 - f.gw > 0 ? `Until next gameweek, ${f.leagueName}.` : `The season belongs to the history books now.`}`,
]
