import type { SeasonStoryFacts } from "./season-story"
import {
  gwName,
  phaseNote,
  pluralN,
  pts,
  ord,
  gwsRemaining,
  spellN,
  fplAvgComparisonPhrase,
} from "./season-story-copy"
import { composeStory, type StoryLine } from "./season-story-seed"

function fixtureLine(f: SeasonStoryFacts): string {
  const ctx = f.fixtureContext
  if (!ctx) return ""
  if (ctx.isDGW && ctx.dgwTeamNames.length > 0) {
    return `A double gameweek shaped the wider game, with ${ctx.dgwTeamNames.slice(0, 4).join(", ")} among the clubs facing twice.`
  }
  if (ctx.isBGW && ctx.bgwTeamNames.length > 0) {
    return `A blank gameweek removed several clubs from the schedule, including ${ctx.bgwTeamNames.slice(0, 4).join(", ")}.`
  }
  return ""
}

// ─── GW1 Lede ────────────────────────────────────────────────────────────────

const GW1_LEDE_A: StoryLine[] = [
  (f) => `The ${f.leagueName} season is under way.`,
  (f) => `Opening night in ${f.leagueName} has arrived.`,
  (f) => `${f.leagueName} finally has its first set of results.`,
  (f) => `The campaign has begun in ${f.leagueName}.`,
  (f) => `Week one is in the books for ${f.leagueName}.`,
  (f) => `A new ${f.leagueName} season starts with real scores on the board.`,
  (f) => `The first whistle has blown on ${f.leagueName}.`,
  (f) => `Gameweek one has given ${f.leagueName} its opening storyline.`,
  (f) => `Every mini-league needs a beginning. This is yours.`,
  (f) => `${f.leagueName} kicks off with bragging rights already on the line.`,
  (f) => `The opening chapter of ${f.leagueName} is written.`,
  (f) => `First blood in ${f.leagueName} has been drawn.`,
  (f) => `The curtain rises on ${f.leagueName}.`,
  (f) => `Bragging rights are already on the line in ${f.leagueName}.`,
  (f) => `${f.leagueName} has its first leaderboard.`,
  (f) => `The race begins in ${f.leagueName}.`,
  (f) => `Gameweek one delivered the first verdict in ${f.leagueName}.`,
  (f) => `The season opener in ${f.leagueName} is complete.`,
  (f) => `${f.leagueName} has a first weekly winner.`,
  (f) => `The opening weekend in ${f.leagueName} is done.`,
  (f) => `Week one sets the tone for ${f.leagueName}.`,
  (f) => `The first scores are in for ${f.leagueName}.`,
  (f) => `${f.leagueName} has lift-off.`,
]

