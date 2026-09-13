/** Rotating suggestion pills on /chat and /devchat. */

const CORE_PROMPTS = [
  "Analyse my team using form, xP and fixtures, not vibes",
  "Rank my starting XI by expected points this gameweek",
  "Which of my players has the weakest form per million?",
  "Best captain this gameweek by xP, not ownership?",
  "Give me 3 low-owned midfielders with strong xG or xA",
  "Who has the best fixtures in the next 4 gameweeks?",
  "Who should I sell this gameweek based on form, xP and transfers out?",
  "Best budget defender under £4.5m by minutes and clean sheet potential?",
  "Which premium forward is worth the price on xG and xP right now?",
  "Should I use my wildcard now based on my fixture run?",
  "Best players to triple-up on this gameweek by fixture and xP?",
  "Which midfielder has the most xG this season?",
  "Who has the easiest run of fixtures by FDR?",
  "Best bench boost candidates by minutes and xP?",
  "Which players have the most clean sheet potential in the next 4?",
  "Give me a differential captain under 10% owned with high xP",
  "Any big controversies or talking points in the FPL community right now?",
  "What's everyone talking about in FPL this week?",
  "Who are FPL managers rushing to buy this week by transfers in?",
  "Who is the community backing as captain this week and do you agree on xP?",
  "Is there a clear captain consensus this gameweek or is it split?",
  "What's the debate around the captain pick right now?",
  "Which players are being sold en masse this week and why?",
  "Who has the best underlying xG but is still under 10% owned?",
  "Which team has the best defensive record over the last 5 gameweeks?",
  "Give me your top 3 transfer recommendations using xP, form and price",
  "Which FPL assets offer the best value per million right now?",
  "Should I play my Free Hit this gameweek?",
  "Who are the standout players from teams with a Double Gameweek?",
  "What does the Reddit community think about this week's transfer moves?",
] as const

/**
 * Data-led questions ChatFPL can answer from live FPL API fields:
 * price, form, ppg, ownership, transfers in/out, minutes, xP, goals, assists,
 * clean sheets, xG/xA/xGI/xGC, bonus/BPS, ICT, DEFCON, fixtures/FDR, fitness.
 * Softened "top manager" wording uses ownership and transfer trends as proxies.
 */
