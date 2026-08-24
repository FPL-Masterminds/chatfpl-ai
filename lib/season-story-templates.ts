import type { SeasonStoryFacts } from "./season-story"

type Tpl = (f: SeasonStoryFacts) => string

function chipLabel(name: string): string {
  const map: Record<string, string> = { wildcard: "Wildcard", freehit: "Free Hit", "3xc": "Triple Captain", bboost: "Bench Boost" }
  return map[name] ?? name
}

function chipList(names: string[]): string {
  return names.map(chipLabel).join(", ")
}

// ─── Opening (season phase + league character) ───────────────────────────────

export const OPENING: Tpl[] = [
  (f) => `Gameweek ${f.gw} is in the books for ${f.leagueName}, and the story of the week is already being retold in group chats.`,
  (f) => `Another gameweek down in ${f.leagueName}. Gameweek ${f.gw} delivered talking points across the table.`,
  (f) => `${f.leagueName} has wrapped up Gameweek ${f.gw}. Here is how the league shifted this week.`,
  (f) => `Gameweek ${f.gw} brought fresh drama to ${f.leagueName}. The standings tell part of the story; the margins tell the rest.`,
  (f) => `The ${f.leagueName} table has updated after Gameweek ${f.gw}. Plenty to unpack before the next deadline.`,
  (f) => `Gameweek ${f.gw} is complete in ${f.leagueName}. Momentum, mistakes, and captaincy all played their part.`,
  (f) => `In ${f.leagueName}, Gameweek ${f.gw} has reshuffled the narrative for managers at every level of the table.`,
  (f) => `Gameweek ${f.gw} delivered another chapter in the ${f.leagueName} season. Some managers celebrated; others are already planning fixes.`,
  (f) => `The dust has settled on Gameweek ${f.gw} in ${f.leagueName}. Time to see who gained ground and who gave it away.`,
  (f) => `${f.leagueName} moves on from Gameweek ${f.gw} with new leaders, new chasers, and new grudges forming.`,
  (f) => `Gameweek ${f.gw} is done in ${f.leagueName}. The league average was ${f.fplAvg} points; how did your mini-league compare?`,
  (f) => `Another week, another shake-up in ${f.leagueName}. Gameweek ${f.gw} left its mark on the standings.`,
  (f) => `${f.leagueName} after Gameweek ${f.gw}: ${f.leagueSize} managers, one leaderboard, and plenty of subplots.`,
  (f) => `Gameweek ${f.gw} has closed in ${f.leagueName}. The table never lies, but it rarely tells the whole story in one line.`,
  (f) => `The Gameweek ${f.gw} results are final in ${f.leagueName}. Here is the week in review.`,
  (f) => `In ${f.leagueName}, Gameweek ${f.gw} separated the patient planners from the panicked tinkerers.`,
  (f) => `Gameweek ${f.gw} is behind us in ${f.leagueName}. Some gaps widened; others vanished overnight.`,
  (f) => `${f.leagueName} has processed Gameweek ${f.gw}. The race continues with ${38 - f.gw} gameweeks still to play.`,
  (f) => `Gameweek ${f.gw} added fresh plot twists to ${f.leagueName}. The top of the table looks ${f.runawayLeader ? "comfortable for one manager" : f.tightLeague ? "wide open" : "competitive"}.`,
  (f) => `The ${f.leagueName} mini-league has turned the page on Gameweek ${f.gw}.`,
  (f) => `Gameweek ${f.gw} in ${f.leagueName}: points on the board, ranks recalculated, and bragging rights up for grabs.`,
  (f) => `${f.leagueName} emerges from Gameweek ${f.gw} with a clearer picture of who is in control and who is chasing.`,
  (f) => `Gameweek ${f.gw} is logged for ${f.leagueName}. The league average sat at ${f.fplAvg}; ${f.beatAvgCount} of ${f.leagueSize} managers beat it.`,
  (f) => `Another gameweek, another layer of context in ${f.leagueName}. Gameweek ${f.gw} did not disappoint.`,
  (f) => `Gameweek ${f.gw} has been filed away in ${f.leagueName}. The season story keeps writing itself.`,
]

export const PHASE_FRAMING: Tpl[] = [
  (f) => f.phase === "opening" ? `Early days still, but Gameweek ${f.gw} habits are already forming.` : f.phase === "run_in" ? `The run-in is here. Every gameweek now carries extra weight.` : f.phase === "final" ? `The final gameweek. Everything on the line.` : f.phase === "second_half" ? `Season part two begins. Chips reset, stakes rise.` : `The mid-season grind continues.`,
  (f) => f.phase === "opening" ? `Only ${f.gw} gameweeks in, yet ${f.leagueName} already has a shape.` : f.phase === "run_in" ? `With ${38 - f.gw} left, there is no room for drift.` : f.phase === "final" ? `One gameweek left. Positions are set unless someone produces a miracle.` : f.phase === "second_half" ? `Fresh half, fresh chips. The second act of the season starts now.` : `We are deep enough into the season for patterns to mean something.`,
  (f) => f.phase === "opening" ? `The opening weeks are about building foundations, not overreacting.` : f.phase === "run_in" ? `From here, every captain call feels heavier.` : f.phase === "final" ? `The last dance of the season.` : f.phase === "second_half" ? `Half-time in the FPL season. Time to reassess.` : `Form and fixtures are starting to outweigh early luck.`,
  (f) => f.phase === "opening" ? `Still early, but the league table is no longer a blank canvas.` : f.phase === "run_in" ? `The business end has arrived in ${f.leagueName}.` : f.phase === "final" ? `Final gameweek drama incoming.` : f.phase === "second_half" ? `GW20 marks a reset. New chips, new possibilities.` : `The season is maturing. Margins matter more each week.`,
  (f) => f.phase === "opening" ? `Plenty of season left, but Gameweek ${f.gw} results already sting or soar.` : f.phase === "run_in" ? `Chips, captaincy, and nerve. The run-in demands all three.` : f.phase === "final" ? `Last chance for glory in ${f.leagueName}.` : f.phase === "second_half" ? `Second-half strategy separates contenders from passengers.` : `Consistency is becoming the differentiator.`,
]