const GW1_LEDE_B: StoryLine[] = [
  (f) => `${f.gwWinner.manager} and ${f.gwWinner.team} set the early standard with ${pts(f.gwWinner.gwPts)}, the best return among ${spellN(f.leagueSize)} managers.`,
  (f) => `${f.gwWinner.team} topped the weekly charts on ${pts(f.gwWinner.gwPts)}, with ${f.gwWinner.manager} claiming the first honours.`,
  (f) => `Nobody in ${f.leagueName} matched ${f.gwWinner.team} this week. ${f.gwWinner.manager} posted ${pts(f.gwWinner.gwPts)}.`,
  (f) => `The weekly crown goes to ${f.gwWinner.team} after ${pts(f.gwWinner.gwPts)} from ${f.gwWinner.manager}.`,
  (f) => `${f.gwWinner.team} led the scoring race on ${pts(f.gwWinner.gwPts)}.`,
  (f) => `Top scorer: ${f.gwWinner.team} (${pts(f.gwWinner.gwPts)}), managed by ${f.gwWinner.manager}.`,
  (f) => `${f.gwWinner.manager} delivered the week's peak score of ${pts(f.gwWinner.gwPts)} with ${f.gwWinner.team}.`,
  (f) => `The number to beat was ${pts(f.gwWinner.gwPts)}, posted by ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} finished clear of the field on ${pts(f.gwWinner.gwPts)}.`,
  (f) => `First weekly winner: ${f.gwWinner.team}, courtesy of ${pts(f.gwWinner.gwPts)}.`,
  (f) => `${f.gwWinner.manager}'s ${pts(f.gwWinner.gwPts)} set the tone for everyone else.`,
  (f) => `The early pace-setter was ${f.gwWinner.team} on ${pts(f.gwWinner.gwPts)}.`,
  (f) => `${f.gwWinner.team} set the bar at ${pts(f.gwWinner.gwPts)}.`,
  (f) => `The opening weekly high came from ${f.gwWinner.manager} on ${pts(f.gwWinner.gwPts)}.`,
  (f) => `${pts(f.gwWinner.gwPts)} was the score that framed everyone else's week.`,
  (f) => `${f.gwWinner.team} owned the weekly chart with ${pts(f.gwWinner.gwPts)}.`,
  (f) => `The first weekly bragging rights go to ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.manager} struck first with ${pts(f.gwWinner.gwPts)}.`,
  (f) => `Week one's best return: ${pts(f.gwWinner.gwPts)} from ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} posted the week's benchmark of ${pts(f.gwWinner.gwPts)}.`,
  (f) => `The opening honours belong to ${f.gwWinner.team} on ${pts(f.gwWinner.gwPts)}.`,
  (f) => `${f.gwWinner.manager} leads the weekly conversation after ${pts(f.gwWinner.gwPts)}.`,
  (f) => `The first statement score was ${pts(f.gwWinner.gwPts)} from ${f.gwWinner.team}.`,
  (f) => `${f.gwWinner.team} drew first blood on ${pts(f.gwWinner.gwPts)}.`,
]

const GW1_LEDE_C: StoryLine[] = [
  (f) => phaseNote(f.gw, f.phase, f.leagueName),
  (f) => `The wider FPL average was ${pts(f.fplAvg)}; inside ${f.leagueName}, the mean was ${pts(Math.round(f.leagueAvgGwPts))}.`,
  (f) => `${spellN(f.beatAvgCount)} managers here beat the global average of ${pts(f.fplAvg)}.`,
  (f) => `This was a ${f.leaguePersonality.toLowerCase()} to open the season.`,
  (f) => `${pts(f.pointsSpread)} already separate first from last in ${f.leagueName}.`,
  (f) => `The league average sat at ${pts(Math.round(f.leagueAvgGwPts))} against ${pts(f.fplAvg)} across FPL.`,
  (f) => `First impressions matter, and ${f.leagueName} made a lively one.`,
  (f) => `The opening week felt like a ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `Plenty of talking points already, with ${spellN(f.leagueSize)} managers in the mix.`,
  (f) => `The season is only just underway, but the hierarchy has a first draft.`,
  (f) => `One gameweek down, plenty of football and FPL still to come.`,
  (f) => `The story of ${f.leagueName} starts here.`,
  (f) => `The opening returns set the early mood in ${f.leagueName}.`,
  (f) => `Week one gave ${f.leagueName} its first talking points.`,
  (f) => `The competitive texture of ${f.leagueName} is already visible.`,
  (f) => `Early returns suggest a ${f.leaguePersonality.toLowerCase()} mini-league.`,
  (f) => `${spellN(f.leagueSize)} managers, one opening verdict.`,
  (f) => `The first weekend told us plenty about ${f.leagueName}.`,
  (f) => `The global curve was ${pts(f.fplAvg)}; ${f.leagueName} lived at ${pts(Math.round(f.leagueAvgGwPts))}.`,
  (f) => `The opening numbers already sketch a picture.`,
  (f) => `First-week context matters, and ${f.leagueName} has plenty.`,
  (f) => `The season's first page is written.`,
  (f) => `Everyone has a reference point now.`,
  (f) => `The opener set expectations for ${f.leagueName}.`,
]

export function poolLedeGW1(f: SeasonStoryFacts): string {
  const fix = fixtureLine(f)
  const base = sanitizeParagraph(composeStory(f, "lede", [GW1_LEDE_A, GW1_LEDE_B, GW1_LEDE_C]))
  return fix ? sanitizeParagraph(`${base} ${fix}`) : base
}

