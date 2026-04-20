import {
  getBootstrap,
  buildSlugLookup,
  getDisplayName,
  FPL_HEADERS,
  isEligiblePlayer,
} from "@/lib/fpl-player-page"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransferTrendPlayer {
  slug: string
  displayName: string
  webName: string
  code: number
  club: string
  teamCode: number
  teamId: number
  position: string
  elementType: number
  priceRaw: number
  price: string
  formVal: number
  form: string
  ep_next: number
  ownership: number
  transfersIn: number
  transfersOut: number
  fdrNext: number | null
  opponentName: string
  opponentCode: number | null
  isHome: boolean | null
  chance: number        // chance_of_playing_next_round (0-100, 100 = fully available)
  news: string          // FPL news string (injury description etc.)
}

export interface TransferTrendPair {
  gw: number
  playerOut: TransferTrendPlayer
  playerIn: TransferTrendPlayer
  budgetDelta: number      // priceIn - priceOut (positive = costs more, negative = frees budget)
  netTransfers: number     // transfersOut(out) + transfersIn(in) combined market activity
  slugOut: string
  slugIn: string
  position: string
}

export interface TransferTrendsHubData {
  gw: number
  pairs: TransferTrendPair[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtTransfers(n: number): string {
  if (n >= 100000) return `${Math.round(n / 1000)}k`
  if (n >= 10000)  return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

export function fdrLabel(fdr: number | null): string {
  return fdr ? (FDR_LABELS[fdr] ?? "Unknown") : "Unknown"
}

function buildTransferPlayer(
  el: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>,
  fdrByTeam: Record<number, number>,
  opponentByTeam: Record<number, { name: string; code: number; isHome: boolean }>,
  slug: string
): TransferTrendPlayer {
  const team = teamMap[el.team] ?? { name: "", short: "?", code: 0 }
  const priceRaw = el.now_cost / 10
  return {
    slug,
    displayName: getDisplayName(el),
    webName: el.web_name,
    code: el.code,
    club: team.short,
    teamCode: team.code,
    teamId: el.team,
    position: posMap[el.element_type] ?? "",
    elementType: el.element_type,
    priceRaw,
    price: `£${priceRaw.toFixed(1)}m`,
    formVal: parseFloat(el.form ?? "0"),
    form: el.form ?? "0.0",
    ep_next: parseFloat(el.ep_next ?? "0"),
    ownership: parseFloat(el.selected_by_percent ?? "0"),
    transfersIn: el.transfers_in_event ?? 0,
    transfersOut: el.transfers_out_event ?? 0,
    fdrNext: fdrByTeam[el.team] ?? null,
    opponentName: opponentByTeam[el.team]?.name ?? "",
    opponentCode: opponentByTeam[el.team]?.code ?? null,
    isHome: opponentByTeam[el.team]?.isHome ?? null,
    chance: el.chance_of_playing_next_round ?? 100,
    news: el.news ?? "",
  }
}

async function fetchBootstrapMaps(bootstrap: any, gw: number) {
  const teamMap: Record<number, { name: string; short: string; code: number }> = {}
  const posMap: Record<number, string> = {}
  ;(bootstrap.teams ?? []).forEach((t: any) => {
    teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
  })
  ;(bootstrap.element_types ?? []).forEach((et: any) => {
    posMap[et.id] = et.singular_name_short
  })

  let fdrByTeam: Record<number, number> = {}
  let opponentByTeam: Record<number, { name: string; code: number; isHome: boolean }> = {}
  try {
    const fixtRes = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
      { headers: FPL_HEADERS, next: { revalidate: 900 } }
    )
    const fixtures = fixtRes.ok ? await fixtRes.json() : []
    fixtures.forEach((f: any) => {
      if (fdrByTeam[f.team_h] === undefined) fdrByTeam[f.team_h] = f.team_h_difficulty
      if (fdrByTeam[f.team_a] === undefined) fdrByTeam[f.team_a] = f.team_a_difficulty
      if (!opponentByTeam[f.team_h])
        opponentByTeam[f.team_h] = { name: teamMap[f.team_a]?.name ?? "?", code: teamMap[f.team_a]?.code ?? 0, isHome: true }
      if (!opponentByTeam[f.team_a])
        opponentByTeam[f.team_a] = { name: teamMap[f.team_h]?.name ?? "?", code: teamMap[f.team_h]?.code ?? 0, isHome: false }
    })
  } catch { /* fixtures optional */ }

  return { teamMap, posMap, fdrByTeam, opponentByTeam }
}

// ─── Hub data ─────────────────────────────────────────────────────────────────

export async function getTransferTrendsHub(): Promise<TransferTrendsHubData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const { teamMap, posMap, fdrByTeam, opponentByTeam } = await fetchBootstrapMaps(bootstrap, gw)

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idToSlug = new Map<number, string>()
    for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

    const allPairs: TransferTrendPair[] = []

    for (const posId of [1, 2, 3, 4]) {
      const posPlayers = eligible.filter((p: any) => p.element_type === posId)

      // Top 10 most transferred OUT
      const top10out = posPlayers
        .filter((p: any) => (p.transfers_out_event ?? 0) > 0)
        .sort((a: any, b: any) => (b.transfers_out_event ?? 0) - (a.transfers_out_event ?? 0))
        .slice(0, 10)

      // Top 10 most transferred IN
      const top10in = posPlayers
        .filter((p: any) => (p.transfers_in_event ?? 0) > 0)
        .sort((a: any, b: any) => (b.transfers_in_event ?? 0) - (a.transfers_in_event ?? 0))
        .slice(0, 10)

      for (const pOut of top10out) {
        for (const pIn of top10in) {
          if (pOut.id === pIn.id) continue
          const slugOut = idToSlug.get(pOut.id)
          const slugIn  = idToSlug.get(pIn.id)
          if (!slugOut || !slugIn) continue

          const playerOut = buildTransferPlayer(pOut, teamMap, posMap, fdrByTeam, opponentByTeam, slugOut)
          const playerIn  = buildTransferPlayer(pIn,  teamMap, posMap, fdrByTeam, opponentByTeam, slugIn)

          allPairs.push({
            gw,
            playerOut,
            playerIn,
            budgetDelta: playerIn.priceRaw - playerOut.priceRaw,
            netTransfers: (pOut.transfers_out_event ?? 0) + (pIn.transfers_in_event ?? 0),
            slugOut,
            slugIn,
            position: posMap[posId] ?? "",
          })
        }
      }
    }

    allPairs.sort((a, b) => b.netTransfers - a.netTransfers)
    return { gw, pairs: allPairs.slice(0, 25) }
  } catch {
    return null
  }
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function getTransferTrendSlugs(
  limit = 400
): Promise<{ player_out: string; player_in: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const { teamMap, posMap } = await fetchBootstrapMaps(bootstrap, gw)
    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idToSlug = new Map<number, string>()
    for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

    const pairs: { player_out: string; player_in: string; score: number }[] = []

    for (const posId of [1, 2, 3, 4]) {
      const posPlayers = eligible.filter((p: any) => p.element_type === posId)

      const top10out = posPlayers
        .filter((p: any) => (p.transfers_out_event ?? 0) > 0)
        .sort((a: any, b: any) => (b.transfers_out_event ?? 0) - (a.transfers_out_event ?? 0))
        .slice(0, 10)

      const top10in = posPlayers
        .filter((p: any) => (p.transfers_in_event ?? 0) > 0)
        .sort((a: any, b: any) => (b.transfers_in_event ?? 0) - (a.transfers_in_event ?? 0))
        .slice(0, 10)

      for (const pOut of top10out) {
        for (const pIn of top10in) {
          if (pOut.id === pIn.id) continue
          const slugOut = idToSlug.get(pOut.id)
          const slugIn  = idToSlug.get(pIn.id)
          if (!slugOut || !slugIn) continue
          pairs.push({
            player_out: slugOut,
            player_in: slugIn,
            score: (pOut.transfers_out_event ?? 0) + (pIn.transfers_in_event ?? 0),
          })
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score)
    return pairs.slice(0, limit).map(({ player_out, player_in }) => ({ player_out, player_in }))
  } catch {
    return []
  }
}

// ─── Individual page data ─────────────────────────────────────────────────────

export async function getTransferTrendPageData(
  outSlug: string,
  inSlug: string
): Promise<TransferTrendPair | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const { teamMap, posMap, fdrByTeam, opponentByTeam } = await fetchBootstrapMaps(bootstrap, gw)

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idOut = slugLookup.get(outSlug)
    const idIn  = slugLookup.get(inSlug)
    if (!idOut || !idIn || idOut === idIn) return null

    const elOut = (bootstrap.elements ?? []).find((p: any) => p.id === idOut)
    const elIn  = (bootstrap.elements ?? []).find((p: any) => p.id === idIn)
    if (!elOut || !elIn) return null

    const playerOut = buildTransferPlayer(elOut, teamMap, posMap, fdrByTeam, opponentByTeam, outSlug)
    const playerIn  = buildTransferPlayer(elIn,  teamMap, posMap, fdrByTeam, opponentByTeam, inSlug)

    return {
      gw,
      playerOut,
      playerIn,
      budgetDelta: playerIn.priceRaw - playerOut.priceRaw,
      netTransfers: playerOut.transfersOut + playerIn.transfersIn,
      slugOut: outSlug,
      slugIn: inSlug,
      position: posMap[elOut.element_type] ?? "",
    }
  } catch {
    return null
  }
}