// ─── GW winner ───────────────────────────────────────────────────────────────

export const GW_WINNER: Tpl[] = [
  (f) => `${f.gwWinner.team} (${f.gwWinner.manager}) led the gameweek with ${f.gwWinner.gwPts} points.`,
  (f) => `Top scorer this week: ${f.gwWinner.manager} on ${f.gwWinner.gwPts} points with ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} posted the highest Gameweek ${f.gw} return: ${f.gwWinner.gwPts} points.`,
  (f) => `Gameweek ${f.gw} belonged to ${f.gwWinner.manager}. ${f.gwWinner.gwPts} points from ${f.gwWinner.team}.`,
  (f) => `Nobody in ${f.leagueName} matched ${f.gwWinner.team} this week. ${f.gwWinner.gwPts} points set the bar.`,
  (f) => `${f.gwWinner.manager} takes the Gameweek ${f.gw} crown with ${f.gwWinner.gwPts} points.`,
  (f) => `The gameweek high score: ${f.gwWinner.gwPts}, courtesy of ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} delivered ${f.gwWinner.gwPts} points. Best return in the league this week.`,
  (f) => `Bragging rights for Gameweek ${f.gw} go to ${f.gwWinner.manager} (${f.gwWinner.gwPts} pts).`,
  (f) => `${f.gwWinner.manager} topped the weekly scoring charts with ${f.gwWinner.gwPts}.`,
  (f) => `Gameweek ${f.gw} winner on points: ${f.gwWinner.team} with ${f.gwWinner.gwPts}.`,
  (f) => `${f.gwWinner.gwPts} points from ${f.gwWinner.team}. That was the number to beat in Gameweek ${f.gw}.`,
  (f) => `${f.gwWinner.manager} led the league for Gameweek ${f.gw} scoring with ${f.gwWinner.gwPts} points.`,
  (f) => `The standout score of the week: ${f.gwWinner.gwPts} from ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} set the Gameweek ${f.gw} pace at ${f.gwWinner.gwPts} points.`,
  (f) => `Weekly honours to ${f.gwWinner.manager}. ${f.gwWinner.gwPts} points on the board.`,
  (f) => `${f.gwWinner.gwPts} points sealed the gameweek for ${f.gwWinner.team}.`,
  (f) => `Gameweek ${f.gw}'s top return came from ${f.gwWinner.manager}: ${f.gwWinner.gwPts} points.`,
  (f) => `${f.gwWinner.team} outscored the field in Gameweek ${f.gw} with ${f.gwWinner.gwPts}.`,
  (f) => `Best gameweek score: ${f.gwWinner.gwPts} (${f.gwWinner.team}).`,
  (f) => `${f.gwWinner.manager} posted ${f.gwWinner.gwPts} this week. Top of the pile.`,
  (f) => `${f.gwWinner.team} wins the weekly scoring battle on ${f.gwWinner.gwPts} points.`,
  (f) => `The gameweek's peak score was ${f.gwWinner.gwPts}, owned by ${f.gwWinner.manager}.`,
  (f) => `${f.gwWinner.gwPts} from ${f.gwWinner.team}. The best single-gameweek haul in ${f.leagueName} this week.`,
  (f) => `Gameweek ${f.gw} top scorer: ${f.gwWinner.team} (${f.gwWinner.gwPts} pts).`,
]

// ─── League leader ───────────────────────────────────────────────────────────