// ─── Later lede ─────────────────────────────────────────────────────────────

const LATER_LEDE_A: StoryLine[] = [
  (f) => `${gwName(f.gw)} has added another chapter to ${f.leagueName}.`,
  (f) => `Another gameweek is in the books for ${f.leagueName}.`,
  (f) => `${gwName(f.gw)} brought fresh drama to ${f.leagueName}.`,
  (f) => `The ${f.leagueName} table has shifted after ${gwName(f.gw)}.`,
  (f) => `${f.leagueName} has processed ${gwName(f.gw)}.`,
  (f) => `The dust has settled on ${gwName(f.gw)} in ${f.leagueName}.`,
  (f) => `${gwName(f.gw)} delivered talking points across ${f.leagueName}.`,
  (f) => `Week ${f.gw} is logged for ${f.leagueName}.`,
  (f) => `${f.leagueName} moves on from ${gwName(f.gw)} with new subplots.`,
  (f) => `The ${f.leagueName} narrative advanced in ${gwName(f.gw)}.`,
  (f) => `${gwName(f.gw)} reshaped the mood in ${f.leagueName}.`,
  (f) => `Another weekend, another layer of context in ${f.leagueName}.`,
  (f) => `${gwName(f.gw)} left fingerprints all over ${f.leagueName}.`,
  (f) => `The latest instalment of ${f.leagueName} is complete.`,
  (f) => `${f.leagueName} has another week of history.`,
  (f) => `The story moved on in ${gwName(f.gw)}.`,
  (f) => `${gwName(f.gw)} added colour to the ${f.leagueName} season.`,
  (f) => `Another deadline, another set of scores in ${f.leagueName}.`,
  (f) => `The ${f.leagueName} plot thickened in ${gwName(f.gw)}.`,
  (f) => `${gwName(f.gw)} gave ${f.leagueName} fresh material.`,
  (f) => `The weekly cycle turned again in ${f.leagueName}.`,
  (f) => `${f.leagueName} absorbed ${gwName(f.gw)}.`,
  (f) => `The season rolled forward in ${f.leagueName}.`,
  (f) => `${gwName(f.gw)} is now part of the ${f.leagueName} record.`,
]

const LATER_LEDE_C: StoryLine[] = [
  (f) => phaseNote(f.gw, f.phase, f.leagueName),
  (f) => `This was a ${f.leaguePersonality.toLowerCase()} in ${f.leagueName}.`,
  (f) => `${spellN(f.beatAvgCount)} of ${spellN(f.leagueSize)} managers beat the ${pts(f.fplAvg)} FPL average.`,
  (f) => `The internal league average was ${pts(Math.round(f.leagueAvgGwPts))}.`,
  (f) => `${f.leagueName} lived ${f.leagueAvgGwPts >= f.fplAvg ? "above" : "below"} the global curve this week.`,
  (f) => `The weekly high of ${pts(f.gwWinner.gwPts)} framed every other result.`,
  (f) => `${pts(f.pointsSpread)} points cover the table from top to bottom.`,
  (f) => `Momentum, mistakes, and captaincy all played their part.`,
  (f) => `The margins told as much of the story as the headline scores.`,
  (f) => `Rivals will be studying this week's returns carefully.`,
  (f) => `The league picture is a little clearer after ${gwName(f.gw)}.`,
  (f) => `Another deadline passed, another set of scores on the board.`,
  (f) => `The weekly context shifted again in ${f.leagueName}.`,
  (f) => `Template and timing both mattered in ${gwName(f.gw)}.`,
  (f) => `The competitive temperature in ${f.leagueName} is visible in the numbers.`,
  (f) => `This week added another layer to the title race.`,
  (f) => `The gap between good and great was on display.`,
  (f) => `Every manager in ${f.leagueName} has a new reference point.`,
  (f) => `The weekly story is never just one score.`,
  (f) => `Context matters, and ${gwName(f.gw)} supplied plenty.`,
  (f) => `The league mean was ${pts(Math.round(f.leagueAvgGwPts))} against ${pts(f.fplAvg)} globally.`,
  (f) => `Another chapter, another set of winners and losers.`,
  (f) => `The rhythm of the season continues in ${f.leagueName}.`,
  (f) => `${gwName(f.gw)} will be debated long after the deadline.`,
]

