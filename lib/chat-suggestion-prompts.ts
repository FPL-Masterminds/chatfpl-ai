/** Rotating suggestion pills on /chat and /devchat. */

const CORE_PROMPTS = [
  "Analyse my team",
  "Best captain this gameweek?",
  "Give me 3 low-owned midfielders",
  "Who has the best fixtures in the next 4?",
  "Who should I sell this gameweek?",
  "Best budget defender under £4.5m?",
  "Which premium forward is worth it right now?",
  "Should I use my wildcard now?",
  "Best players to triple-up on this gameweek?",
  "Which midfielder has the most xG this season?",
  "Who has the easiest run of fixtures?",
  "Best bench boost candidates?",
  "Which players have the most clean sheet potential?",
  "Give me a differential captain option under 10% owned",
  "Any big controversies or talking points in the FPL community right now?",
  "What's everyone talking about in FPL this week?",
  "Who are FPL managers rushing to buy this week?",
  "Who is the community backing as captain this week and do you agree?",
  "Is there a clear captain consensus this gameweek or is it split?",
  "What's the debate around the captain pick right now?",
  "Which players are being sold en masse this week and why?",
  "Who has the best underlying xG stats but is still under the radar?",
  "Which team has the best defensive record over the last 5 gameweeks?",
  "Give me your top 3 transfer recommendations for this gameweek",
  "Which FPL assets offer the best value per million right now?",
  "Should I play my Free Hit this gameweek?",
  "Who are the standout players from teams with a Double Gameweek?",
  "What does the Reddit community think about this week's transfer moves?",
] as const

/** Inspired by top-manager dashboard themes; wording uses live FPL API proxies, not elite squad data. */
const TOP_MANAGER_PROMPTS = [
  "What does the FPL template look like among top managers this week?",
  "Who are the most owned players among top managers right now?",
  "Which players are trending in the most successful manager squads?",
  "Who are the must-have picks trending among top managers?",
  "Which defenders are essential in top manager templates?",
  "Which midfielders appear in most top manager squads?",
  "What forwards do top managers trust most?",
  "Who are the popular goalkeeper picks among strong managers?",
  "Is there a clear template forming among the best managers?",
  "Who is the most captained player trending among top managers?",
  "Which players are top managers triple-stacking?",
  "Who did top managers captain last gameweek?",
  "Which bench picks are popular among strong manager squads?",
  "What premium assets do top managers still own?",
  "Who are the differential picks still inside top manager squads?",
  "Who has the highest transfer momentum right now?",
  "Which players are rising fastest among top managers?",
  "Who is being bought heavily relative to their ownership?",
  "Which low-owned players are top managers suddenly buying?",
  "Give me transfer momentum picks under 10% owned",
  "Who are the breakout transfer momentum midfielders?",
  "Which defenders have the best transfer momentum this week?",
  "Show me forwards with massive transfer momentum",
  "Who is the next big riser among top manager squads?",
  "Which players have momentum but are still differentials?",
  "Who are top managers rushing in before price rises?",
  "Show me transfer momentum among budget enablers",
  "Who has the most net transfers in among top managers?",
  "Who are top managers selling the most?",
  "Show me the biggest net transfer trends this gameweek",
  "Which players are being transferred out by strong squads?",
  "Give me the top net transfers in from top managers",
  "Who is getting dumped from top manager squads right now?",
  "Which midfielders have the highest net transfers in?",
  "Who are the most sold defenders among top managers?",
  "Which players are falling out of top manager squads?",
  "Show me goalkeeper transfer trends among top managers",
  "Which expensive players are top managers ditching?",
  "Give me transfer trends split by position",
  "Who has the best points per million among top manager picks?",
  "Show me best value picks by total points per million",
  "Which budget defenders offer the best points per million?",
  "Who are the value forwards top managers still like?",
  "Give me midfielders with strong points per million value",
  "Who delivers the most points per million under £5m?",
  "Show me best value differentials by points per million",
  "Who is the best points per million pick in each position?",
  "Which cheap players punch above their price on points per million?",
  "Compare points per million for my transfer shortlist",
  "Who has the best form per million right now?",
  "Show me form per million leaders among top manager picks",
  "Which players combine hot form with low price?",
  "Give me form per million value in midfield",
  "Who are the best form per million defenders?",
  "Show me forwards with strong form per million",
  "Which differential has the best form per million?",
  "Compare form per million for players under £6m",
  "Who has the hottest form per million among top manager picks?",
  "Which template players have weak form per million?",
  "Who are the bonus magnets this season?",
  "Which players earn bonus points most reliably?",
  "Show me bonus per million leaders",
  "Who picks up bonus even without goals and assists?",
  "Give me bonus magnet midfielders among top squads",
  "Which defenders are bonus magnets for top managers?",
  "Show me goalkeepers with strong bonus per million",
  "Who consistently hits bonus in low-scoring games?",
  "Give me bonus per million picks under 10% owned",
  "Compare bonus magnets vs goal scorers for captaincy",
  "Who has the best expected points per million?",
  "Show me future stars by xP per million",
  "Which players have the best xP value looking ahead?",
  "Give me xP per million picks for this gameweek",
  "Who are the best xP per million defenders?",
  "Show me midfielders with strong xP per million",
  "Which forwards have the strongest xP per million?",
  "Compare xP per million for my captain shortlist",
  "Who offers the best fixture-weighted xP per million?",
  "Which differential has the best xP per million upside?",
  "Who are the best captaincy options by expected points?",
  "Show me captaincy trends from top manager squads",
  "What captaincy points would I get from the top xP picks?",
  "Who should I triple captain based on fixture and xP data?",
  "Give me captaincy picks with the best fixtures this week",
  "Which popular picks are the safest captain options?",
  "Show me differential captain options with strong xP",
  "Who did top managers captain and does xP agree?",
  "Give me triple captain candidates from live squad trends",
  "Show me captain options under 15% owned with high xP",
  "Is the template captain the right statistical pick?",
  "Who are the hidden gems trending among top managers?",
  "Show me low-owned players with hot form in strong squads",
  "Which players are under 10% owned but top managers love?",
  "Give me hidden gem midfielders with strong form",
  "Who are the hidden gem defenders right now?",
  "Show me forwards that are differentials with strong form",
  "Which hidden gems have positive net transfers among top managers?",
  "Give me hidden gems with good fixtures coming up",
  "Which differential has strong form and rising ownership?",
  "Show me hidden gems that also score well on xP per million",
] as const