export const LEADER_TIGHT: Tpl[] = [
  (f) => `${f.leader.team} leads on ${f.leader.totalPts} points, just ${f.gapFirstSecond} ahead of ${f.second?.team ?? "second place"}.`,
  (f) => `At the summit: ${f.leader.manager} (${f.leader.totalPts} pts). The gap to second is only ${f.gapFirstSecond}.`,
  (f) => `${f.leader.team} sits top with ${f.leader.totalPts} points. ${f.gapFirstSecond} points separate them from the chasing pack.`,
  (f) => `League leader: ${f.leader.team} on ${f.leader.totalPts}. A slender ${f.gapFirstSecond}-point cushion.`,
  (f) => `${f.leader.manager} heads the table on ${f.leader.totalPts}. This league is far from decided.`,
  (f) => `Top spot: ${f.leader.team} (${f.leader.totalPts}). Second place is breathing down their neck.`,
  (f) => `${f.leader.totalPts} points for ${f.leader.team}. The lead is just ${f.gapFirstSecond} points.`,
  (f) => `${f.leader.team} leads ${f.leagueName} on ${f.leader.totalPts}. One bad week could flip it.`,
  (f) => `The leader is ${f.leader.manager} with ${f.leader.totalPts} points. Margins are tight at the top.`,
  (f) => `${f.leader.team} on ${f.leader.totalPts}. A ${f.gapFirstSecond}-point lead is nothing over a full season.`,
  (f) => `First place: ${f.leader.team} (${f.leader.totalPts} pts). The race is alive.`,
  (f) => `${f.leader.manager} tops the league on ${f.leader.totalPts}. ${f.gapFirstSecond} points ahead.`,
  (f) => `${f.leader.team} holds a narrow lead: ${f.leader.totalPts} points, ${f.gapFirstSecond} clear.`,
  (f) => `The summit belongs to ${f.leader.team} on ${f.leader.totalPts}. Barely ahead.`,
  (f) => `${f.leader.totalPts} points puts ${f.leader.team} first. This could change any gameweek.`,
  (f) => `League leader ${f.leader.manager}: ${f.leader.totalPts} points. A tight league at the top.`,
  (f) => `${f.leader.team} leads on ${f.leader.totalPts}. The chasing ${f.second?.team ?? "rival"} is close.`,
  (f) => `Top of ${f.leagueName}: ${f.leader.team} with ${f.leader.totalPts} points (${f.gapFirstSecond} ahead).`,
  (f) => `${f.leader.manager} sits first on ${f.leader.totalPts}. No comfortable margin yet.`,
  (f) => `${f.leader.team} heads the standings on ${f.leader.totalPts}. Every point counts.`,
  (f) => `First place on ${f.leader.totalPts}: ${f.leader.team}. The gap is just ${f.gapFirstSecond}.`,
  (f) => `${f.leader.totalPts} points for the leader, ${f.leader.team}. A single differential captain could swing it.`,
  (f) => `${f.leader.team} leads by ${f.gapFirstSecond}. Far from a procession.`,
  (f) => `The top spot: ${f.leader.manager} (${f.leader.totalPts} pts). Still anyone's league.`,
  (f) => `${f.leader.team} on ${f.leader.totalPts}. The title race in ${f.leagueName} remains wide open.`,
]

export const LEADER_RUNAWAY: Tpl[] = [
  (f) => `${f.leader.team} commands the league on ${f.leader.totalPts} points, ${f.gapFirstSecond} clear of second.`,
  (f) => `Dominant at the top: ${f.leader.manager} with ${f.leader.totalPts} points and a ${f.gapFirstSecond}-point lead.`,
  (f) => `${f.leader.team} leads on ${f.leader.totalPts}. A ${f.gapFirstSecond}-point gap suggests they are pulling away.`,
  (f) => `League leader ${f.leader.team} sits on ${f.leader.totalPts}. The rest are playing catch-up.`,
  (f) => `${f.leader.manager} has built a ${f.gapFirstSecond}-point cushion at the summit (${f.leader.totalPts} total).`,
  (f) => `${f.leader.totalPts} points for ${f.leader.team}. The lead is starting to look commanding.`,
  (f) => `Top spot: ${f.leader.team} (${f.leader.totalPts}). A ${f.gapFirstSecond}-point advantage is significant.`,
  (f) => `${f.leader.team} leads ${f.leagueName} comfortably on ${f.leader.totalPts}.`,
  (f) => `${f.leader.manager} is out in front on ${f.leader.totalPts} points. ${f.gapFirstSecond} ahead.`,
  (f) => `The league belongs to ${f.leader.team} for now: ${f.leader.totalPts} points and growing separation.`,
  (f) => `${f.leader.totalPts} points puts ${f.leader.team} firmly in control.`,
  (f) => `${f.leader.team} on ${f.leader.totalPts}. A ${f.gapFirstSecond}-point lead demands a response from rivals.`,
  (f) => `First place: ${f.leader.manager} (${f.leader.totalPts} pts). The pack is trailing.`,
  (f) => `${f.leader.team} leads by ${f.gapFirstSecond}. That is a serious buffer.`,
  (f) => `${f.leader.manager} tops the table on ${f.leader.totalPts}. Momentum is on their side.`,
  (f) => `${f.leader.totalPts} for ${f.leader.team}. The chasing managers need a statement week.`,
  (f) => `League leader ${f.leader.team}: ${f.leader.totalPts} points. ${f.gapFirstSecond} clear.`,
  (f) => `${f.leader.team} has opened up a ${f.gapFirstSecond}-point lead on ${f.leader.totalPts}.`,
  (f) => `At the top: ${f.leader.manager} with ${f.leader.totalPts}. The gap to second is ${f.gapFirstSecond}.`,
  (f) => `${f.leader.team} leads on ${f.leader.totalPts}. Rivals will need chips and luck to close this.`,
  (f) => `${f.leader.totalPts} points. ${f.leader.team} is setting the standard in ${f.leagueName}.`,
  (f) => `${f.leader.manager} holds a ${f.gapFirstSecond}-point lead at the summit.`,
  (f) => `${f.leader.team} on ${f.leader.totalPts}. The rest of the league is in pursuit mode.`,
  (f) => `First place looks secure for now: ${f.leader.team} (${f.leader.totalPts} pts, +${f.gapFirstSecond}).`,
  (f) => `${f.leader.team} leads ${f.leagueName} on ${f.leader.totalPts}. A sizeable gap has opened.`,
]