export function poolLedeLater(f: SeasonStoryFacts): string {
  const fix = fixtureLine(f)
  const base = sanitizeParagraph(composeStory(f, "lede", [LATER_LEDE_A, GW1_LEDE_B, LATER_LEDE_C]))
  return fix ? sanitizeParagraph(`${base} ${fix}`) : base
}

// ─── Standings GW1 ───────────────────────────────────────────────────────────

const GW1_STAND_A: StoryLine[] = [
  (f) => `After the opening gameweek, ${f.leader.team} leads ${f.leagueName}.`,
  (f) => `${f.leader.manager} and ${f.leader.team} head the table after gameweek one.`,
  (f) => `The opening standings have ${f.leader.team} in front.`,
  (f) => `First place after week one: ${f.leader.team}.`,
  (f) => `${f.leader.team} sits top of ${f.leagueName} after the opener.`,
  (f) => `The early summit belongs to ${f.leader.manager} and ${f.leader.team}.`,
  (f) => `${f.leagueName} has its first leader: ${f.leader.team}.`,
  (f) => `Someone had to strike first. ${f.leader.team} did.`,
  (f) => `The first leaderboard has ${f.leader.team} on top.`,
  (f) => `${f.leader.team} holds the early advantage in ${f.leagueName}.`,
  (f) => `The opening table is led by ${f.leader.team}.`,
  (f) => `${f.leader.manager} sits first after gameweek one.`,
]

const GW1_STAND_B: StoryLine[] = [
  (f) => `${f.leader.totalPts} points put them ahead of the field.`,
  (f) => `They lead on ${f.leader.totalPts} points.`,
  (f) => `The early total is ${f.leader.totalPts} points.`,
  (f) => `${f.leader.manager} tops the chart on ${f.leader.totalPts}.`,
  (f) => `Their opening return totals ${f.leader.totalPts} points.`,
  (f) => `${f.leader.totalPts} is the number everyone else is chasing.`,
  (f) => `The first leaderboard reads ${f.leader.totalPts} for ${f.leader.team}.`,
  (f) => `On ${f.leader.totalPts} points, they set the early pace.`,
  (f) => `The benchmark is ${f.leader.totalPts} points.`,
  (f) => `${f.leader.totalPts} points is the early target.`,
  (f) => `The summit score is ${f.leader.totalPts}.`,
  (f) => `${f.leader.team} leads on ${f.leader.totalPts}.`,
]

const GW1_STAND_C: StoryLine[] = [
  (f) => f.second ? `${f.second.team} is closest on ${f.second.totalPts}, just ${pts(f.gapFirstSecond)} back.` : `The chasing pack is already forming.`,
  (f) => `It is far too early to call the league, but the pecking order has begun.`,
  (f) => `${pts(f.pointsSpread)} points separate first from last already.`,
  (f) => `The first leaderboard of the season is on the wall.`,
  (f) => `Plenty of season left, but ${f.leader.manager} enjoys the view from the top for now.`,
  (f) => `Every rival knows who they are hunting.`,
  (f) => `The race is young, yet someone leads it.`,
  (f) => `Week one always creates an early reference point. This is yours.`,
  (f) => `The early hierarchy in ${f.leagueName} has a name at the top.`,
  (f) => `Nobody owns the title yet, but ${f.leader.team} leads the chase.`,
  (f) => `The opening order will change, but not the fact that ${f.leader.team} struck first.`,
  (f) => `First place is occupied. The rest of the table knows it.`,
]

export function poolStandingsGW1(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "standings", [GW1_STAND_A, GW1_STAND_B, GW1_STAND_C]))
}

// ─── Standings later ─────────────────────────────────────────────────────────