const DATA_LED_PROMPTS = [
  // Ownership and template
  "Who are the highest-owned players in FPL right now?",
  "Which defenders sit above 20% ownership this week?",
  "Which midfielders sit above 20% ownership this week?",
  "Which forwards sit above 15% ownership this week?",
  "Who is the highest-owned goalkeeper right now?",
  "Show me the template XI by ownership this gameweek",
  "Which highly owned players have the weakest xP this week?",
  "Which highly owned players have poor fixtures coming up?",
  "Who is overowned relative to their expected points?",
  "Which popular picks look like traps on the underlying numbers?",
  "Is there a clear template forming by ownership this week?",
  "Which premium assets have the highest ownership?",
  "Which budget enablers are above 10% owned?",
  "Who is high-owned but transferring out fast?",
  "Which 30%+ owned players would you avoid this week?",

  // Price and budget
  "Best player under £4.5m by form this season?",
  "Best player under £5.0m by expected points this week?",
  "Best player under £6.0m by xG plus xA?",
  "Best defender under £4.5m with 90+ minutes most weeks?",
  "Best midfielder under £6.5m on xGI this season?",
  "Best forward under £7.0m by xP this week?",
  "Best goalkeeper under £4.5m by saves and clean sheets?",
  "Who is the best £4.0m enabler that actually plays?",
  "Which £8.0m+ midfielders are earning their price on xP?",
  "Which expensive players have the worst points per million?",
  "Give me a £100m-style squad built from form and xP, not names",
  "Where should I spend the extra £1.0m in my squad?",
  "Is it better to spend up in midfield or attack on xP per million?",
  "Which position has the best value under £5.5m right now?",
  "Show me nailed starters under £4.5m by minutes played",

  // Form
  "Who has the best form in the league right now?",
  "Which defenders have the hottest form this week?",
  "Which midfielders have the hottest form this week?",
  "Which forwards have the hottest form this week?",
  "Who has strong form but is still under 8% owned?",
  "Which high-owned players have gone cold on form?",
  "Compare form versus expected points for the top 10 owned players",
  "Who has the biggest gap between hot form and low xP next?",
  "Which players have form above 7.0 and a good next fixture?",
  "Show me form leaders who also play 80+ minutes a week",
  "Who is in form but flagged as a doubt?",
  "Which of the form leaders has the easiest next 3 fixtures?",

  // Expected points
  "Who has the highest expected points this gameweek?",
  "Rank the top 10 players by xP next, not ownership",
  "Which defenders have the highest xP this week?",
  "Which midfielders have the highest xP this week?",
  "Which forwards have the highest xP this week?",
  "Who has high xP but under 10% ownership?",
  "Which players have xP above 6.0 this week?",
  "Does the highest-owned captain also have the highest xP?",
  "Show me xP leaders with FDR 3 or easier this week",
  "Which players have strong xP but a blank or tough fixture?",
  "Who has the best xP per million this gameweek?",
  "Give me a captain shortlist of 5 ranked only by xP",
  "Which goalkeepers have the highest xP this week?",
  "Who looks overpriced once you sort by xP next?",
  "Compare xP for the three most transferred-in players",

  // Transfers and momentum
  "Who has the most transfers in this gameweek?",
  "Who has the most transfers out this gameweek?",
  "Show me the biggest net transfers in this gameweek",
  "Show me the biggest net transfers out this gameweek",
  "Who is being bought heavily relative to their ownership?",
  "Which low-owned players have the highest transfer momentum?",
  "Give me transfer momentum picks under 10% owned",
  "Who are the breakout transfer-in midfielders this week?",
  "Which defenders have the best transfer momentum this week?",
  "Show me forwards with the biggest transfers-in spike",
  "Which players have momentum but are still differentials?",
  "Who is being rushed in before a likely price rise?",
  "Show me transfer momentum among budget enablers",
  "Which midfielders have the highest net transfers in?",
  "Who are the most sold defenders this gameweek?",
  "Which expensive players are being ditched this week?",
  "Give me transfer trends split by position",
  "Who has huge transfers in but weak xP this week?",
  "Which transfer-in targets have the best fixtures coming?",
  "Who is a bandwagon buy with poor underlying xG?",
  "Which players have more transfers out than in despite good form?",
  "Show me goalkeeper transfer trends this gameweek",

  // Value: points / form / xP per million
  "Who has the best points per million in FPL this season?",
  "Show me best value picks by total points per million",
  "Which budget defenders offer the best points per million?",
  "Give me midfielders with the strongest points per million",
  "Who delivers the most points per million under £5.0m?",
  "Show me best value differentials by points per million",
  "Who is the best points per million pick in each position?",
  "Which cheap players punch above their price on points per million?",
  "Compare points per million for my likely transfer targets",
  "Who has the best form per million right now?",
  "Which players combine hot form with a low price?",
  "Give me form per million leaders in midfield",
  "Who are the best form per million defenders?",
  "Show me forwards with strong form per million",
  "Which differential has the best form per million?",
  "Compare form per million for players under £6.0m",
  "Which template players have weak form per million?",
  "Who has the best expected points per million this week?",
  "Give me xP per million picks for this gameweek",
  "Who are the best xP per million defenders?",
  "Show me midfielders with strong xP per million",
  "Which forwards have the strongest xP per million?",
  "Which differential has the best xP per million upside?",
  "Is a £4.5m defender better value than a £5.5m one on points per million?",

  // Bonus and BPS
  "Who are the bonus magnets this season by total bonus?",
  "Which players earn the most bonus points per 90 minutes?",
  "Show me bonus per million leaders",
  "Who picks up bonus even without goals and assists?",
  "Give me bonus-magnet midfielders under 15% owned",
  "Which defenders are the strongest bonus magnets?",
  "Show me goalkeepers with strong bonus and BPS",
  "Give me bonus per million picks under 10% owned",
  "Compare bonus magnets versus goal scorers for captaincy",
  "Who has the highest BPS this season?",
  "Which cheap players quietly rack up BPS every week?",
  "Is bonus a good reason to pick a defender this week?",

  // xG, xA, xGI
  "Who has the highest xG this season?",
  "Who has the highest xA this season?",
  "Who has the highest xGI this season?",
  "Which midfielders lead the league for xG?",
  "Which forwards are outperforming their xG?",
  "Which forwards are underperforming their xG?",
  "Who has strong xA but few actual assists so far?",
  "Give me under-the-radar xGI picks under 8% owned",
  "Which defenders have surprising xG or xA?",
  "Who has the best xGI per million?",
  "Show me players with high xG but tough fixtures next",
  "Which attacking mids have xGI that does not match their ownership?",
  "Who would you buy on xG alone this week?",
  "Compare xG and xA for the two most popular forwards",

  // Fixtures and FDR
  "Who has the easiest fixture this gameweek by FDR?",
  "Which teams have the best next 4 fixtures?",
  "Which teams have the worst next 4 fixtures?",
  "Give me defenders from teams with FDR 2 or easier this week",
  "Which attackers have home fixtures with FDR 3 or easier?",
  "Who has a kind fixture run but is still low owned?",
  "Which high-owned players have a brutal next 3 fixtures?",
  "Should I move to the team with the best fixture run?",
  "Which midfielders have the best 4-week fixture swing?",
  "Who is worth holding through one tough fixture on xP?",
  "Show me players with two of the next three at home",
  "Which clubs look like a 3-week transfer target on FDR?",

  // Clean sheets, xGC, defence
  "Which teams have the lowest xGC this season?",
  "Which defenders have the most clean sheets so far?",
  "Who are the best clean sheet plays this gameweek?",
  "Give me defensive assets from low-xGC teams under £5.0m",
  "Which goalkeepers have the best save numbers this season?",
  "Is the most owned defence actually the best on xGC?",
  "Which popular defenders look leaky on goals conceded?",
  "Show me defence pairs worth considering from the same club",

  // Minutes and rotation
  "Which cheap players are actually nailed on minutes?",
  "Who looks rotated despite high ownership?",
  "Show me midfielders with 80+ minutes most weeks under £6.5m",
  "Which defenders have started every game so far?",
  "Who has great stats but not enough minutes to trust?",
  "Give me rotation risks I should avoid this week",
  "Which £4.5m defenders play enough minutes to be useful?",
  "Who is a minutes trap at a premium price?",

  // DEFCON
  "Which defenders have the highest DEFCON actions per 90?",
  "Which midfielders have the highest DEFCON actions per 90?",
  "Give me DEFCON defenders under £5.0m",
  "Who is a DEFCON specialist but still under 10% owned?",
  "Compare DEFCON workload for the top budget defenders",
  "Is there a midfielder worth buying mainly for DEFCON?",
  "Which high-owned defenders have thin DEFCON numbers?",
  "Show me DEFCON plus clean sheet potential in one pick",

  // Availability
  "Which highly owned players are doubts this week?",
  "Who is injured but still being transferred in?",
  "Show me available players only for my transfer shortlist",
  "Which flagged players still have a high xP if they start?",
  "Who should I avoid because of fitness risk this week?",
  "Give me like-for-like replacements for the biggest injury news",

  // Captaincy
  "Who are the best captaincy options by expected points?",
  "Give me captaincy picks with the best fixtures this week",
  "Which high-owned players are the safest captain options on xP?",
  "Show me differential captain options with strong xP",
  "Show me captain options under 15% owned with high xP",
  "Is the template captain the right statistical pick this week?",
  "Who should I triple captain based on fixture and xP?",
  "Compare the top 3 captain options on xP, form and ownership",
  "What happens to rank if I captain the differential instead?",
  "Give me a vice-captain who still has a strong xP floor",

  // Differentials and hidden gems
  "Who are the best differentials under 5% owned this week?",
  "Give me hidden gem midfielders with strong form and xGI",
  "Who are the hidden gem defenders right now?",
  "Show me forwards that are differentials with strong form",
  "Which hidden gems have positive net transfers this week?",
  "Give me hidden gems with good fixtures coming up",
  "Which differential has strong form and rising ownership?",
  "Show me hidden gems that also score well on xP per million",
  "Who is under 10% owned with xP in the top 20 this week?",
  "Give me 3 differentials that would actually start in my team",
  "Which low-owned players have better xG than the template pick?",
  "Show me under-the-radar players trending among managers",

  // Personal squad, scientific
  "Which of my players should I sell on form and xP, not recency?",
  "Where is my squad wasting money on points per million?",
  "Do I have too much money in one position versus xP?",
  "Which of my players has the worst fixture run?",
  "Set my captain and vice using xP only",
  "Who in my squad is a rotation risk by minutes?",
  "If I have one free transfer, who is the highest-EV move?",
  "Would a -4 hit be justified on xP this week?",
  "How does my team compare to the ownership template?",
  "Which bench player is closest to first-team minutes and xP?",
  "Build my next 3 transfers around fixtures, not names",
  "Am I overexposed to one club on xP and clean sheets?",

  // Chips
  "Should I bench boost this week based on minutes and xP?",
  "Is this a Free Hit week on blanks and doubles?",
  "When does wildcard EV look better than holding?",
  "Who are the best triple captain targets over the next 3 weeks?",
  "What chip should I save if my fixtures are average this week?",

  // Combined scientific prompts
  "Find me a player with form above 6, xP above 5 and ownership under 12%",
  "Who wins if I sort by form, then xP, then price?",
  "Give me one pick that wins on fixtures, xP and value per million",
  "Which midfielder beats the template option on xGI and price?",
  "Show me a defence that wins on xGC, FDR and DEFCON together",
  "Who is being overhyped on transfers in versus the actual numbers?",
  "Build a shortlist of 5 transfers and rank them by xP per million",
  "Ignore names: who does the FPL data say is the best buy this week?",
  "What is the most scientific captain choice this gameweek?",
  "If I only trust minutes, xP and FDR, who should I buy?",
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
  ...DATA_LED_PROMPTS,
])