export const NEW_LEADER: Tpl[] = [
  (f) => f.newLeader && f.leaderChangedFrom ? `New league leader: ${f.leader.team} overtook ${f.leaderChangedFrom.team} this gameweek.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `Lead change. ${f.leader.manager} replaces ${f.leaderChangedFrom.manager} at the top.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `${f.leader.team} has seized top spot from ${f.leaderChangedFrom.team}.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `The summit has changed hands. ${f.leader.team} now leads; ${f.leaderChangedFrom.team} drops to second.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `Crown shift: ${f.leader.manager} is the new leader, displacing ${f.leaderChangedFrom.manager}.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `${f.leaderChangedFrom.team} held top spot last week. ${f.leader.team} leads now.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `Leadership change in ${f.leagueName}. ${f.leader.team} takes over from ${f.leaderChangedFrom.team}.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `New name at the top: ${f.leader.team}, edging past ${f.leaderChangedFrom.team}.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `${f.leader.manager} climbs to first, knocking ${f.leaderChangedFrom.manager} off the perch.` : "",
  (f) => f.newLeader && f.leaderChangedFrom ? `The top spot flipped. ${f.leader.team} leads; ${f.leaderChangedFrom.team} chases.` : "",
]

// ─── Movers ────────────────────────────────────────────────────────────────────