const LATER_STAND_A: StoryLine[] = GW1_STAND_A.map((fn) => (f) => {
  const line = fn(f)
  return line.replace("after gameweek one", `after ${pluralN(f.gw, "gameweek")}`).replace("after the opener", `after ${pluralN(f.gw, "gameweek")}`)
})

const LATER_STAND_B: StoryLine[] = [
  (f) => f.newLeader && f.leaderChangedFrom ? `There was a change at the top: ${f.leader.team} replaced ${f.leaderChangedFrom.team} as leader.` : f.gw >= 2 ? `${f.leader.team} held their position at the summit.` : "",
  (f) => f.second ? `${f.second.team} trails by ${pts(f.gapFirstSecond)} on ${f.second.totalPts}.` : "",
  (f) => f.tightLeague && f.gw >= 3 ? `This remains a tight league, with ${pts(f.pointsSpread)} from first to last.` : "",
  (f) => f.runawayLeader ? `A ${pts(f.gapFirstSecond)}-point cushion is starting to look significant.` : "",
  (f) => `${pts(f.pointsSpread)} points span the full ${f.leagueName} table.`,
  (f) => `The chasing pack still has time to respond.`,
  (f) => `Every point at the top carries extra weight now.`,
  (f) => `The season total matters as much as the weekly score.`,
  (f) => `${f.leader.manager} leads on ${f.leader.totalPts} overall.`,
  (f) => `The summit score is ${f.leader.totalPts} points.`,
  (f) => `${f.leader.team} remains the benchmark in ${f.leagueName}.`,
  (f) => `The title picture centres on ${f.leader.team}.`,
]

const LATER_STAND_C: StoryLine[] = [
  (f) => phaseNote(f.gw, f.phase, f.leagueName),
  (f) => `The standings are taking shape across ${f.leagueName}.`,
  (f) => `There is still a long road ahead in the title race.`,
  (f) => `Rivals will be plotting their response before the next deadline.`,
  (f) => `${f.leader.manager} will not assume this lead is safe.`,
  (f) => `The table never lies, even when the season is young.`,
  (f) => `Mini-league pressure builds from the top down.`,
  (f) => `Another week, another reference point at the summit.`,
  (f) => `The leaderboard tells its own story after ${gwName(f.gw)}.`,
  (f) => `First place is still worth fighting for.`,
  (f) => `The summit remains the prize in ${f.leagueName}.`,
  (f) => `The race for the top continues.`,
]

export function poolStandingsLater(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "standings", [LATER_STAND_A, LATER_STAND_B, LATER_STAND_C]))
}

// ─── Podium GW1 ────────────────────────────────────────────────────────────────

const GW1_POD_A: StoryLine[] = [
  (f) => `The opening top three: ${f.podium.map((p) => p.team).join(", ")}.`,
  (f) => `After gameweek one, the podium reads ${f.podium.map((p) => p.team).join(", ")}.`,
  (f) => `First-week podium: ${f.podium.map((p, i) => `${ord(i + 1)} ${p.team}`).join(", ")}.`,
  (f) => `The early top three is ${f.podium.map((p) => p.team).join(", ")}.`,
  (f) => `${f.leagueName} begins with ${f.podium[0]?.team ?? "the leader"} at the sharp end.`,
  (f) => `The first podium line-up is set.`,
  (f) => `Three names lead the early charge in ${f.leagueName}.`,
  (f) => `The opening hierarchy starts with ${f.podium.map((p) => p.team).join(", ")}.`,
]

const GW1_POD_B: StoryLine[] = [
  (f) => `That is where ${f.leagueName} starts the season.`,
  (f) => `Every campaign needs a reference point at the top. This is it.`,
  (f) => `The early leaders will enjoy the view while it lasts.`,
  (f) => `Plenty can change, but this is the first draft of the podium.`,
  (f) => `The sharp end of ${f.leagueName} has its opening cast.`,
  (f) => `Week one establishes who struck first at the top.`,
  (f) => `The opening three will set the early tone for the league.`,
  (f) => `First blood at the summit belongs to this trio.`,
]

export function poolPodiumGW1(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "podium", [GW1_POD_A, GW1_POD_B]))
}