function dedupePrompts(prompts: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const prompt of prompts) {
    const key = prompt.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(prompt)
  }
  return out
}

export const CHAT_SUGGESTION_PROMPTS = dedupePrompts([
  ...CORE_PROMPTS,
  ...TOP_MANAGER_PROMPTS,
])

export function buildGWPrompts(gw: number | null, hasDGW: boolean): string[] {
  const label = gw ? `GW${gw}` : "this gameweek"
  const gwPrompts: string[] = [
    `Who are the best differential picks for ${label}?`,
    `Give me differentials under 10% ownership with strong underlying xG/xA for ${label}`,
    `Captaincy options for ${label} - give me Reddit consensus vs statistical pick`,
  ]
  if (hasDGW) {
    gwPrompts.push(`DGW landscape - who are the must-haves and traps for ${label}?`)
  }
  return gwPrompts
}

export function pickChatSuggestionPrompts(
  gw: number | null = null,
  hasDGW = false,
  comparisonPrompt: string | null = null,
): string[] {
  const gwPrompts = buildGWPrompts(gw, hasDGW)
  const shuffledGW = [...gwPrompts].sort(() => Math.random() - 0.5)
  const shuffledStatic = [...CHAT_SUGGESTION_PROMPTS].sort(() => Math.random() - 0.5)
  const gwPick = shuffledGW.slice(0, 2)
  const staticPick = shuffledStatic.slice(0, comparisonPrompt ? 1 : 2)
  const picks = [...gwPick, ...staticPick]
  if (comparisonPrompt) picks.push(comparisonPrompt)
  return picks.sort(() => Math.random() - 0.5)
}