export const MOVER_UP: Tpl[] = [
  (f) => f.biggestClimber ? `${f.biggestClimber.team} climbed ${f.biggestClimber.rankChange} places to ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `Biggest riser: ${f.biggestClimber.manager}, up ${f.biggestClimber.rankChange} spots to rank ${f.biggestClimber.rank}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} was the week's biggest climber (+${f.biggestClimber.rankChange}).` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.manager} gained ${f.biggestClimber.rankChange} league places. Now ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `Rising fast: ${f.biggestClimber.team}, up ${f.biggestClimber.rankChange} to ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} jumped ${f.biggestClimber.rankChange} positions this gameweek.` : "",
  (f) => f.biggestClimber ? `The biggest league climb: ${f.biggestClimber.manager} (+${f.biggestClimber.rankChange}).` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} surged ${f.biggestClimber.rankChange} places up the table.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.manager} is the week's big mover, climbing ${f.biggestClimber.rankChange} ranks.` : "",
  (f) => f.biggestClimber ? `Up ${f.biggestClimber.rankChange}: ${f.biggestClimber.team}, now sitting ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} made the steepest climb in ${f.leagueName} (+${f.biggestClimber.rankChange}).` : "",
  (f) => f.biggestClimber ? `Momentum for ${f.biggestClimber.manager}: +${f.biggestClimber.rankChange} places to rank ${f.biggestClimber.rank}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} rose ${f.biggestClimber.rankChange} spots. The biggest swing up the table.` : "",
  (f) => f.biggestClimber ? `Climber of the week: ${f.biggestClimber.team} (${f.biggestClimber.rankChange} places).` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.manager} moved up ${f.biggestClimber.rankChange} positions.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} gained ${f.biggestClimber.rankChange} league places in Gameweek ${f.gw}.` : "",
  (f) => f.biggestClimber ? `The table's biggest jump: ${f.biggestClimber.team}, now ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.manager} climbed ${f.biggestClimber.rankChange} ranks this week.` : "",
  (f) => f.biggestClimber ? `Sharp rise for ${f.biggestClimber.team}: +${f.biggestClimber.rankChange} places.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} is the gameweek's biggest riser.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.manager} (+${f.biggestClimber.rankChange}) made the largest upward move.` : "",
  (f) => f.biggestClimber ? `Nobody climbed more than ${f.biggestClimber.team} (+${f.biggestClimber.rankChange}).` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} went up ${f.biggestClimber.rankChange} places. Best climb in the league.` : "",
  (f) => f.biggestClimber ? `Rank rise: ${f.biggestClimber.manager}, +${f.biggestClimber.rankChange} to ${ordinal(f.biggestClimber.rank)}.` : "",
  (f) => f.biggestClimber ? `${f.biggestClimber.team} delivered the biggest rank improvement of the week.` : "",
]

export const MOVER_DOWN: Tpl[] = [
  (f) => f.biggestFaller ? `${f.biggestFaller.team} dropped ${f.biggestFaller.rankChange} places to ${ordinal(f.biggestFaller.rank)}.` : "",
  (f) => f.biggestFaller ? `Biggest faller: ${f.biggestFaller.manager}, down ${f.biggestFaller.rankChange} spots.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} slid ${f.biggestFaller.rankChange} places this gameweek.` : "",
  (f) => f.biggestFaller ? `Tough week for ${f.biggestFaller.manager}: -${f.biggestFaller.rankChange} league places.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} was the week's biggest faller (-${f.biggestFaller.rankChange}).` : "",
  (f) => f.biggestFaller ? `The steepest drop: ${f.biggestFaller.team}, down ${f.biggestFaller.rankChange} to ${ordinal(f.biggestFaller.rank)}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.manager} lost ${f.biggestFaller.rankChange} ranks in ${f.leagueName}.` : "",
  (f) => f.biggestFaller ? `Slipping down: ${f.biggestFaller.team} (-${f.biggestFaller.rankChange}).` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} suffered the biggest league slide this week.` : "",
  (f) => f.biggestFaller ? `Down ${f.biggestFaller.rankChange}: ${f.biggestFaller.manager}, now ${ordinal(f.biggestFaller.rank)}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} fell ${f.biggestFaller.rankChange} places. The week's worst drop.` : "",
  (f) => f.biggestFaller ? `Rank pain for ${f.biggestFaller.manager}: -${f.biggestFaller.rankChange}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} gave up ${f.biggestFaller.rankChange} league positions.` : "",
  (f) => f.biggestFaller ? `The biggest tumble: ${f.biggestFaller.team} to ${ordinal(f.biggestFaller.rank)}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.manager} dropped ${f.biggestFaller.rankChange} places in the standings.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} was the week's biggest loser on rank (-${f.biggestFaller.rankChange}).` : "",
  (f) => f.biggestFaller ? `Faller of the week: ${f.biggestFaller.team}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.manager} slipped ${f.biggestFaller.rankChange} places.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} lost the most ground in ${f.leagueName} this week.` : "",
  (f) => f.biggestFaller ? `A ${f.biggestFaller.rankChange}-place drop for ${f.biggestFaller.team}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} went backwards by ${f.biggestFaller.rankChange} ranks.` : "",
  (f) => f.biggestFaller ? `Nobody fell further than ${f.biggestFaller.manager} (-${f.biggestFaller.rankChange}).` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.team} now sits ${ordinal(f.biggestFaller.rank)} after a ${f.biggestFaller.rankChange}-place slide.` : "",
  (f) => f.biggestFaller ? `The table punished ${f.biggestFaller.team}: down ${f.biggestFaller.rankChange}.` : "",
  (f) => f.biggestFaller ? `${f.biggestFaller.manager} had the roughest rank swing of the gameweek.` : "",
]

// ─── User story ──────────────────────────────────────────────────────────────

export const USER_STORY: Tpl[] = [
  (f) => f.user ? `Your week: ${f.user.gwPts} points, ${ordinal(f.user.rank)} in the league (${f.user.totalPts} total).` : "",
  (f) => f.user ? `You scored ${f.user.gwPts} in Gameweek ${f.gw} and sit ${ordinal(f.user.rank)} of ${f.leagueSize}.` : "",
  (f) => f.user ? `Your Gameweek ${f.gw}: ${f.user.gwPts} pts. League position: ${ordinal(f.user.rank)}.` : "",
  (f) => f.user && f.user.rank === 1 ? `You lead ${f.leagueName} on ${f.user.totalPts} points after ${f.user.gwPts} this week.` : f.user ? `You are ${ordinal(f.user.rank)} on ${f.user.totalPts} points (${f.user.gwPts} this gameweek).` : "",
  (f) => f.user && f.userBeatAvg ? `You beat the gameweek average with ${f.user.gwPts} points. League rank: ${ordinal(f.user.rank)}.` : f.user ? `You posted ${f.user.gwPts} points, ${f.fplAvg - f.user.gwPts} below the gameweek average. Rank: ${ordinal(f.user.rank)}.` : "",
  (f) => f.user && f.user.rankChange > 0 ? `You climbed ${f.user.rankChange} places to ${ordinal(f.user.rank)} (${f.user.gwPts} pts).` : f.user && f.user.rankChange < 0 ? `You dropped ${Math.abs(f.user.rankChange)} places to ${ordinal(f.user.rank)} (${f.user.gwPts} pts).` : f.user ? `You held ${ordinal(f.user.rank)} with ${f.user.gwPts} points.` : "",
  (f) => f.user ? `Personal recap: ${f.user.gwPts} pts, ${ordinal(f.user.rank)} in ${f.leagueName}, ${f.gapToLeader} behind the leader.` : "",
  (f) => f.user && f.user.rank === 1 ? `Top of the league. ${f.user.gwPts} points this week takes you to ${f.user.totalPts} overall.` : f.user ? `${f.user.gwPts} points for you. ${f.gapToLeader} pts off the lead.` : "",
  (f) => f.user ? `Your score: ${f.user.gwPts}. Position: ${ordinal(f.user.rank)} of ${f.leagueSize}.` : "",
  (f) => f.user ? `Gameweek ${f.gw} for you: ${f.user.gwPts} points, ${f.user.totalPts} season total, rank ${f.user.rank}.` : "",
  (f) => f.user && f.user.gwPts === f.gwWinner.gwPts ? `You matched the gameweek high score (${f.user.gwPts} pts).` : f.user ? `You managed ${f.user.gwPts} points, sitting ${ordinal(f.user.rank)}.` : "",
  (f) => f.user ? `You are ${ordinal(f.user.rank)} in ${f.leagueName} after ${f.user.gwPts} points in Gameweek ${f.gw}.` : "",
  (f) => f.user && f.user.rank <= 3 ? `Podium position: you are ${ordinal(f.user.rank)} on ${f.user.totalPts} points.` : f.user ? `You sit ${ordinal(f.user.rank)} on ${f.user.totalPts} points.` : "",
  (f) => f.user ? `Your gameweek return was ${f.user.gwPts}. Overall total: ${f.user.totalPts}.` : "",
  (f) => f.user && f.user.rank === f.leagueSize ? `Bottom of the league this week. ${f.user.gwPts} points. Time to respond.` : f.user ? `${f.user.gwPts} pts leaves you ${ordinal(f.user.rank)} in the standings.` : "",
  (f) => f.user ? `You: ${f.user.gwPts} pts this GW, ${f.user.totalPts} overall, ${ordinal(f.user.rank)} in the table.` : "",
  (f) => f.user && f.userBeatAvg ? `Above-average week for you (${f.user.gwPts} vs ${f.fplAvg} avg).` : f.user ? `Below the ${f.fplAvg}-point average this week (${f.user.gwPts}).` : "",
  (f) => f.user ? `Your league standing: ${ordinal(f.user.rank)}. Gameweek ${f.gw} score: ${f.user.gwPts}.` : "",
  (f) => f.user ? `${f.user.gwPts} points from you. ${f.gapToLeader > 0 ? `${f.gapToLeader} off top spot.` : "You are leading."}` : "",
  (f) => f.user ? `Personal GW${f.gw}: ${f.user.gwPts} pts. ${f.user.rankChange > 0 ? `Up ${f.user.rankChange} places.` : f.user.rankChange < 0 ? `Down ${Math.abs(f.user.rankChange)}.` : "Rank unchanged."}` : "",
  (f) => f.user ? `You finished Gameweek ${f.gw} on ${f.user.gwPts} points, ${ordinal(f.user.rank)} in ${f.leagueName}.` : "",
  (f) => f.user ? `Your totals: ${f.user.gwPts} this week, ${f.user.totalPts} for the season.` : "",
  (f) => f.user ? `Rank ${f.user.rank} for you after ${f.user.gwPts} points in Gameweek ${f.gw}.` : "",
  (f) => f.user ? `You scored ${f.user.gwPts}. That puts you ${ordinal(f.user.rank)} with ${f.gapToLeader} pts to make up on the leader.` : "",
  (f) => f.user ? `Your Gameweek ${f.gw} story: ${f.user.gwPts} points, ${ordinal(f.user.rank)} place.` : "",
]

// ─── Chips ───────────────────────────────────────────────────────────────────

export const CHIP_DRAMA: Tpl[] = [
  (f) => f.chipPlayers.length === 1 ? `${f.chipPlayers[0].manager} played ${chipList(f.chipPlayers[0].chipsPlayed)} this gameweek.` : f.chipPlayers.length > 1 ? `${f.chipPlayers.length} managers deployed chips: ${f.chipPlayers.map((p) => `${p.team} (${chipList(p.chipsPlayed)})`).join(", ")}.` : "",
  (f) => f.chipPlayers.length === 1 ? `Chip alert: ${f.chipPlayers[0].team} used ${chipList(f.chipPlayers[0].chipsPlayed)}.` : f.chipPlayers.length > 1 ? `Multiple chips hit the table in Gameweek ${f.gw}.` : "",
  (f) => f.chipPlayers.length > 0 ? `Chip activity this week from ${f.chipPlayers.map((p) => p.team).join(", ")}.` : "",
  (f) => f.chipPlayers.length === 1 ? `${chipList(f.chipPlayers[0].chipsPlayed)} was played by ${f.chipPlayers[0].manager}.` : f.chipPlayers.length > 1 ? `Chip weekend in ${f.leagueName}: ${f.chipPlayers.length} managers pulled the trigger.` : "",
  (f) => f.chipPlayers.length > 0 ? `Gameweek ${f.gw} saw chips deployed. ${f.chipPlayers.map((p) => `${p.team}: ${chipList(p.chipsPlayed)}`).join(". ")}.` : "",
  (f) => f.chipPlayers.length === 1 ? `${f.chipPlayers[0].team} went early with ${chipList(f.chipPlayers[0].chipsPlayed)}.` : f.chipPlayers.length > 1 ? `A busy chip gameweek. ${f.chipPlayers.length} managers used boosts.` : "",
  (f) => f.chipPlayers.length > 0 ? `Boosts played: ${f.chipPlayers.map((p) => p.team).join(", ")}.` : "",
  (f) => f.chipPlayers.length === 1 ? `One chip played: ${chipList(f.chipPlayers[0].chipsPlayed)} (${f.chipPlayers[0].team}).` : f.chipPlayers.length > 1 ? `Chips were flying in Gameweek ${f.gw}.` : "",
  (f) => f.chipPlayers.length > 0 ? `${f.chipPlayers.length} chip${f.chipPlayers.length > 1 ? "s" : ""} used in ${f.leagueName} this week.` : "",
  (f) => f.chipPlayers.length === 1 ? `${f.chipPlayers[0].manager} burned ${chipList(f.chipPlayers[0].chipsPlayed)} in GW${f.gw}.` : f.chipPlayers.length > 1 ? `Chip count: ${f.chipPlayers.length}. The league is spending its ammunition.` : "",
]

export const NO_CHIPS: Tpl[] = [
  (f) => `No chips were played in ${f.leagueName} this gameweek. Firepower remains in reserve.`,
  (f) => `Everyone held their chips in Gameweek ${f.gw}. The big boosts are still to come.`,
  (f) => `A chip-free gameweek in ${f.leagueName}. All managers kept their powder dry.`,
  (f) => `No Wildcards, Free Hits, Bench Boosts, or Triple Captains this week.`,
  (f) => `Chips stayed holstered across ${f.leagueName} in Gameweek ${f.gw}.`,
  (f) => `Nobody played a chip. The league's boosts remain untouched for now.`,
  (f) => `Gameweek ${f.gw} passed without chip drama in ${f.leagueName}.`,
  (f) => `All chips still available league-wide after Gameweek ${f.gw} (for those who haven't used them yet).`,
  (f) => `No chip deployments this week. Strategy over spectacle.`,
  (f) => `A quiet week on the chip front in ${f.leagueName}.`,
]