// ─── Hub card text — 3 rotating variants, each unique from H2H variants ───────

export function buildTransferHubText(
  pair: TransferTrendPair,
  rank: number,
  randomBase: number
): string {
  const { gw, playerOut: pOut, playerIn: pIn } = pair
  const outName  = pOut.displayName
  const inName   = pIn.displayName
  const outSold  = fmtTransfers(pOut.transfersOut)
  const inBought = fmtTransfers(pIn.transfersIn)
  const combined = fmtTransfers(pair.netTransfers)
  const outOwn   = pOut.ownership
  const inOwn    = pIn.ownership
  const outFix   = pOut.opponentName ? `${pOut.opponentName} (${pOut.isHome ? "H" : "A"})` : "their next opponent"
  const inFix    = pIn.opponentName  ? `${pIn.opponentName} (${pIn.isHome ? "H" : "A"})`  : "their next opponent"
  const inFdr    = fdrLabel(pIn.fdrNext)

  const delta    = Math.abs(pair.budgetDelta).toFixed(1)
  const budgetLine = pair.budgetDelta > 0.05
    ? `costs an extra £${delta}m`
    : pair.budgetDelta < -0.05
    ? `frees up £${delta}m in the bank`
    : "is a like-for-like price swap"

  // ── Availability context ──────────────────────────────────────────────────
  const outBlank   = !pOut.opponentName
  const inBlank    = !pIn.opponentName
  const outDoubt   = !outBlank && pOut.chance < 75
  const inDoubt    = !inBlank  && pIn.chance  < 75

  const outEp = outBlank ? "--" : pOut.ep_next.toFixed(1)
  const inEp  = inBlank  ? "--" : pIn.ep_next.toFixed(1)

  // Build a single availability sentence that can be injected into any variant
  let availNote = ""
  if (outBlank && inBlank) {
    availNote = `Both ${pOut.webName} and ${pIn.webName} have a Blank Gameweek ${gw}, so managers are rotating around the fixture gap rather than reacting to form. `
  } else if (outBlank) {
    availNote = `${pOut.webName} has a Blank Gameweek ${gw} with no fixture - that is the primary driver behind the exit volume, not a collapse in form. `
  } else if (inBlank) {
    availNote = `Note: ${pIn.webName} also has a Blank Gameweek ${gw}, so managers buying in are planning ahead for the following week. `
  }

  if (outDoubt) {
    availNote += `${pOut.webName} is currently listed as ${pOut.chance <= 25 ? "a major injury doubt" : "an injury concern"}, which is accelerating the transfer out. `
  } else if (inDoubt) {
    availNote += `${pIn.webName} carries a fitness question with ${pIn.chance}% availability - worth checking before committing. `
  }

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `A combined ${combined} moves define ${outName}-to-${inName} as one of Gameweek ${gw}'s most active transfer routes. ` +
      `Of those, ${outSold} managers have exited ${outName} while ${inBought} have moved into ${pIn.webName} - ` +
      `when that volume of managers reaches the same conclusion simultaneously, the market signal carries real weight. ` +
      (availNote ? availNote : `At ${inOwn}% ownership, failing to hold ${inName} while they return costs rank against every manager who made the switch. `) +
      `The full transfer breakdown and AI verdict are on the dedicated page.`
  }

  if (variant === 1) {
    return `Moving from ${outName} (${pOut.price}) to ${inName} (${pIn.price}) ${budgetLine} heading into Gameweek ${gw}. ` +
      (availNote ? availNote : `Beyond the financials, the fixture window is what ${inBought} managers have already priced in. `) +
      `${inName} lines up against ${inFix} - rated ${inFdr} for difficulty - while ${outName} faces ${outFix}. ` +
      `The expected points projection sits at ${inEp} for ${pIn.webName} against ${outEp} for ${pOut.webName}. ` +
      `The full transfer analysis is on the dedicated page.`
  }

  return `${outName} is currently owned by ${outOwn}% of FPL managers; ${inName} by ${inOwn}%. ` +
    `That ownership gap quantifies the rank exposure of being on the wrong side of this trade heading into Gameweek ${gw}. ` +
    (availNote ? availNote : `The ${outSold} managers selling ${outName} and ${inBought} buying ${pIn.webName} this week have already worked through the numbers. `) +
    `The model projects ${inEp} expected points for ${inName} against ${outEp} for ${pOut.webName}. ` +
    `The full ownership and fixture breakdown is on the dedicated analysis page.`
}