export function buildGWPrompts(gw: number | null, hasDGW: boolean): string[] {
  const label = gw ? `GW${gw}` : "this gameweek"
  const gwPrompts: string[] = [
    `Who are the best differential picks for ${label} by xP and ownership?`,
    `Give me differentials under 10% ownership with strong xG or xA for ${label}`,
    `Captaincy options for ${label} - Reddit consensus versus xP`,
    `Rank the best ${label} buys using form, xP and fixtures`,
  ]
  if (hasDGW) {
    gwPrompts.push(`DGW landscape - who are the must-haves and traps for ${label} on xP?`)
  }
  return gwPrompts
}

/** Prompts that need a linked FPL Team ID — hidden until the user links in Settings. */
export function promptRequiresLinkedFplTeam(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  if (/\banalyse my team\b/.test(lower)) return true
  if (/\brank my starting\b/.test(lower)) return true
  if (/\bwhich of my\b/.test(lower)) return true
  if (/\bmy\s+(team|squad|starting\s*xi|players|fixture\s*run|transfers|wildcard|free\s*hit)\b/.test(lower)) {
    return true
  }
  if (/\bwho in my\b/.test(lower)) return true
  if (/\bset my captain\b/.test(lower)) return true
  if (/\bin my team\b/.test(lower)) return true
  if (/\bmy likely transfer\b/.test(lower)) return true
  if (/\bspend the extra.*\bmy squad\b/.test(lower)) return true
  if (/\bwasting money on\b/.test(lower) && /\bmy squad\b/.test(lower)) return true
  return false
}

export function pickChatSuggestionPrompts(
  gw: number | null = null,
  hasDGW = false,
  comparisonPrompt: string | null = null,
  hasFplTeamId = true,
): string[] {
  const gwPrompts = buildGWPrompts(gw, hasDGW)
  const allowedStatic = hasFplTeamId
    ? CHAT_SUGGESTION_PROMPTS
    : CHAT_SUGGESTION_PROMPTS.filter((p) => !promptRequiresLinkedFplTeam(p))
  const shuffledGW = [...gwPrompts].sort(() => Math.random() - 0.5)
  const shuffledStatic = [...allowedStatic].sort(() => Math.random() - 0.5)
  const gwPick = shuffledGW.slice(0, 2)
  const staticPick = shuffledStatic.slice(0, comparisonPrompt ? 1 : 2)
  const picks = [...gwPick, ...staticPick]
  if (comparisonPrompt) picks.push(comparisonPrompt)
  return picks
    .filter((p) => hasFplTeamId || !promptRequiresLinkedFplTeam(p))
    .sort(() => Math.random() - 0.5)
}