// ─── Transfer hits ─────────────────────────────────────────────────────────────

export const TRANSFER_HITS: Tpl[] = [
  (f) => f.hitTakers.length > 0 ? `${f.hitTakers[0].manager} took a ${f.hitTakers[0].transferCost}-point hit${f.hitTakers.length > 1 ? `; ${f.hitTakers.length - 1} other${f.hitTakers.length > 2 ? "s" : ""} also paid for moves` : ""}.` : "",
  (f) => f.hitTakers.length > 0 ? `Transfer hits this week: ${f.hitTakers.map((h) => `${h.team} (-${h.transferCost})`).join(", ")}.` : "",
  (f) => f.hitTakers.length > 0 ? `${f.hitTakers.length} manager${f.hitTakers.length > 1 ? "s" : ""} paid for extra transfers in Gameweek ${f.gw}.` : "",
  (f) => f.hitTakers.length > 0 ? `Points sacrificed for transfers: ${f.hitTakers.map((h) => `${h.team} (-${h.transferCost})`).join(", ")}.` : "",
  (f) => f.hitTakers.length > 0 ? `${f.hitTakers[0].team} absorbed a -${f.hitTakers[0].transferCost} hit this gameweek.` : "",
  (f) => f.hitTakers.length > 0 ? `The hit takers: ${f.hitTakers.map((h) => h.manager).join(", ")}.` : "",
  (f) => f.hitTakers.length > 0 ? `Gameweek ${f.gw} saw ${f.hitTakers.length} manager${f.hitTakers.length > 1 ? "s" : ""} pay for moves.` : "",
  (f) => f.hitTakers.length > 0 ? `Transfer aggression: ${f.hitTakers.map((h) => `${h.team} (-${h.transferCost})`).join(", ")}.` : "",
  (f) => f.hitTakers.length > 0 ? `${f.hitTakers[0].manager} paid ${f.hitTakers[0].transferCost} points for transfers.` : "",
  (f) => f.hitTakers.length > 0 ? `Some managers paid the price for extra moves this week.` : "",
]

