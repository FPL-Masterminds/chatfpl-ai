import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero, type FplCardPlayer } from "@/components/fpl-player-hero"
import { ConversationalPlayer, type PlayerQA } from "@/components/conversational-player"
import Link from "next/link"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(firstName: string, secondName: string): string {
  return `${firstName} ${secondName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── FPL API fetch (server-side, cached 1 hour) ───────────────────────────────

const HAALAND_CODE = 223094

async function getPageData() {
  try {
    const bootstrapRes = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      headers: { "User-Agent": "ChatFPL/1.0" },
      next: { revalidate: 3600 },
    })
    if (!bootstrapRes.ok) throw new Error("FPL API unavailable")
    const bootstrap = await bootstrapRes.json()

    // Maps
    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    const posMap: Record<number, string> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    // Always use the NEXT (upcoming) gameweek for fixtures and display
    const events = bootstrap.events ?? []
    const nextGW =
      events.find((e: any) => e.is_next)?.id ??
      (events.find((e: any) => e.is_current)?.id ?? 31) + 1

    // Haaland element
    const hEl = (bootstrap.elements ?? []).find((p: any) => p.code === HAALAND_CODE)
    if (!hEl) throw new Error("Haaland not found")

    const hTeam = teamMap[hEl.team]

    // Fixtures for the NEXT GW
    const fixturesRes = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${nextGW}`,
      { headers: { "User-Agent": "ChatFPL/1.0" }, next: { revalidate: 900 } }
    )
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : []
    const hFixture = (fixtures as any[]).find(
      (f) => f.team_h === hEl.team || f.team_a === hEl.team
    )
    const isHome = hFixture?.team_h === hEl.team
    const oppId = isHome ? hFixture?.team_a : hFixture?.team_h
    const opponent = oppId ? teamMap[oppId]?.name ?? "TBD" : "TBD"
    const fdr = hFixture
      ? isHome ? (hFixture.team_h_difficulty ?? 3) : (hFixture.team_a_difficulty ?? 3)
      : 3

    const hPlayer = {
      code:        HAALAND_CODE,
      name:        hEl.web_name,
      club:        hTeam?.short ?? "MCI",
      teamCode:    hTeam?.code ?? 43,
      position:    posMap[hEl.element_type] ?? "FWD",
      price:       `£${(hEl.now_cost / 10).toFixed(1)}m`,
      form:        hEl.form ?? "0.0",
      totalPts:    hEl.total_points ?? 0,
      // For conditional logic
      ep_next:     parseFloat(hEl.ep_next ?? "0"),
      ownership:   parseFloat(hEl.selected_by_percent ?? "0"),
      goals:       hEl.goals_scored ?? 0,
      assists:     hEl.assists ?? 0,
      news:        hEl.news ?? "",
      chance:      hEl.chance_of_playing_next_round ?? 100,
    }

    // Fit, active players sorted by ep_next (exclude Haaland)
    const fitByEpNext = (bootstrap.elements ?? [])
      .filter((p: any) =>
        p.code !== HAALAND_CODE &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 300 &&
        parseFloat(p.ep_next ?? "0") > 0
      )
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))

    // Top 4 for flanking cards
    const others: FplCardPlayer[] = fitByEpNext.slice(0, 4).map((p: any) => ({
      code:      p.code,
      name:      p.web_name,
      club:      teamMap[p.team]?.short ?? "",
      teamCode:  teamMap[p.team]?.code ?? 0,
      position:  posMap[p.element_type] ?? "",
      price:     `£${(p.now_cost / 10).toFixed(1)}m`,
      form:      p.form ?? "0.0",
      totalPts:  p.total_points ?? 0,
    }))

    // Top 6 attackers/midfielders for "Also analyse" — defenders are not captain options
    const relatedPlayers = fitByEpNext
      .filter((p: any) => p.element_type >= 3) // 3=MID, 4=FWD only
      .slice(0, 6)
      .map((p: any) => ({
        name:  `${p.first_name} ${p.second_name}`,
        slug:  toSlug(p.first_name, p.second_name),
      }))

    // Arrange: [0, 1, HAALAND, 2, 3]
    const centerCard: FplCardPlayer = {
      code:     hPlayer.code,
      name:     hPlayer.name,
      club:     hPlayer.club,
      teamCode: hPlayer.teamCode,
      position: hPlayer.position,
      price:    hPlayer.price,
      form:     hPlayer.form,
      totalPts: hPlayer.totalPts,
    }
    const showcasePlayers: FplCardPlayer[] = [
      others[0] ?? centerCard,
      others[1] ?? centerCard,
      centerCard,
      others[2] ?? centerCard,
      others[3] ?? centerCard,
    ]

    return {
      gw: nextGW,
      player: hPlayer,
      opponent,
      isHome,
      fdr,
      showcasePlayers,
      relatedPlayers,
    }
  } catch {
    // Sensible fallback so the page still renders
    return null
  }
}