// ─── Personal GW1 ─────────────────────────────────────────────────────────────

const GW1_PERSONAL_A: StoryLine[] = [
  (f) => !f.user ? "" : f.user.rank === 1 ? `You top the league after the opening gameweek with ${pts(f.user.gwPts)}.` : `Your opening gameweek brought ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place in ${f.leagueName}.`,
  (f) => !f.user ? "" : `From your side of the table, gameweek one delivered ${pts(f.user.gwPts)} and ${ord(f.user.rank)} place.`,
  (f) => !f.user ? "" : `Your first result: ${pts(f.user.gwPts)}, ${ord(f.user.rank)} in ${f.leagueName}.`,
  (f) => !f.user ? "" : `You open the season on ${pts(f.user.gwPts)} in ${ord(f.user.rank)} place.`,
  (f) => !f.user ? "" : f.user.rank === 1 ? `You lead ${f.leagueName} after week one.` : `You sit ${ord(f.user.rank)} in ${f.leagueName} after the opener.`,
  (f) => !f.user ? "" : `Your campaign begins with ${pts(f.user.gwPts)} on the board.`,
  (f) => !f.user ? "" : `Gameweek one for you: ${pts(f.user.gwPts)}, rank ${f.user.rank}.`,
  (f) => !f.user ? "" : `The season starts with you on ${pts(f.user.gwPts)}.`,
]

const GW1_PERSONAL_B: StoryLine[] = [
  (f) => !f.user ? "" : f.gapToLeader > 0 ? `You trail ${f.leader.team} by ${pts(f.gapToLeader)}.` : f.user.rank === 1 ? `The target is on your back already.` : `You share top spot.`,
  (f) => !f.user ? "" : fplAvgComparisonPhrase(f.user.gwPts, f.fplAvg),
  (f) => !f.user ? "" : `Plenty of time to change the picture.`,
  (f) => !f.user ? "" : `The season is only just underway.`,
  (f) => !f.user ? "" : `One gameweek down, many more to play.`,
  (f) => !f.user ? "" : `The long game starts now.`,
  (f) => !f.user ? "" : `Early days, but your path is set.`,
  (f) => !f.user ? "" : `Week one is never the whole story.`,
]

export function poolPersonalGW1(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "personal", [GW1_PERSONAL_A, GW1_PERSONAL_B]))
}

// ─── Spoon GW1 ─────────────────────────────────────────────────────────────────

const GW1_SPOON_A: StoryLine[] = [
  (f) => `${f.woodenSpoon.team} props up the table after the opening gameweek.`,
  (f) => `At the foot of ${f.leagueName} after week one: ${f.woodenSpoon.team}.`,
  (f) => `Last place after the opener belongs to ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.team} anchors the bottom after gameweek one.`,
  (f) => `The basement after week one: ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.manager} and ${f.woodenSpoon.team} sit last after the opener.`,
  (f) => `The wooden spoon position after week one goes to ${f.woodenSpoon.team}.`,
  (f) => `${f.woodenSpoon.team} is propping up ${f.leagueName} after the first gameweek.`,
]

const GW1_SPOON_B: StoryLine[] = [
  (f) => f.secondBottom && f.spoonRaceGap <= 8 ? `${f.secondBottom.team} sits just ${pts(f.spoonRaceGap)} above last place.` : `A long season remains to climb out.`,
  (f) => `There is a full season ahead to climb.`,
  (f) => `Week one is never the whole story at the bottom.`,
  (f) => `Plenty of gameweeks left to escape the basement.`,
  (f) => `The opener is just the starting point, even at the foot of the table.`,
  (f) => `Nobody wins a mini-league in gameweek one. Nobody loses it either.`,
  (f) => `The bottom rung is occupied, but the ladder is long.`,
  (f) => `Early last place is a position, not a sentence.`,
]

export function poolSpoonGW1(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "spoon", [GW1_SPOON_A, GW1_SPOON_B]))
}

// ─── Coda GW1 ──────────────────────────────────────────────────────────────────

