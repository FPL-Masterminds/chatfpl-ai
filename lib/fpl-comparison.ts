import {
  getBootstrap,
  buildSlugLookup,
  getDisplayName,
  FPL_HEADERS,
  formatFplNews,
  isEligiblePlayer,
  fixtureWindowPhrase,
  FixtureGW,
  FixtureMatch,
} from "@/lib/fpl-player-page"

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ComparisonPlayer {
  code: number
  webName: string
  displayName: string
  club: string
  teamCode: number
  teamId: number
  position: string
  elementType: number
  price: string
  priceRaw: number
  formVal: number
  form: string
  totalPts: number
  ep_next: number
  ownership: number
  goals: number
  assists: number
  news: string
  chance: number
  ptsPerMillion: number
  transfersInGW: number
  slug: string
}

export interface ComparisonData {
  gw: number
  playerA: ComparisonPlayer
  playerB: ComparisonPlayer
  fixtureRunA: FixtureGW[]
  fixtureRunB: FixtureGW[]
  slugA: string
  slugB: string
  samePosition: boolean
}

export interface ComparisonTextResult {
  verdictPlayer: "A" | "B" | "EVEN"
  verdictLabel: string
  verdictText: string
  verdictBullets: string[]
  caseForA: string[]
  caseForB: string[]
  qaItems: { question: string; answer: string }[]
  subheading: string
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

function buildComparisonPlayer(
  el: any,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>,
  slug: string
): ComparisonPlayer {
  const team = teamMap[el.team] ?? { name: "Unknown", short: "UNK", code: 0 }
  const priceRaw = el.now_cost / 10
  const ep = parseFloat(el.ep_next ?? "0")
  const pts = el.total_points ?? 0
  return {
    code: el.code,
    webName: el.web_name,
    displayName: getDisplayName(el),
    club: team.name,
    teamCode: team.code,
    teamId: el.team,
    position: posMap[el.element_type] ?? "",
    elementType: el.element_type,
    price: `£${priceRaw.toFixed(1)}m`,
    priceRaw,
    formVal: parseFloat(el.form ?? "0"),
    form: el.form ?? "0.0",
    totalPts: pts,
    ep_next: ep,
    ownership: parseFloat(el.selected_by_percent ?? "0"),
    goals: el.goals_scored ?? 0,
    assists: el.assists ?? 0,
    news: el.news ?? "",
    chance: el.chance_of_playing_next_round ?? 100,
    ptsPerMillion: priceRaw > 0 ? parseFloat((pts / priceRaw).toFixed(1)) : 0,
    transfersInGW: el.transfers_in_event ?? 0,
    slug,
  }
}

function buildFixtureRun(
  teamId: number,
  fixtureResults: any[][],
  gwsToFetch: number[],
  teamMap: Record<number, { name: string; short: string; code: number }>
): FixtureGW[] {
  return gwsToFetch.map((gw, i) => {
    const gwFixtures: any[] = fixtureResults[i] ?? []
    const teamFixtures = gwFixtures.filter(
      (f) => f.team_h === teamId || f.team_a === teamId
    )
    const matches: FixtureMatch[] = teamFixtures.map((fix) => {
      const isHome = fix.team_h === teamId
      const oppId = isHome ? fix.team_a : fix.team_h
      return {
        opponent: teamMap[oppId]?.name ?? "Unknown",
        opponentCode: teamMap[oppId]?.code ?? null,
        isHome,
        fdr: isHome ? (fix.team_h_difficulty ?? 3) : (fix.team_a_difficulty ?? 3),
      }
    })
    return { gw, matches }
  })
}

export async function getComparisonData(
  slugA: string,
  slugB: string
): Promise<ComparisonData | null> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return null

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Eligible-only lookup so slugs match getComparisonSlugs / generateStaticParams
    const eligibleElements = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligibleElements, bootstrap.teams ?? [])
    const idA = slugLookup.get(slugA)
    const idB = slugLookup.get(slugB)
    if (!idA || !idB || idA === idB) return null

    const elA = (bootstrap.elements ?? []).find((p: any) => p.id === idA)
    const elB = (bootstrap.elements ?? []).find((p: any) => p.id === idB)
    if (!elA || !elB) return null

    const events = bootstrap.events ?? []
    const nextGW =
      events.find((e: any) => e.is_next)?.id ??
      ((events.find((e: any) => e.is_current)?.id ?? 30) + 1)

    // Cap at the season's final GW so we never project into a non-existent week
    const maxGW = events.length > 0 ? Math.max(...events.map((e: any) => e.id as number)) : nextGW + 3
    const gwsToFetch = [nextGW, nextGW + 1, nextGW + 2, nextGW + 3].filter((gw) => gw <= maxGW)

    // Single set of fixture fetches — filter both teams from same responses
    const fixtureResults = await Promise.all(
      gwsToFetch.map((gw) =>
        fetch(
          `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
          { headers: FPL_HEADERS, next: { revalidate: 900 } }
        )
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    )

    const playerA = buildComparisonPlayer(elA, teamMap, posMap, slugA)
    const playerB = buildComparisonPlayer(elB, teamMap, posMap, slugB)
    const fixtureRunA = buildFixtureRun(elA.team, fixtureResults, gwsToFetch, teamMap)
    const fixtureRunB = buildFixtureRun(elB.team, fixtureResults, gwsToFetch, teamMap)

    return {
      gw: nextGW,
      playerA,
      playerB,
      fixtureRunA,
      fixtureRunB,
      slugA,
      slugB,
      samePosition: elA.element_type === elB.element_type,
    }
  } catch {
    return null
  }
}

// ─── Static params generation ─────────────────────────────────────────────────

export async function getComparisonSlugs(limit = 500): Promise<{ playerA: string; playerB: string }[]> {
  try {
    const bootstrap = await getBootstrap()
    if (!bootstrap?.elements) return []

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)

    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])

    // Reverse map: elementId -> slug
    const idToSlug = new Map<number, string>()
    slugLookup.forEach((id, slug) => idToSlug.set(id, slug))

    // Group by position
    const byPosition: Record<number, any[]> = {}
    eligible.forEach((p: any) => {
      if (!byPosition[p.element_type]) byPosition[p.element_type] = []
      byPosition[p.element_type].push(p)
    })

    // All same-position pairs, scored by combined ownership (most popular first)
    const pairs: { playerA: string; playerB: string; score: number }[] = []
    for (const players of Object.values(byPosition)) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const slugA = idToSlug.get(players[i].id)
          const slugB = idToSlug.get(players[j].id)
          if (!slugA || !slugB) continue
          // Alphabetical A-before-B canonical order
          const [finalA, finalB] = slugA < slugB ? [slugA, slugB] : [slugB, slugA]
          const score =
            parseFloat(players[i].selected_by_percent ?? "0") +
            parseFloat(players[j].selected_by_percent ?? "0")
          pairs.push({ playerA: finalA, playerB: finalB, score })
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score)
    return pairs.slice(0, limit).map(({ playerA, playerB }) => ({ playerA, playerB }))
  } catch {
    return []
  }
}

// ─── Text generation ──────────────────────────────────────────────────────────

function scorePlayer(p: ComparisonPlayer, fixtureRun: FixtureGW[]): number {
  // ep_next: 0–40 points  (max realistic ~15 → normalise)
  const epScore = Math.min(40, (p.ep_next / 15) * 40)
  // form: 0–30 points  (max realistic ~12)
  const formScore = Math.min(30, (p.formVal / 12) * 30)
  // fixture next GW FDR: lower = better, score 0–20
  const nextFdr = fixtureRun[0]?.matches[0]?.fdr ?? 3
  const noFixture = fixtureRun[0]?.matches.length === 0
  const fixtureScore = noFixture ? 0 : Math.max(0, (5 - nextFdr) * 4)  // 0–20
  // value: 0–10 points  (pts per million, max ~25)
  const valueScore = Math.min(10, (p.ptsPerMillion / 25) * 10)
  return epScore + formScore + fixtureScore + valueScore
}

function avgNextFdr(fixtureRun: FixtureGW[]): number {
  const all = fixtureRun.flatMap((f) => f.matches).map((m) => m.fdr)
  if (!all.length) return 3
  return all.reduce((a, b) => a + b, 0) / all.length
}

export function buildComparisonText(d: ComparisonData): ComparisonTextResult {
  const { playerA: a, playerB: b, fixtureRunA, fixtureRunB, gw } = d
  const fwPhrase = fixtureWindowPhrase(Math.max(fixtureRunA.length, fixtureRunB.length))

  // ── Injury / availability detection ────────────────────────────────────────
  const aOut      = a.chance === 0
  const bOut      = b.chance === 0
  const aDoubtful = !aOut && a.chance > 0 && a.chance <= 25
  const bDoubtful = !bOut && b.chance > 0 && b.chance <= 25

  const scoreA = scorePlayer(a, fixtureRunA)
  const scoreB = scorePlayer(b, fixtureRunB)
  const diff = scoreA - scoreB
  const tolerance = 5

  // Unavailable player loses by default; both out = EVEN
  const verdictPlayer: "A" | "B" | "EVEN" =
    aOut && !bOut ? "B"
    : bOut && !aOut ? "A"
    : aOut && bOut ? "EVEN"
    : diff > tolerance ? "A" : diff < -tolerance ? "B" : "EVEN"

  const winner = verdictPlayer === "A" ? a : verdictPlayer === "B" ? b : null
  const loser  = verdictPlayer === "A" ? b : verdictPlayer === "B" ? a : null

  const fdrA = fixtureRunA[0]?.matches[0]?.fdr ?? 3
  const fdrB = fixtureRunB[0]?.matches[0]?.fdr ?? 3
  const avgFdrA = avgNextFdr(fixtureRunA)
  const avgFdrB = avgNextFdr(fixtureRunB)
  const bgwA = fixtureRunA[0]?.matches.length === 0
  const bgwB = fixtureRunB[0]?.matches.length === 0
  const dgwA = fixtureRunA[0]?.matches.length >= 2
  const dgwB = fixtureRunB[0]?.matches.length >= 2

  // ── Verdict label ──────────────────────────────────────────────────────────
  let verdictLabel: string
  if (aOut && bOut) {
    verdictLabel = "BOTH UNAVAILABLE"
  } else if (aOut) {
    verdictLabel = `PICK ${b.webName.toUpperCase()}`
  } else if (bOut) {
    verdictLabel = `PICK ${a.webName.toUpperCase()}`
  } else if (verdictPlayer === "EVEN") {
    verdictLabel = "TOO CLOSE TO CALL"
  } else if (Math.abs(diff) > 15) {
    verdictLabel = `PICK ${winner!.webName.toUpperCase()}`
  } else {
    verdictLabel = `SLIGHT EDGE: ${winner!.webName.toUpperCase()}`
  }

  // ── Verdict text ───────────────────────────────────────────────────────────
  let verdictText: string
  if (aOut && bOut) {
    verdictText = `Both ${a.displayName} and ${b.displayName} are currently listed as unavailable. Check the latest FPL injury news before making any decisions.`
  } else if (aOut) {
    verdictText = `${a.displayName} is currently ruled out${a.news ? ` - ${formatFplNews(a.news)}` : ""}. ${b.displayName} wins this comparison by default and is the clear pick for Gameweek ${gw}.`
  } else if (bOut) {
    verdictText = `${b.displayName} is currently ruled out${b.news ? ` - ${formatFplNews(b.news)}` : ""}. ${a.displayName} wins this comparison by default and is the clear pick for Gameweek ${gw}.`
  } else if (verdictPlayer === "EVEN") {
    verdictText = `${a.displayName} and ${b.displayName} are closely matched in Gameweek ${gw}. Both carry similar expected returns, form, and fixture difficulty. This one comes down to your squad needs and risk tolerance.`
  } else {
    const margin = Math.abs(diff) > 15 ? "clear" : "slight"
    verdictText = `${winner!.displayName} holds a ${margin} edge over ${loser!.displayName} heading into Gameweek ${gw}, driven by ${winner!.ep_next > loser!.ep_next ? "higher expected points" : winner!.formVal > loser!.formVal ? "stronger recent form" : "a more favourable fixture"}.`
    if (aDoubtful) verdictText += ` Note: ${a.displayName} is listed as a doubt (${a.chance}% chance of playing).`
    if (bDoubtful) verdictText += ` Note: ${b.displayName} is listed as a doubt (${b.chance}% chance of playing).`
  }

  // ── Verdict bullets ────────────────────────────────────────────────────────
  const verdictBullets: string[] = []

  if (a.ep_next !== b.ep_next) {
    const betterEp = a.ep_next > b.ep_next ? a : b
    const worseEp  = a.ep_next > b.ep_next ? b : a
    verdictBullets.push(
      `${betterEp.displayName} projects ${(betterEp.ep_next - worseEp.ep_next).toFixed(1)} more expected points in GW${gw}.`
    )
  }

  if (Math.abs(a.formVal - b.formVal) > 0.5) {
    const betterForm = a.formVal > b.formVal ? a : b
    verdictBullets.push(
      `${betterForm.displayName} is in sharper form with ${betterForm.form} points per game over the last six gameweeks.`
    )
  }

  if (bgwA && !bgwB) {
    verdictBullets.push(`${a.displayName} has a blank in GW${gw}, making ${b.displayName} the only safe option this week.`)
  } else if (bgwB && !bgwA) {
    verdictBullets.push(`${b.displayName} has a blank in GW${gw}, making ${a.displayName} the only safe option this week.`)
  } else if (dgwA && !dgwB) {
    verdictBullets.push(`${a.displayName} has a double gameweek in GW${gw}, giving double the scoring opportunities.`)
  } else if (dgwB && !dgwA) {
    verdictBullets.push(`${b.displayName} has a double gameweek in GW${gw}, giving double the scoring opportunities.`)
  } else if (fdrA !== fdrB) {
    const betterFixture = fdrA < fdrB ? a : b
    verdictBullets.push(
      `${betterFixture.displayName} faces an easier GW${gw} opponent (FDR ${Math.min(fdrA, fdrB)} vs ${Math.max(fdrA, fdrB)}).`
    )
  }

  if (verdictBullets.length < 2) {
    if (Math.abs(a.priceRaw - b.priceRaw) >= 1) {
      const cheaper = a.priceRaw < b.priceRaw ? a : b
      const priceDiff = Math.abs(a.priceRaw - b.priceRaw).toFixed(1)
      verdictBullets.push(
        `${cheaper.displayName} costs £${priceDiff}m less, freeing up budget for strengthening elsewhere in your squad.`
      )
    }
  }

  // ── Case for A ────────────────────────────────────────────────────────────
  const caseForA: string[] = []
  if (aOut) {
    caseForA.push(`Unavailable: ${a.news ? formatFplNews(a.news) : "Currently ruled out - check latest injury news before transferring in."}`)
    caseForA.push(`${a.displayName} has a 0% chance of playing in GW${gw} per the FPL injury feed.`)
    caseForA.push(`${a.displayName} has contributed ${a.goals} goals and ${a.assists} assists this season but cannot be relied upon this gameweek.`)
  } else if (aDoubtful) {
    caseForA.push(`Injury doubt: ${a.news ? formatFplNews(a.news) : `Listed at ${a.chance}% chance of playing in GW${gw} - a significant risk.`}`)
    caseForA.push(`${a.displayName} has registered ${a.goals} goals and ${a.assists} assists this season at ${a.price}.`)
    if (a.ep_next > 0) caseForA.push(`Projects ${a.ep_next.toFixed(1)} expected points in GW${gw} if fit, but availability is uncertain.`)
  } else {
    caseForA.push(`${a.displayName} has registered ${a.goals} goals and ${a.assists} assists this season, totalling ${a.totalPts} points at ${a.price}.`)
    if (a.ep_next > 0) {
      caseForA.push(`Expected to score ${a.ep_next.toFixed(1)} points in GW${gw}, making ${a.webName} a viable starting option.`)
    }
    if (a.ownership < 10) {
      caseForA.push(`With only ${a.ownership}% ownership, ${a.webName} offers differential value to boost your rank if they deliver.`)
    } else if (a.formVal > b.formVal) {
      caseForA.push(`${a.webName} has shown better recent form at ${a.form} points per game over the last six gameweeks.`)
    } else {
      caseForA.push(`${a.webName}'s fixture run looks ${avgFdrA <= 2.5 ? "favourable" : avgFdrA >= 3.5 ? "testing" : "manageable"} over ${fwPhrase}.`)
    }
    if (dgwA) {
      caseForA.push(`${a.webName} has a double gameweek in GW${gw}, providing two scoring opportunities.`)
    }
  }

  // ── Case for B ────────────────────────────────────────────────────────────
  const caseForB: string[] = []
  if (bOut) {
    caseForB.push(`Unavailable: ${b.news ? formatFplNews(b.news) : "Currently ruled out - check latest injury news before transferring in."}`)
    caseForB.push(`${b.displayName} has a 0% chance of playing in GW${gw} per the FPL injury feed.`)
    caseForB.push(`${b.displayName} has contributed ${b.goals} goals and ${b.assists} assists this season but cannot be relied upon this gameweek.`)
  } else if (bDoubtful) {
    caseForB.push(`Injury doubt: ${b.news ? formatFplNews(b.news) : `Listed at ${b.chance}% chance of playing in GW${gw} - a significant risk.`}`)
    caseForB.push(`${b.displayName} has registered ${b.goals} goals and ${b.assists} assists this season at ${b.price}.`)
    if (b.ep_next > 0) caseForB.push(`Projects ${b.ep_next.toFixed(1)} expected points in GW${gw} if fit, but availability is uncertain.`)
  } else {
    caseForB.push(`${b.displayName} has registered ${b.goals} goals and ${b.assists} assists this season, totalling ${b.totalPts} points at ${b.price}.`)
    if (b.ep_next > 0) {
      caseForB.push(`Expected to score ${b.ep_next.toFixed(1)} points in GW${gw}, making ${b.webName} a viable starting option.`)
    }
    if (b.ownership < 10) {
      caseForB.push(`With only ${b.ownership}% ownership, ${b.webName} offers differential value to boost your rank if they deliver.`)
    } else if (b.formVal > a.formVal) {
      caseForB.push(`${b.webName} has shown better recent form at ${b.form} points per game over the last six gameweeks.`)
    } else {
      caseForB.push(`${b.webName}'s fixture run looks ${avgFdrB <= 2.5 ? "favourable" : avgFdrB >= 3.5 ? "testing" : "manageable"} over ${fwPhrase}.`)
    }
    if (dgwB) {
      caseForB.push(`${b.webName} has a double gameweek in GW${gw}, providing two scoring opportunities.`)
    }
  }

  // Keep to 3 bullets each
  const trimTo3 = (arr: string[]) => arr.slice(0, 3)

  // ── Q&A ────────────────────────────────────────────────────────────────────
  const qaItems = [
    {
      question: `Who should I pick between ${a.displayName} and ${b.displayName} in Gameweek ${gw}?`,
      answer: aOut && bOut
        ? `Neither player is currently available for GW${gw}. Check the latest FPL injury news and consider alternatives in your squad before making a decision.`
        : aOut
        ? `${a.displayName} is ruled out for GW${gw}${a.news ? ` (${formatFplNews(a.news)})` : ""}, making ${b.displayName} the automatic pick here. Do not risk a zero from an unavailable player.`
        : bOut
        ? `${b.displayName} is ruled out for GW${gw}${b.news ? ` (${formatFplNews(b.news)})` : ""}, making ${a.displayName} the automatic pick here. Do not risk a zero from an unavailable player.`
        : (aDoubtful || bDoubtful)
        ? `There is an injury concern in this comparison - ${aDoubtful ? `${a.displayName} is listed at ${a.chance}% chance of playing` : ""}${aDoubtful && bDoubtful ? " and " : ""}${bDoubtful ? `${b.displayName} is listed at ${b.chance}% chance of playing` : ""}. Monitor team news closely before the deadline. On current numbers, ${verdictPlayer === "EVEN" ? "this is too close to call" : `${winner!.displayName} has the edge if both are fit`}.`
        : verdictPlayer === "EVEN"
        ? `This is a genuine 50/50. Both players carry similar expected returns in GW${gw}. If you already own one, keeping them avoids a transfer cost. If choosing between them fresh, consider squad balance and budget.`
        : `On the numbers, ${winner!.displayName} has the edge in GW${gw}. With ${winner!.ep_next.toFixed(1)} expected points and ${winner!.form} recent form, ${winner!.webName} is the stronger pick heading into this gameweek. That said, squad context and transfer cost should factor into your decision.`,
    },
    {
      question: `Is ${a.displayName} or ${b.displayName} better value in FPL?`,
      answer: (() => {
        const betterVal = a.ptsPerMillion > b.ptsPerMillion ? a : b
        const worseVal  = a.ptsPerMillion > b.ptsPerMillion ? b : a
        return `${betterVal.displayName} offers better value at ${betterVal.ptsPerMillion} points per million compared to ${worseVal.displayName} at ${worseVal.ptsPerMillion} points per million. ${betterVal.webName} is priced at ${betterVal.price} this season.`
      })(),
    },
    {
      question: `What are the fixture differences between ${a.webName} and ${b.webName} over ${fwPhrase}?`,
      answer: (() => {
        const descFdr = (avg: number) => avg <= 2.5 ? "favourable" : avg >= 3.5 ? "difficult" : "average"
        return `${a.displayName} faces a ${descFdr(avgFdrA)} run over ${fwPhrase} with an average FDR of ${avgFdrA.toFixed(1)}. ${b.displayName} faces a ${descFdr(avgFdrB)} run with an average FDR of ${avgFdrB.toFixed(1)}.${bgwA ? ` Note that ${a.webName} has a blank in GW${gw}.` : ""}${bgwB ? ` Note that ${b.webName} has a blank in GW${gw}.` : ""}`
      })(),
    },
    {
      question: `Can I own both ${a.webName} and ${b.webName} in the same FPL squad?`,
      answer: (() => {
        if (!d.samePosition) {
          return `Yes, ${a.displayName} and ${b.displayName} play in different positions, so they can comfortably co-exist in the same squad. Whether it is worth the combined cost depends on your overall budget and other areas you need to cover.`
        }
        const pos = a.position
        const flexNote =
          pos === "DEF"
            ? "FPL allows flexible formations - you can field three, four, or five defenders - so both can start in the same eleven."
            : pos === "MID"
            ? "FPL allows flexible formations - you can field two, three, four, or five midfielders - so both can start in the same eleven."
            : pos === "FWD"
            ? "FPL allows flexible formations - you can field one, two, or three forwards - so both can start in the same eleven."
            : "FPL allows flexible formations, so both can start in the same eleven."
        return `Yes, you can start both. ${flexNote} Whether it makes sense depends on your overall formation, budget, and whether the combined cost leaves enough quality across the rest of your squad.`
      })(),
    },
  ]

  const subheading = `${a.displayName} vs ${b.displayName}: Gameweek ${gw} Analysis`

  return {
    verdictPlayer,
    verdictLabel,
    verdictText,
    verdictBullets: verdictBullets.slice(0, 3),
    caseForA: trimTo3(caseForA),
    caseForB: trimTo3(caseForB),
    qaItems,
    subheading,
  }
}