// ─── Bench ───────────────────────────────────────────────────────────────────

export const BENCH_STORY: Tpl[] = [
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `${f.benchHero.team} left ${f.benchHero.benchPts} points on the bench. Painful.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `Bench misery for ${f.benchHero.manager}: ${f.benchHero.benchPts} unused points.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `${f.benchHero.benchPts} bench points wasted by ${f.benchHero.team}.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `The bench hurt ${f.benchHero.team} this week (${f.benchHero.benchPts} pts unused).` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `${f.benchHero.manager} will rue ${f.benchHero.benchPts} points sat on the bench.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `Bench points left behind: ${f.benchHero.benchPts} (${f.benchHero.team}).` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `${f.benchHero.team} had ${f.benchHero.benchPts} on the bench. Ouch.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `A ${f.benchHero.benchPts}-point bench for ${f.benchHero.team}. That stings.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `Bench watch: ${f.benchHero.manager} left ${f.benchHero.benchPts} points out.` : "",
  (f) => f.benchHero && f.benchHero.benchPts >= 15 ? `${f.benchHero.benchPts} unused bench points for ${f.benchHero.team}.` : "",
]

// ─── Bottom / wooden spoon ───────────────────────────────────────────────────

export const BOTTOM_TABLE: Tpl[] = [
  (f) => `${f.woodenSpoon.team} props up the table on ${f.woodenSpoon.totalPts} points (${f.woodenSpoon.gwPts} this week).`,
  (f) => `At the bottom: ${f.woodenSpoon.manager} with ${f.woodenSpoon.totalPts} points.`,
  (f) => `Wooden spoon position: ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts} pts).`,
  (f) => `${f.woodenSpoon.team} sits last on ${f.woodenSpoon.totalPts} points.`,
  (f) => `Bottom of ${f.leagueName}: ${f.woodenSpoon.team}, ${f.woodenSpoon.gwPts} pts this gameweek.`,
  (f) => `${f.woodenSpoon.manager} is last on ${f.woodenSpoon.totalPts} points.`,
  (f) => `The cellar: ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts} pts, ${f.gapFirstLast} off the leader).`,
  (f) => `${f.woodenSpoon.team} remains at the foot of the table.`,
  (f) => `Last place: ${f.woodenSpoon.team} on ${f.woodenSpoon.totalPts}.`,
  (f) => `${f.woodenSpoon.gwPts} points for ${f.woodenSpoon.team}. Bottom of the league.`,
  (f) => `${f.woodenSpoon.manager} is propping up the standings on ${f.woodenSpoon.totalPts}.`,
  (f) => `Bottom spot belongs to ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.totalPts} points for last-placed ${f.woodenSpoon.team}.`,
  (f) => `The bottom rung: ${f.woodenSpoon.team} (${f.woodenSpoon.gwPts} this GW).`,
  (f) => `${f.woodenSpoon.team} is ${f.gapFirstLast} points off the leader.`,
  (f) => `Foot of the table: ${f.woodenSpoon.manager}, ${f.woodenSpoon.totalPts} pts.`,
  (f) => `${f.woodenSpoon.team} on ${f.woodenSpoon.totalPts}. A tough spot, but plenty of season left.`,
  (f) => `Last in ${f.leagueName}: ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.gwPts} pts this week for bottom-placed ${f.woodenSpoon.team}.`,
  (f) => `The league basement: ${f.woodenSpoon.team} (${f.woodenSpoon.totalPts}).`,
  (f) => `${f.woodenSpoon.manager} sits last after Gameweek ${f.gw}.`,
  (f) => `Bottom of the pile: ${f.woodenSpoon.team}, ${f.woodenSpoon.totalPts} points.`,
  (f) => `${f.woodenSpoon.team} is last on ${f.woodenSpoon.totalPts} (${f.woodenSpoon.gwPts} this GW).`,
  (f) => `Last place on ${f.woodenSpoon.totalPts}: ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.team} anchors the bottom of ${f.leagueName}.`,
]