// ─── Conditional text builders (no em dashes) ────────────────────────────────

function buildPageText(d: NonNullable<Awaited<ReturnType<typeof getPageData>>>) {
  const { gw, player: p, opponent, isHome, fdr } = d
  const fixture = `${opponent} (${isHome ? "H" : "A"})`

  const verdict =
    p.ep_next >= 8 ? `Yes - ${p.name} is one of the strongest captaincy options in Gameweek ${gw}.`
    : p.ep_next >= 6 ? `Probably yes - ${p.name} is a solid captaincy pick for Gameweek ${gw}.`
    : p.ep_next >= 4 ? `It depends - ${p.name} is a reasonable option but not the obvious armband choice this week.`
    : `Probably not - there are stronger captaincy options available for Gameweek ${gw}, but here is the case for ${p.name}.`

  const formVal = parseFloat(p.form)
  const formText =
    formVal >= 8 ? `${p.name} is in exceptional form right now, averaging ${p.form} points per game over the last six gameweeks.`
    : formVal >= 6 ? `${p.name} is in good form, averaging ${p.form} points per game over the last six gameweeks.`
    : formVal >= 4 ? `${p.name}'s form is moderate - ${p.form} points per game over the last six gameweeks.`
    : `${p.name} has been out of form recently, averaging just ${p.form} points per game over the last six gameweeks.`

  const fixtureText =
    fdr <= 2 ? `${p.name} faces ${fixture} in Gameweek ${gw} - one of the more favourable fixtures this week.`
    : fdr === 3 ? `${p.name} faces ${fixture} in Gameweek ${gw} - a workable fixture, neither easy nor particularly tough.`
    : `${p.name} faces ${fixture} in Gameweek ${gw} - a difficult fixture on paper, which is the main reason to hesitate.`

  const ownershipText =
    p.ownership >= 40 ? `With ${p.ownership}% of managers owning ${p.name}, not captaining him is a significant differential decision. You would need a strong reason to look elsewhere.`
    : p.ownership >= 20 ? `At ${p.ownership}% ownership, ${p.name} is a popular pick. Missing his points could cost you rank.`
    : p.ownership >= 10 ? `${p.name} is owned by ${p.ownership}% of managers - well held but not so popular that skipping him is a disaster.`
    : `With only ${p.ownership}% ownership, ${p.name} is a genuine differential. If he delivers, you gain significantly on the field.`

  const availabilityText =
    p.chance < 50 ? `There is a significant fitness concern: ${p.news}. Captaining ${p.name} carries real risk this week.`
    : p.chance < 75 ? `There is a minor doubt over ${p.name}'s availability. ${p.news}. Worth monitoring before the deadline.`
    : `There are no injury concerns flagged at the time of writing.`

  const closingText =
    p.ep_next >= 6 && fdr <= 3
      ? `The combination of strong expected points and a manageable fixture makes ${p.name} a captain pick you can make with confidence.`
      : p.ep_next >= 6 && fdr >= 4
      ? `${p.name}'s expected output is strong, but the fixture is tough. A viable captain pick for those willing to back him against the odds.`
      : p.ep_next < 6 && fdr <= 2
      ? `The fixture is kind, which gives ${p.name} an outside chance of a big week even if the numbers do not shout captain.`
      : `With a difficult fixture and modest expected points, ${p.name} is not a captain pick to recommend this week unless your options are very limited.`

  const ctaLeadin =
    p.ep_next >= 6
      ? `Want to know how ${p.name} compares against the other top captaincy options this week? ChatFPL AI can compare your specific options based on your squad.`
      : `Not convinced ${p.name} is the right call? ChatFPL AI can suggest the strongest captaincy option for your squad and budget.`

  const qaItems: PlayerQA[] = [
    {
      id: "captain",
      question: `Should I captain ${p.name} in Gameweek ${gw}?`,
      answer: [
        verdict,
        "",
        formText,
        fixtureText,
        "",
        ownershipText,
        "",
        availabilityText,
        "",
        closingText,
      ].join("\n"),
    },
    {
      id: "transfer",
      question: `Should I transfer ${p.name} in before Gameweek ${gw}?`,
      answer: [
        p.ep_next >= 6
          ? `If you have the budget, yes - the timing makes sense.`
          : `It is worth considering, but the case is not as clear-cut as it might appear.`,
        "",
        `At ${p.price}, ${p.name} has registered ${p.goals} goals and ${p.assists} assists this season for ${p.totalPts} points in total. ${formText}`,
        "",
        fixtureText,
        "",
        `The main argument against bringing him in is the price point. At ${p.price}, you need to make cuts elsewhere in your squad to fit him in. Whether that trade-off is worth it depends on who you would be selling and what your budget looks like.`,
        "",
        `ChatFPL AI can look at your specific squad and tell you whether the transfer makes sense for your team right now.`,
      ].join("\n"),
    },
    {
      id: "fixtures",
      question: `What are ${p.name}'s upcoming fixtures?`,
      answer: [
        `${p.name}'s next fixture is ${fixture} in Gameweek ${gw}, rated ${fdr} out of 5 for difficulty${fdr <= 2 ? " - a comfortable match on paper" : fdr === 3 ? " - a workable fixture" : " - a tough assignment"}.`,
        "",
        `Fixture difficulty ratings give you a rough guide but they do not account for recent form, home advantage in depth, or how a team has performed against specific opponents this season.`,
        "",
        `For a full fixture run breakdown across the next four or five gameweeks, ChatFPL AI can compare ${p.name}'s schedule against the other premium options in his position and tell you whether now is a good time to hold or sell.`,
      ].join("\n"),
    },
    {
      id: "value",
      question: `Is ${p.name} worth ${p.price} in FPL?`,
      answer: [
        p.totalPts >= 150
          ? `Based on the numbers, yes - ${p.name} has justified his price tag this season.`
          : `It depends on how the rest of your squad is structured.`,
        "",
        `${p.name} has scored ${p.totalPts} points at ${p.price} this season, with ${p.goals} goals and ${p.assists} assists. ${formText}`,
        "",
        p.ownership >= 30
          ? `At ${p.ownership}% ownership, avoiding ${p.name} is increasingly a deliberate differential call rather than a neutral decision.`
          : `At ${p.ownership}% ownership, ${p.name} is not as universal a pick as some premium assets. There is room to take a different view without it costing you rank.`,
        "",
        `The real question at ${p.price} is whether you can afford him without weakening two or three other positions. ChatFPL AI can assess your squad balance and tell you whether the budget allocation makes sense.`,
      ].join("\n"),
    },
  ]

  // ── Static For/Against bullets (server-rendered so Google reads them) ──────
  const caseFor: string[] = []
  const caseAgainst: string[] = []

  // Form
  if (formVal >= 6)
    caseFor.push(`Form: ${p.form} pts/game over the last 6 gameweeks - one of the better-returning players in his position right now.`)
  else if (formVal >= 4)
    caseAgainst.push(`Form: only ${p.form} pts/game over the last 6 gameweeks - returns have been below the level you would expect for a captain pick.`)
  else
    caseAgainst.push(`Form: ${p.form} pts/game over the last 6 gameweeks - poor recent returns make him a risky armband choice this week.`)

  // Fixture
  if (fdr <= 2)
    caseFor.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is one of the more inviting matchups available to premium assets this week.`)
  else if (fdr === 3)
    caseFor.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is a workable fixture - not elite, but not a reason to avoid him.`)
  else
    caseAgainst.push(`Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} is a tough assignment - better-fixture alternatives exist this week.`)

  // Expected points
  if (p.ep_next >= 7)
    caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} is among the highest of any player this week.`)
  else if (p.ep_next >= 5)
    caseFor.push(`Expected points: ${p.ep_next} xPts for GW${gw} - a solid projected return for a premium asset.`)
  else
    caseAgainst.push(`Expected points: only ${p.ep_next} xPts projected for GW${gw} - the model suggests stronger options are available.`)

  // Ownership
  if (p.ownership >= 40)
    caseAgainst.push(`Ownership: at ${p.ownership}%, not captaining him is a significant points-against decision - but that alone is not a reason to pick him.`)
  else if (p.ownership >= 20)
    caseFor.push(`Ownership: ${p.ownership}% ownership means blanking costs rank. It is a real consideration.`)
  else
    caseFor.push(`Ownership: ${p.ownership}% makes him a genuine differential. A big return here would move you up the overall rankings.`)

  // Goals and assists
  if (p.goals + p.assists >= 15)
    caseFor.push(`Returns: ${p.goals} goals and ${p.assists} assists this season - consistent enough to justify the price tag.`)
  else if (p.goals + p.assists >= 8)
    caseFor.push(`Returns: ${p.goals} goals and ${p.assists} assists - decent underlying output for the season.`)
  else
    caseAgainst.push(`Returns: only ${p.goals} goals and ${p.assists} assists this season - the volume has not been there.`)

  // Availability
  if (p.chance < 75)
    caseAgainst.push(`Availability: ${p.news} - there is a real risk he does not start or plays reduced minutes.`)

  // Ensure at least one bullet each side
  if (caseFor.length === 0)
    caseFor.push(`${p.name} has shown he is capable of a big return on his day, and the FPL captaincy is ultimately about upside.`)
  if (caseAgainst.length === 0)
    caseAgainst.push(`At ${p.price} and ${p.ownership}% ownership, the expectation bar for the armband is high - any blank hurts.`)

  const caseHeading =
    p.ep_next >= 6
      ? `Why ${p.name} is worth the armband in GW${gw}`
      : `Why ${p.name} is probably not the best captain in GW${gw}`

  const welcome = `${verdict} Click a question below and I will walk you through the numbers.`

  // Verdict badge for the static answer block
  const verdictLabel =
    p.ep_next >= 8 ? "YES"
    : p.ep_next >= 6 ? "PROBABLY YES"
    : p.ep_next >= 4 ? "MAYBE"
    : "PROBABLY NOT"

  const verdictColor = "#00FF87"

  // Three crawlable bullets directly beneath the verdict
  const verdictBullets = [
    formVal >= 6
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - above average returns`
      : formVal >= 4
      ? `Form: ${p.form} pts/game over the last 6 gameweeks - moderate returns`
      : `Form: ${p.form} pts/game over the last 6 gameweeks - below expectations`,
    fdr <= 2
      ? `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - one of the easier fixtures this week`
      : fdr === 3
      ? `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - a workable fixture`
      : `Fixture: ${opponent} (${isHome ? "H" : "A"}) in GW${gw} - a tough assignment`,
    p.ownership >= 30
      ? `Ownership: ${p.ownership}% - blanking carries a significant rank cost`
      : `Ownership: ${p.ownership}% - a genuine differential pick`,
  ]

  return { verdict, verdictLabel, verdictColor, verdictBullets, caseFor, caseAgainst, caseHeading, ctaLeadin, qaItems, welcome, gw, price: p.price }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Should I captain Erling Haaland in Fantasy Premier League? | ChatFPL AI",
  description: "Live form, expected points, and fixture analysis for Erling Haaland. Find out if Haaland is the right captain pick this gameweek with ChatFPL AI.",
  openGraph: {
    title: "Should I captain Erling Haaland? - FPL Captain Analysis | ChatFPL AI",
    description: "Live FPL data and AI analysis for Erling Haaland. Captain verdict, transfer advice, fixture breakdown and more.",
    url: "https://www.chatfpl.ai/fpl/erling-haaland",
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HaalandPage() {
  const data = await getPageData()

  // Render a graceful fallback if API is down
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <DevHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">FPL data is temporarily unavailable. Please try again shortly.</p>
        </main>
      </div>
    )
  }

  const { gw, player, showcasePlayers, relatedPlayers } = data
  const { verdict, verdictLabel, verdictColor, verdictBullets, caseFor, caseAgainst, caseHeading, ctaLeadin, qaItems, welcome } = buildPageText(data)

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      {/* FAQPage JSON-LD schema — tells Google exactly what questions this page answers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: qaItems.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer.replace(/\n/g, " ") },
            })),
          }),
        }}
      />

      <DevHeader />

      {/* Hero */}
      <FplPlayerHero
        h1White="Should I captain Erling Haaland in "
        h1Gradient={`Fantasy Premier League Gameweek ${gw}?`}
        subtitle={`Gameweek ${gw} · Man City · FWD · ${player.price}`}
        players={showcasePlayers}
      />

      {/* Analysis section */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        {/* Radial glow only - no grid */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Form (last 6 GWs)", value: player.form },
              { label: `Expected pts, GW${gw}`, value: String(player.ep_next) },
              { label: "Season total", value: `${player.totalPts} pts` },
              { label: "Ownership", value: `${player.ownership}%` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center"
              >
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-1">{s.label}</p>
                <p
                  className="text-2xl font-bold text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Static verdict block (crawlable HTML — Google reads this first) ── */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div
            className="rounded-2xl px-6 py-6"
            style={{
              border: `1px solid ${verdictColor}30`,
              background: `${verdictColor}08`,
              borderLeft: `4px solid ${verdictColor}`,
            }}
          >
            {/* Verdict badge + headline */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                style={{ background: verdictColor }}
              >
                {verdictLabel}
              </span>
              <p className="text-white font-semibold text-base leading-snug">{verdict}</p>
            </div>

            {/* Three crawlable bullets */}
            <ul className="space-y-2">
              {verdictBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: verdictColor }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── For / Against (static HTML — Google reads this fully) ── */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-lg font-bold text-white mb-5">{caseHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Case for */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: "#00FF87" }}>The case for</p>
              <ul className="space-y-2.5">
                {caseFor.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#00FF87" }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            {/* Case against */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/50 mb-3">The case against</p>
              <ul className="space-y-2.5">
                {caseAgainst.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Chat heading */}
        <div className="relative z-10 text-center mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
            <span className="text-white">Haaland Analysis </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Gameweek {gw}
            </span>
          </h2>
          <p className="text-white/70 text-sm">Click a question below and get the full breakdown.</p>
        </div>

        {/* Chat window */}
        <div
          className="relative z-10 w-full max-w-4xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalPlayer
            welcome={welcome}
            qaItems={qaItems}
          />
        </div>

        {/* CTA section */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.04] px-8 py-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">
              {ctaLeadin}
            </h3>
            <p className="text-sm text-white/70 mb-7">
              Get 20 free messages. No credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
              Try ChatFPL AI for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Internal links — also analyse ── */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            {relatedPlayers.map((p) => (
              <Link
                key={p.slug}
                href={`/fpl/${p.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
              >
                Should I captain {p.name}?
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