// ─── Comparisons Hub ──────────────────────────────────────────────────────────

export interface ComparisonHubPair {
  slugA: string
  slugB: string
  nameA: string
  nameB: string
  codeA: number
  codeB: number
  clubA: string
  clubB: string
  teamCodeA: number
  teamCodeB: number
  position: string
  epA: number
  epB: number
  formA: number
  formB: number
  totalPtsA: number
  totalPtsB: number
  goalsA: number
  goalsB: number
  assistsA: number
  assistsB: number
  priceA: string
  priceB: string
  ptsPerMillionA: number
  ptsPerMillionB: number
  ownershipA: number
  ownershipB: number
  combinedOwnership: number
  gap: number
}

export interface ComparisonHubData {
  gw: number
  pairs: ComparisonHubPair[]
}

export async function getComparisonHub(): Promise<ComparisonHubData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent    = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number  = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const teamMap: Record<number, { short: string; code: number }> = {}
    const posMap:  Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    const eligible = (bootstrap.elements ?? []).filter(isEligiblePlayer)
    const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
    const idToSlug = new Map<number, string>()
    for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

    // Top 10 most-owned per outfield position (DEF=2, MID=3, FWD=4)
    const allPairs: ComparisonHubPair[] = []

    for (const posId of [2, 3, 4]) {
      const top10 = eligible
        .filter((p: any) =>
          p.element_type === posId &&
          (p.chance_of_playing_next_round ?? 100) > 0
        )
        .sort((a: any, b: any) =>
          parseFloat(b.selected_by_percent ?? "0") - parseFloat(a.selected_by_percent ?? "0")
        )
        .slice(0, 10)

      // Generate all C(10,2) = 45 within-position pairs
      for (let i = 0; i < top10.length; i++) {
        for (let j = i + 1; j < top10.length; j++) {
          const a = top10[i]
          const b = top10[j]

          const slugA = idToSlug.get(a.id)
          const slugB = idToSlug.get(b.id)
          if (!slugA || !slugB) continue

          // Alphabetical ordering so URL is canonical
          const [sA, sB, pA, pB] =
            slugA < slugB ? [slugA, slugB, a, b] : [slugB, slugA, b, a]

          const epA   = parseFloat(pA.ep_next ?? "0")
          const epB   = parseFloat(pB.ep_next ?? "0")
          const owA   = parseFloat(pA.selected_by_percent ?? "0")
          const owB   = parseFloat(pB.selected_by_percent ?? "0")
          const priceARaw = pA.now_cost / 10
          const priceBRaw = pB.now_cost / 10
          const totalPtsA = pA.total_points ?? 0
          const totalPtsB = pB.total_points ?? 0

          allPairs.push({
            slugA: sA,
            slugB: sB,
            nameA: getDisplayName(pA),
            nameB: getDisplayName(pB),
            codeA: pA.code,
            codeB: pB.code,
            clubA: teamMap[pA.team]?.short ?? "",
            clubB: teamMap[pB.team]?.short ?? "",
            teamCodeA: teamMap[pA.team]?.code ?? 0,
            teamCodeB: teamMap[pB.team]?.code ?? 0,
            position: posMap[pA.element_type] ?? "",
            epA,
            epB,
            formA: parseFloat(pA.form ?? "0"),
            formB: parseFloat(pB.form ?? "0"),
            totalPtsA,
            totalPtsB,
            goalsA: pA.goals_scored ?? 0,
            goalsB: pB.goals_scored ?? 0,
            assistsA: pA.assists ?? 0,
            assistsB: pB.assists ?? 0,
            priceA: `£${priceARaw.toFixed(1)}m`,
            priceB: `£${priceBRaw.toFixed(1)}m`,
            ptsPerMillionA: priceARaw > 0 ? parseFloat((totalPtsA / priceARaw).toFixed(1)) : 0,
            ptsPerMillionB: priceBRaw > 0 ? parseFloat((totalPtsB / priceBRaw).toFixed(1)) : 0,
            ownershipA: owA,
            ownershipB: owB,
            combinedOwnership: owA + owB,
            gap: Math.abs(epA - epB),
          })
        }
      }
    }

    // Shuffle all 135 pairs randomly (different every request due to force-dynamic)
    for (let i = allPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]]
    }

    // Take 25, then sort by combined ownership so biggest names float to top
    const pairs = allPairs
      .slice(0, 25)
      .sort((a, b) => b.combinedOwnership - a.combinedOwnership)

    return { gw, pairs }
  } catch {
    return null
  }
}