// ─── League character ────────────────────────────────────────────────────────

export const LEAGUE_CHARACTER: Tpl[] = [
  (f) => f.tightLeague ? `A tight league: ${f.pointsSpread} points separate first from last.` : `A ${f.pointsSpread}-point spread from top to bottom.`,
  (f) => f.beatAvgCount > f.leagueSize / 2 ? `More than half the league beat the ${f.fplAvg}-point average this week.` : `Only ${f.beatAvgCount} of ${f.leagueSize} managers beat the ${f.fplAvg}-point average.`,
  (f) => f.tightLeague ? `The pack is bunched. Nobody is out of this yet.` : `Gaps are opening up across the table.`,
  (f) => `${f.beatAvgCount} managers cleared the ${f.fplAvg}-point gameweek average.`,
  (f) => f.tightLeague ? `With ${f.pointsSpread} points from first to last, every gameweek matters.` : `The league has stretched to a ${f.pointsSpread}-point range.`,
  (f) => `Gameweek average in FPL: ${f.fplAvg}. In ${f.leagueName}: ${f.beatAvgCount} beat it.`,
  (f) => f.tightLeague ? `Margins are slim in ${f.leagueName}.` : `The table is starting to stratify.`,
  (f) => `${f.leagueSize} managers, ${f.pointsSpread} points between top and bottom.`,
  (f) => f.beatAvgCount >= f.leagueSize * 0.7 ? `A high-scoring week for the league overall.` : `A tricky gameweek for many in ${f.leagueName}.`,
  (f) => `The league spread stands at ${f.pointsSpread} points after Gameweek ${f.gw}.`,
]

// ─── Closing ─────────────────────────────────────────────────────────────────

export const CLOSING: Tpl[] = [
  (f) => `Gameweek ${f.gw + 1} is next. The story continues.`,
  (f) => `${38 - f.gw} gameweeks remain. Plenty of plot left.`,
  (f) => `On to Gameweek ${f.gw + 1}. The table will shift again.`,
  (f) => `Next deadline approaching. ${f.leagueName} keeps turning.`,
  (f) => `Roll on Gameweek ${f.gw + 1}.`,
  (f) => `The season rolls forward. ${38 - f.gw} gameweeks to go.`,
  (f) => `Another chapter done. Next week writes the next one.`,
  (f) => `Gameweek ${f.gw + 1} awaits.`,
  (f) => `The race continues with ${38 - f.gw} gameweeks left.`,
  (f) => `Until next gameweek, ${f.leagueName}.`,
  (f) => `Same league, new gameweek coming up.`,
  (f) => `Gameweek ${f.gw + 1} is around the corner.`,
  (f) => `The ${f.leagueName} story is far from finished.`,
  (f) => `Next gameweek could change everything. It usually does.`,
  (f) => `${38 - f.gw} left. Stay patient, stay sharp.`,
  (f) => `Onwards to Gameweek ${f.gw + 1}.`,
  (f) => `The table today is not the table in May. Keep going.`,
  (f) => `Another week in the books. Next one matters just as much.`,
  (f) => `Gameweek ${f.gw + 1} prep starts now.`,
  (f) => `See you next gameweek, ${f.leagueName}.`,
  (f) => `The mini-league drama never stops. GW${f.gw + 1} next.`,
  (f) => `Rest, reset, and return for Gameweek ${f.gw + 1}.`,
  (f) => `${f.leagueName} marches on.`,
  (f) => `Until the next deadline, keep an eye on the chasing pack.`,
  (f) => `Gameweek ${f.gw} is history. Gameweek ${f.gw + 1} is opportunity.`,
]

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
