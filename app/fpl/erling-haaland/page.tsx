import { DevHeader } from "@/components/dev-header"
import { Footer } from "@/components/footer"
import { FplPlayerHero, type FplCardPlayer } from "@/components/fpl-player-hero"
import { ConversationalPlayer, type PlayerQA } from "@/components/conversational-player"
import Link from "next/link"

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

    // Current / next gameweek
    const currentGW =
      (bootstrap.events ?? []).find((e: any) => e.is_current)?.id ??
      (bootstrap.events ?? []).find((e: any) => e.is_next)?.id ??
      32

    // Haaland element
    const hEl = (bootstrap.elements ?? []).find((p: any) => p.code === HAALAND_CODE)
    if (!hEl) throw new Error("Haaland not found")

    const hTeam = teamMap[hEl.team]

    // Fixtures for the current GW
    const fixturesRes = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${currentGW}`,
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

    // Top 4 flanking players by ep_next (exclude Haaland, must be fit)
    const others: FplCardPlayer[] = (bootstrap.elements ?? [])
      .filter((p: any) =>
        p.code !== HAALAND_CODE &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 300 &&
        parseFloat(p.ep_next ?? "0") > 0
      )
      .sort((a: any, b: any) => parseFloat(b.ep_next) - parseFloat(a.ep_next))
      .slice(0, 4)
      .map((p: any) => ({
        code:      p.code,
        name:      p.web_name,
        club:      teamMap[p.team]?.short ?? "",
        teamCode:  teamMap[p.team]?.code ?? 0,
        position:  posMap[p.element_type] ?? "",
        price:     `£${(p.now_cost / 10).toFixed(1)}m`,
        form:      p.form ?? "0.0",
        totalPts:  p.total_points ?? 0,
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
      gw: currentGW,
      player: hPlayer,
      opponent,
      isHome,
      fdr,
      showcasePlayers,
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

  const welcome = `${verdict} Click a question below and I will walk you through the numbers.`

  return { verdict, ctaLeadin, qaItems, welcome, gw, price: p.price }
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
        <Footer />
      </div>
    )
  }

  const { gw, player, showcasePlayers } = data
  const { verdict, ctaLeadin, qaItems, welcome } = buildPageText(data)

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      <DevHeader />

      {/* Hero */}
      <FplPlayerHero
        h1White="Should I captain Erling Haaland in "
        h1Gradient={`Fantasy Premier League Gameweek ${gw}?`}
        subtitle={`Gameweek ${gw} · Man City · FWD · ${player.price}`}
        players={showcasePlayers}
      />

      {/* Analysis section */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-16 bg-black">

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

      </main>

      <Footer />
    </div>
  )
}