// ─── Individual page text ─────────────────────────────────────────────────────

export interface TransferPageText {
  marketPanel: string
  ownershipPanel: string
  budgetPanel: string
  fixturePanel: string
  verdict: string
  verdictLabel: "BACK THE MARKET" | "PROCEED WITH CAUTION" | "STAY PUT"
  ctaPrompt: string
  qaItems: { id: string; question: string; answer: string }[]
}

export function buildTransferPageText(pair: TransferTrendPair): TransferPageText {
  const { gw, playerOut: pOut, playerIn: pIn } = pair
  const outName  = pOut.displayName
  const inName   = pIn.displayName
  const outSold  = fmtTransfers(pOut.transfersOut)
  const inBought = fmtTransfers(pIn.transfersIn)
  const outOwn   = pOut.ownership
  const inOwn    = pIn.ownership
  const outForm  = pOut.form
  const inForm   = pIn.form
  const delta    = Math.abs(pair.budgetDelta).toFixed(1)

  // ── Availability detection ──────────────────────────────────────────────
  const outBlank = !pOut.opponentName
  const inBlank  = !pIn.opponentName
  const outDoubt = !outBlank && pOut.chance < 75
  const inDoubt  = !inBlank  && pIn.chance  < 75

  const outFix = outBlank
    ? `a Blank Gameweek ${gw} (no fixture)`
    : `${pOut.opponentName} (${pOut.isHome ? "H" : "A"})`
  const inFix = inBlank
    ? `a Blank Gameweek ${gw} (no fixture)`
    : `${pIn.opponentName} (${pIn.isHome ? "H" : "A"})`

  const outFdr  = fdrLabel(pOut.fdrNext)
  const inFdr   = fdrLabel(pIn.fdrNext)
  const outEp   = outBlank ? "--" : pOut.ep_next.toFixed(1)
  const inEp    = inBlank  ? "--" : pIn.ep_next.toFixed(1)

  // ── Market Movement panel ──
  const outAvailNote = outBlank
    ? `${pOut.webName} has a Blank Gameweek ${gw} with no fixture, which is the primary driver behind the exit volume. `
    : outDoubt
    ? `${pOut.webName} is currently listed as ${pOut.chance <= 25 ? "a major injury doubt" : "an injury concern"} - this is contributing to the selling pressure. `
    : ""
  const inAvailNote = inBlank
    ? `${pIn.webName} also has a Blank Gameweek ${gw}, so managers buying in are planning for the following week rather than this one. `
    : inDoubt
    ? `${pIn.webName} carries a fitness concern (${pIn.chance}% availability) - verify their status before committing. `
    : ""

  const marketPanel = pIn.transfersIn > pOut.transfersOut
    ? `In Gameweek ${gw}, ${inBought} managers have moved into ${inName} while ${outSold} have left ${outName}. ` +
      (outAvailNote || `The net direction of travel is clear: the FPL market is pricing ${inName} as the better short-term asset. `) +
      (inAvailNote || `Transfer activity of this scale is typically driven by a combination of fixture awareness, expected returns, and ownership risk - ` +
      `all three of which feed into the analysis below.`)
    : pOut.transfersOut > pIn.transfersIn
    ? `A total of ${outSold} managers have sold ${outName} this gameweek - a volume that reflects meaningful market concern rather than isolated decisions. ` +
      (outAvailNote || `Meanwhile, ${inBought} have moved into ${inName} as an alternative, though the exit from ${pOut.webName} is the stronger market signal in this pairing. `) +
      `Understanding what is driving those ${outSold} sales is the key question heading into Gameweek ${gw}.`
    : `The combined ${outSold} exits from ${outName} and ${inBought} entries into ${inName} tell a consistent story heading into Gameweek ${gw}. ` +
      (outAvailNote + inAvailNote ||
      `The transfer market is not dramatically favouring one option over the other in raw volume terms, ` +
      `which means the decision comes down to fixtures, expected points, and your own squad context. `) +
      `The analysis below breaks down each of those factors.`

  // ── Ownership & Rank panel ──
  const ownGap = Math.abs(inOwn - outOwn).toFixed(1)
  const ownershipPanel = inOwn > outOwn
    ? `${inName} is currently held by ${inOwn}% of FPL managers against ${outOwn}% for ${outName}. ` +
      `A ${ownGap} percentage point ownership gap means that if ${inName} returns a double-figure haul in Gameweek ${gw} ` +
      `and you are still holding ${pOut.webName}, you hand ground directly to that ${inOwn}% ownership block. ` +
      `At scale, that rank movement is significant. The decision is not just about points - it is about where you land relative to the field.`
    : outOwn > inOwn
    ? `${outName} carries ${outOwn}% ownership against ${inOwn}% for ${inName}. ` +
      `Holding ${pOut.webName} keeps you aligned with the majority - if they blank, you do not lose rank to most of your rivals. ` +
      `But that same ownership cuts both ways: a ${inName} return while you hold ${pOut.webName} costs rank against the ${inOwn}% who made the switch. ` +
      `Your rank ambition and mini-league position should shape how you weight this.`
    : `${outName} and ${inName} carry near-identical ownership at ${outOwn}% and ${inOwn}% respectively. ` +
      `The rank mathematics of this transfer are therefore relatively neutral - the field is broadly split. ` +
      `In that scenario, expected points and fixture quality become the tie-breakers, ` +
      `rather than any ownership-driven fear of missing out.`

  // ── Budget Impact panel ──
  const epCompare = (!outBlank && !inBlank)
    ? ` At ${inEp} projected points for ${inName} against ${outEp} for ${pOut.webName}, the model ${pIn.ep_next > pOut.ep_next ? "backs the premium" : "does not strongly support the additional spend"} this gameweek.`
    : outBlank
    ? ` ${pOut.webName} has a Blank Gameweek ${gw}, so the budget case is evaluated on the following gameweek's fixture quality rather than immediate return.`
    : inBlank
    ? ` ${pIn.webName} has a Blank Gameweek ${gw}, so any premium paid is for medium-term fixtures rather than an immediate return in Gameweek ${gw}.`
    : ""

  const budgetPanel = pair.budgetDelta > 0.05
    ? `This transfer costs £${delta}m extra, moving from ${outName} at ${pOut.price} to ${inName} at ${pIn.price}. ` +
      `That upgrade cost needs to be funded from elsewhere in your squad or your bank. ` +
      `The question is whether ${pIn.price} represents a price point that justifies the outlay relative to the expected return differential.` +
      epCompare
    : pair.budgetDelta < -0.05
    ? `Selling ${outName} at ${pOut.price} for ${inName} at ${pIn.price} frees up £${delta}m in your transfer bank. ` +
      `That freed budget can be redirected to a stronger position elsewhere in your squad, ` +
      `effectively making this move a two-stage value play: swapping ${pOut.webName} for ${pIn.webName} while strengthening another area.` +
      epCompare
    : `${outName} at ${pOut.price} and ${inName} at ${pIn.price} represent a price-neutral transfer this gameweek. ` +
      `No budget is freed or spent - this is a direct swap between two assets at similar valuations. ` +
      `That simplifies the decision: it comes down purely to which player gives you the better return in Gameweek ${gw} and beyond.` +
      epCompare

  // ── Fixture Window panel ──
  const fixturePanel = (outBlank && inBlank)
    ? `Both ${outName} and ${inName} have a Blank Gameweek ${gw} with no fixture scheduled. ` +
      `The fixture comparison cannot be used to decide this transfer for the immediate gameweek. ` +
      `Any decision here is purely based on squad rotation and planning for future weeks. ` +
      `Check the upcoming fixture lists for both players before committing.`
    : outBlank
    ? `${outName} has a Blank Gameweek ${gw} with no fixture - they will not play this week. ` +
      `${inName} draws ${inFix}, rated ${inFdr}. ` +
      `The fixture argument strongly favours making the move before Gameweek ${gw} kicks off. ` +
      `The ${inBought} managers who have already transferred in have factored this blank directly into their decision.`
    : inBlank
    ? `${outName} faces ${outFix} in Gameweek ${gw}, rated ${outFdr}, while ${inName} has a Blank Gameweek ${gw} with no fixture. ` +
      `From a pure Gameweek ${gw} perspective, ${outName} holds the fixture advantage. ` +
      `Managers transferring to ${inName} are backing their longer-term schedule rather than looking for points this week. ` +
      `Weigh whether the longer-term upside justifies missing ${pOut.webName}'s returns in Gameweek ${gw}.`
    : (pIn.fdrNext ?? 3) < (pOut.fdrNext ?? 3)
    ? `${inName} faces ${inFix} in Gameweek ${gw} - a ${inFdr} rated fixture. ` +
      `${outName} draws ${outFix}, rated ${outFdr}. ` +
      `The fixture swing is the clearest argument for making this move now rather than waiting. ` +
      `Buying into ${pIn.webName} before an easier schedule is a better entry point than chasing after they have already delivered. ` +
      `The ${inBought} managers who have already transferred in have largely acted on this fixture window.`
    : (pOut.fdrNext ?? 3) < (pIn.fdrNext ?? 3)
    ? `${outName} actually holds the better immediate fixture in Gameweek ${gw}: ${outFix} rated ${outFdr}, ` +
      `compared to ${inName} facing ${inFix} rated ${inFdr}. ` +
      `If fixture logic alone is driving the ${inBought} transfers into ${pIn.webName}, ` +
      `the numbers do not fully support that rationale this week. ` +
      `The case for this transfer may be stronger as a medium-term hold rather than an immediate Gameweek ${gw} punt.`
    : `${outName} faces ${outFix} (${outFdr}) and ${inName} draws ${inFix} (${inFdr}) in Gameweek ${gw}. ` +
      `The fixture comparison is broadly level - neither player holds a clear schedule advantage this week. ` +
      `When fixtures are neutral, expected points (${outEp} vs ${inEp}) and form (${outForm} vs ${inForm}) become the deciding metrics. ` +
      `The full AI verdict factors in all of these simultaneously.`

  // ── Verdict ──
  const epNumOut     = outBlank ? 0 : pOut.ep_next
  const epNumIn      = inBlank  ? 0 : pIn.ep_next
  const epAdvantage  = epNumIn - epNumOut
  const fdrAdvantage = (pOut.fdrNext ?? 3) - (pIn.fdrNext ?? 3)
  const mktMomentum  = pIn.transfersIn > pOut.transfersOut ? 1 : 0
  // If OUT has blank GW it's a strong reason to sell; if IN has blank GW reduce the score
  const blankBonus   = outBlank ? 1 : 0
  const blankPenalty = inBlank  ? 1 : 0
  const score        = (epAdvantage > 0.5 ? 1 : 0) + (fdrAdvantage > 0 ? 1 : 0) + mktMomentum + blankBonus - blankPenalty

  const verdictLabel: TransferPageText["verdictLabel"] =
    score >= 2 ? "BACK THE MARKET"
    : score === 1 ? "PROCEED WITH CAUTION"
    : "STAY PUT"

  const verdict =
    score >= 2
      ? `The evidence points toward making this transfer. ${inName} holds advantages in expected points ` +
        `(${inEp} vs ${outEp}), fixture difficulty${fdrAdvantage > 0 ? ` (${inFdr} vs ${outFdr})` : ""}` +
        `${outBlank ? `, and ${pOut.webName} has a Blank Gameweek ${gw}` : ""}, ` +
        `supported by transfer market momentum (${inBought} bought vs ${outSold} sold). ` +
        `Making the move before the Gameweek ${gw} deadline aligns you with the direction the market has moved. ` +
        `ChatFPL AI can factor in your specific squad, transfer budget, and mini-league rivals to give a personalised verdict.`
      : score === 1
      ? `The case for this transfer is mixed. Some metrics favour ${inName} - ` +
        `${epAdvantage > 0 || outBlank ? `expected points advantage${outBlank ? ` (${pOut.webName} has a Blank Gameweek ${gw})` : ` (${inEp} vs ${outEp})`}` : `market momentum (${inBought} transfers in)`} - ` +
        `but other factors are less conclusive. ` +
        `${inBlank ? `${pIn.webName} also has a Blank Gameweek ${gw}, which tempers the immediate appeal. ` : ""}` +
        `This is a transfer worth considering but not acting on without a clear squad need in Gameweek ${gw}. ` +
        `ChatFPL AI can weigh your actual squad context before you commit a transfer.`
      : `On the current data, the case for selling ${outName} for ${inName} is not compelling this gameweek. ` +
        `${pOut.webName} holds comparable or better metrics across expected points, fixture, and market direction. ` +
        `${inBlank ? `${pIn.webName} has a Blank Gameweek ${gw} which further reduces the short-term appeal. ` : ""}` +
        `The ${outSold} exits may reflect short-term sentiment rather than a fundamental shift in value. ` +
        `ChatFPL AI can assess whether there is a squad-specific reason to make this move in Gameweek ${gw}.`

  const ctaPrompt = `Should I sell ${pOut.webName} for ${pIn.webName} in GW${gw}?`

  const qaItems = [
    {
      id: "q1",
      question: `What does the transfer market look like for selling ${pOut.webName} and buying ${pIn.webName} in Gameweek ${gw}?`,
      answer: marketPanel,
    },
    {
      id: "q2",
      question: `What is the ownership risk of keeping ${pOut.webName} over ${pIn.webName} in Gameweek ${gw}?`,
      answer: ownershipPanel,
    },
    {
      id: "q3",
      question: `What is the budget impact of selling ${pOut.webName} for ${pIn.webName}?`,
      answer: budgetPanel,
    },
    {
      id: "q4",
      question: `How do the fixtures compare for ${pOut.webName} and ${pIn.webName} heading into Gameweek ${gw}?`,
      answer: fixturePanel,
    },
  ]

  return { marketPanel, ownershipPanel, budgetPanel, fixturePanel, verdict, verdictLabel, ctaPrompt, qaItems }
}