const GW1_CODA_A: StoryLine[] = [
  (f) => `The opening gameweek is in the books.`,
  (f) => `Gameweek one is done in ${f.leagueName}.`,
  (f) => `Week one is complete.`,
  (f) => `The first chapter of ${f.leagueName} is written.`,
  (f) => `The campaign has its opening page.`,
  (f) => `The season has officially started.`,
  (f) => `The first set of results is in.`,
  (f) => `Opening night is over.`,
]

const GW1_CODA_B: StoryLine[] = [
  (f) => `${f.leader.team} lead, ${f.gwWinner.team} won the week.`,
  (f) => `${f.gwWinner.team} take the weekly honours; ${f.leader.team} top the table.`,
  (f) => `${f.leader.manager} sits first; ${f.gwWinner.team} posted the best score.`,
  (f) => `The early leader is ${f.leader.team}; the weekly high came from ${f.gwWinner.team}.`,
  (f) => `${f.leader.team} head the standings after a ${pts(f.gwWinner.gwPts)}-point statement from ${f.gwWinner.team}.`,
  (f) => `Bragging rights for the week go to ${f.gwWinner.team}.`,
  (f) => `${f.leader.team} are top; ${f.gwWinner.team} set the weekly pace.`,
  (f) => `The table and the weekly chart both have early names on them.`,
]

const GW1_CODA_C: StoryLine[] = [
  (f) => `${gwsRemaining(f.gw).charAt(0).toUpperCase() + gwsRemaining(f.gw).slice(1)} in ${f.leagueName}.`,
  (f) => `A full season lies ahead.`,
  (f) => `The story starts here.`,
  (f) => `Roll on gameweek two.`,
  (f) => `The narrative is only getting started.`,
  (f) => `Plenty of football and FPL still to come.`,
  (f) => `The long road begins now.`,
  (f) => `Until next week, ${f.leagueName}.`,
]

export function poolCodaGW1(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "coda", [GW1_CODA_A, GW1_CODA_B, GW1_CODA_C]))
}

// ─── Personality ───────────────────────────────────────────────────────────────

const PERSONALITY_A: StoryLine[] = [
  (f) => isFirstGameweek(f.gw) ? `Label the opening week and you get a ${f.leaguePersonality.toLowerCase()}.` : `If you had to label ${gwName(f.gw)}, it was a ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `The mood of the week? A ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `This played out as a ${f.leaguePersonality.toLowerCase()} in ${f.leagueName}.`,
  (f) => `Characterise ${gwName(f.gw)} and the phrase is simple: a ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `The week's personality in ${f.leagueName}: a ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `Strip it back and ${f.leagueName} had a ${f.leaguePersonality.toLowerCase()} feel.`,
  (f) => `The tone of ${gwName(f.gw)} was unmistakably a ${f.leaguePersonality.toLowerCase()}.`,
  (f) => `In one line: a ${f.leaguePersonality.toLowerCase()} for ${f.leagueName}.`,
]

const PERSONALITY_B: StoryLine[] = [
  (f) => `The internal average of ${pts(Math.round(f.leagueAvgGwPts))} compared with ${pts(f.fplAvg)} across FPL.`,
  (f) => `${spellN(f.beatAvgCount)} of ${spellN(f.leagueSize)} managers beat the FPL average.`,
  (f) => `${pts(f.pointsSpread)} separated top from bottom in ${f.leagueName}.`,
  (f) => `The league mean was ${pts(Math.round(f.leagueAvgGwPts))} against ${pts(f.fplAvg)} globally.`,
  (f) => `That gap between mini-league and global averages tells you plenty.`,
  (f) => `The spread across the table was ${pts(f.pointsSpread)} points.`,
  (f) => `Inside ${f.leagueName}, returns averaged ${pts(Math.round(f.leagueAvgGwPts))}.`,
  (f) => `The competitive texture of the week is clear in the numbers.`,
]

export function poolPersonality(f: SeasonStoryFacts): string {
  return sanitizeParagraph(composeStory(f, "personality", [PERSONALITY_A, PERSONALITY_B]))
}
