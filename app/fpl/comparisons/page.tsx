import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { getComparisonHub, type ComparisonHubPair } from "@/lib/fpl-comparison"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"
import { HubHero } from "@/components/hub-hero"

export const revalidate = 3600
export const dynamic = "force-dynamic"

const GREEN  = "#00FF87"
const CYAN   = "#00FFFF"
const MUTED  = "#8b949e"
const SURFACE = "rgba(13,17,23,0.82)"
const BORDER  = "rgba(255,255,255,0.07)"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Head-to-Head Comparisons | ChatFPL AI" }
  const data = await getComparisonHub()
  const gw = data?.gw ?? "?"
  return {
    title: `FPL Head-to-Head Comparisons Gameweek ${gw} | ChatFPL AI`,
    description: `The most-owned FPL players head-to-head for Gameweek ${gw}. Haaland vs Salah, Salah vs Palmer and more — expected points, form and a full verdict on who to pick.`,
    openGraph: {
      title: `FPL Head-to-Head Comparisons Gameweek ${gw} | ChatFPL AI`,
      description: `The most-owned FPL players head-to-head for GW${gw} — who to pick, who to bench.`,
      url: "https://www.chatfpl.ai/fpl/comparisons",
    },
  }
}

// ─── Text generation ──────────────────────────────────────────────────────────

function buildCompareText(pair: ComparisonHubPair, gw: number | string, rank: number, randomBase: number): string {
  const { nameA, nameB, epA, epB, formA, formB, totalPtsA, totalPtsB,
          goalsA, goalsB, assistsA, assistsB, priceA, priceB,
          ptsPerMillionA, ptsPerMillionB, ownershipA, ownershipB, position } = pair

  const blankA = epA === 0
  const blankB = epB === 0

  // Handle Blank Gameweek cases first
  if (blankA && blankB) {
    return `Both ${nameA} and ${nameB} have a Blank Gameweek ${gw} with no fixture scheduled. Neither player is expected to return this week. ` +
      `Compare their form and season stats, but hold off on any captaincy or transfer decision until their fixtures resume. ` +
      `The full head-to-head breakdown is available on the comparison page.`
  }
  if (blankA) {
    const activeFm = formB.toFixed(1)
    return `${nameA} has a Blank Gameweek ${gw} with no fixture scheduled, making ${nameB} the clear short-term pick. ` +
      `${nameB} carries ${epB.toFixed(1)} expected points and ${activeFm} recent form into this gameweek. ` +
      `The full head-to-head breakdown including form and fixture run is available on the comparison page.`
  }
  if (blankB) {
    const activeFm = formA.toFixed(1)
    return `${nameB} has a Blank Gameweek ${gw} with no fixture scheduled, making ${nameA} the clear short-term pick. ` +
      `${nameA} carries ${epA.toFixed(1)} expected points and ${activeFm} recent form into this gameweek. ` +
      `The full head-to-head breakdown including form and fixture run is available on the comparison page.`
  }

  const epWinner    = epA >= epB ? nameA : nameB
  const epLoser     = epA >= epB ? nameB : nameA
  const epLeader    = Math.max(epA, epB).toFixed(1)
  const epTrailer   = Math.min(epA, epB).toFixed(1)
  const gap         = Math.abs(epA - epB).toFixed(1)
  const formWinner  = formA >= formB ? nameA : nameB
  const formLoser   = formA >= formB ? nameB : nameA
  const formLeader  = Math.max(formA, formB).toFixed(1)
  const formTrailer = Math.min(formA, formB).toFixed(1)
  const ptsWinner   = totalPtsA >= totalPtsB ? nameA : nameB
  const valueWinner = ptsPerMillionA >= ptsPerMillionB ? nameA : nameB

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `The expected points model has ${epWinner} at ${epLeader} for Gameweek ${gw}, against ${epTrailer} for ${epLoser}, a gap of ${gap} points heading into this gameweek. ` +
      `Form supports that picture: ${formWinner} has averaged ${formLeader} points per game over the last six gameweeks, while ${formLoser} is averaging ${formTrailer}. ` +
      `Both players are competing for budget space in millions of squads, and the decision often comes down to who carries better short-term momentum. ` +
      `The full fixture run and detailed head-to-head breakdown are available on the comparison page.`
  }

  if (variant === 1) {
    const totalGA_A = goalsA + assistsA
    const totalGA_B = goalsB + assistsB
    const gaWinner  = totalGA_A >= totalGA_B ? nameA : nameB
    const gaLeader  = Math.max(totalGA_A, totalGA_B)
    const ptsDiff   = Math.abs(totalPtsA - totalPtsB)
    return `Across the season, ${ptsWinner} leads on total points and the gap stands at ${ptsDiff}. ` +
      `On attacking output, ${gaWinner} edges the combined goals and assists count with ${gaLeader} direct contributions. ` +
      `${nameA} has ${goalsA} goals and ${assistsA} assists this season; ${nameB} has ${goalsB} goals and ${assistsB} assists. ` +
      `Ownership sits at ${ownershipA}% for ${nameA} and ${ownershipB}% for ${nameB}, meaning this is a decision with real rank implications across a significant slice of the field. ` +
      `For Gameweek ${gw}, the model projects ${epLeader} expected points for ${epWinner}.`
  }

  const priceDiff = Math.abs(
    parseFloat(priceA.replace(/[£m]/g, "")) - parseFloat(priceB.replace(/[£m]/g, ""))
  ).toFixed(1)
  return `Priced at ${priceA} and ${priceB}, there is a £${priceDiff}m differential between these two ${position}s. ` +
    `On a pure value basis, ${valueWinner} generates more points per million this season. ` +
    `${nameA} at ${ptsPerMillionA} against ${nameB} at ${ptsPerMillionB}. ` +
    `The Gameweek ${gw} expected points model gives ${epWinner} the edge at ${epLeader} projected points. ` +
    `With ownership at ${ownershipA}% and ${ownershipB}% respectively, picking the right one has meaningful rank consequences. ` +
    `The full fixture-by-fixture comparison is on the dedicated head-to-head page.`
}


// ─── Comparison card ──────────────────────────────────────────────────────────

function CompareCard({ pair, rank, gw, text }: {
  pair: ComparisonHubPair; rank: number; gw: number | string; text: string
}) {
  const priceNumA = parseFloat(pair.priceA.replace(/[£m]/g, ""))
  const priceNumB = parseFloat(pair.priceB.replace(/[£m]/g, ""))

  return (
    <div
      className="compare-card group"
      style={{
        background: SURFACE, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${BORDER}`, borderTop: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.8)",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(to right,${GREEN},${CYAN})`, opacity: 0.6 }} />
      <div className="flex flex-row">

        {/* Left photo */}
        <div className="relative shrink-0 flex flex-col items-center justify-center w-16 sm:w-52"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          <div className="absolute top-2 left-2 z-10 flex items-center justify-center rounded"
            style={{ width: 20, height: 20, background: "rgba(0,0,0,0.8)", border: `1px solid rgba(0,255,135,0.2)` }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{rank}</span>
          </div>
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5"
            style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.2)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >{pair.position}</div>
          <div className="flex flex-col items-center">
            <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeA}.png`}
              alt={pair.nameA} width={160} height={204} className="w-12 sm:w-[160px]"
              style={{ objectFit: "contain" }} unoptimized />
            <div className="w-12 sm:w-[160px]" style={{ height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
          </div>
        </div>

        {/* Centre */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="grid grid-cols-2 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-r" style={{ borderColor: BORDER }}>
              <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeA}.png`}
                alt={pair.clubA} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pair.nameA}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 px-3 py-2.5">
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pair.nameB}</span>
              <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeB}.png`}
                alt={pair.clubB} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
            </div>
          </div>
          {/* Stats — single grid so auto center column sizes once to widest label */}
          {(() => {
            const bSold  = `1px solid ${BORDER}`
            const bInner = "1px solid rgba(255,255,255,0.05)"
            const val = (wins: boolean, last = false) => ({
              fontSize: 13, fontWeight: 700,
              color: wins ? GREEN : "white",
              textShadow: wins ? `0 0 12px ${GREEN}80` : "none",
              background: wins ? "rgba(0,255,135,0.05)" : "transparent",
              borderBottom: last ? "none" : bSold,
            } as React.CSSProperties)
            const lbl = (last = false) => ({
              fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" as const,
              color: MUTED, whiteSpace: "nowrap" as const,
              borderBottom: last ? "none" : bSold,
            })
            const epA = pair.epA; const epB = pair.epB
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr" }}>
                {/* xPTS */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(epA > epB && epA > 0), borderRight: bInner }}>{epA === 0 ? "--" : epA.toFixed(1)}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl()}>xPTS</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(epB > epA && epB > 0), borderLeft: bInner }}>{epB === 0 ? "--" : epB.toFixed(1)}</div>
                {/* FORM */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(pair.formA > pair.formB), borderRight: bInner }}>{pair.formA.toFixed(1)}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl()}>FORM</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(pair.formB > pair.formA), borderLeft: bInner }}>{pair.formB.toFixed(1)}</div>
                {/* PRICE */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(priceNumA < priceNumB, true), borderRight: bInner }}>{pair.priceA}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl(true)}>PRICE</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...val(priceNumB < priceNumA, true), borderLeft: bInner }}>{pair.priceB}</div>
              </div>
            )
          })()}
          <div className="flex items-center justify-center px-4 py-5 border-t" style={{ borderColor: BORDER }}>
            <div className="rounded-full p-px transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)]"
              style={{ background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }}
            >
              <Link href={`/fpl/compare/${pair.slugA}/${pair.slugB}`}
                className="block whitespace-nowrap font-bold rounded-full"
                style={{ background: "#0d1117", padding: "5px 20px", fontSize: "clamp(9px, 1.1vw, 12px)" }}
              >
                <span style={{ backgroundImage: `linear-gradient(to right, ${GREEN}, ${CYAN})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {`Full comparison: ${pair.nameA.split(" ").at(-1)} vs ${pair.nameB.split(" ").at(-1)}`}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right photo */}
        <div className="relative shrink-0 flex flex-col items-center justify-center w-16 sm:w-52"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          <div className="flex flex-col items-center">
            <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeB}.png`}
              alt={pair.nameB} width={160} height={204} className="w-12 sm:w-[160px]"
              style={{ objectFit: "contain" }} unoptimized />
            <div className="w-12 sm:w-[160px]" style={{ height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
          </div>
        </div>

      </div>

      {/* Expand — full width */}
      <div className="border-t px-4 py-1" style={{ borderColor: BORDER }}>
        <HubCardExpand
          slug={`${pair.slugA}-vs-${pair.slugB}`}
          gw={gw}
          text={text}
          promptLabel={`Who should I pick: ${pair.nameA} or ${pair.nameB} in GW${gw}?`}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparisonsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const randomBase = Math.floor(Math.random() * 3)

  const data = await getComparisonHub()
  if (!data) notFound()

  const { gw, pairs } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <style>{`
        .compare-card:hover {
          transform: scale(1.005);
          border-color: rgba(0,255,135,0.25) !important;
          box-shadow: 0 12px 40px 0 rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,135,0.1) !important;
        }
      `}</style>

      <DevHeader />

      <HubHero
        headingWhite="FPL Head-to-Head Picks for "
        headingGradient={`Gameweek ${gw}`}
        subtitle="Same-position matchups ranked by combined ownership. The stronger stat is highlighted. Click any pair for the full breakdown and AI chat."
      />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl">

          {/* Comparison cards */}
          <div className="flex flex-col gap-3">
            {pairs.map((pair, i) => (
              <Reveal key={`${pair.slugA}-${pair.slugB}`} delay={i * 0.04}>
                <CompareCard
                  pair={pair}
                  rank={i + 1}
                  gw={gw}
                  text={buildCompareText(pair, gw, i + 1, randomBase)}
                />
              </Reveal>
            ))}
          </div>

          {/* Explainer */}
          <p className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
            25 random matchups from the top 10 most-owned defenders, midfielders and forwards for GW{gw}. Ranked by combined ownership. Excludes goalkeepers and ruled-out players. Refreshes each visit.
          </p>

          {/* Browse by budget */}
          <div className="mt-12 mb-2">
            <h2 className="text-2xl font-bold leading-tight tracking-tight mb-6 text-center">
              <span className="text-white">Browse by </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>Budget</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: "/fpl/best/goalkeepers/under-4m",   text: "GKP Under £4.0m" },
                { href: "/fpl/best/goalkeepers/under-4-5m", text: "GKP Under £4.5m" },
                { href: "/fpl/best/goalkeepers/under-5m",   text: "GKP Under £5.0m" },
                { href: "/fpl/best/defenders/under-4m",     text: "DEF Under £4.0m" },
                { href: "/fpl/best/defenders/under-4-5m",   text: "DEF Under £4.5m" },
                { href: "/fpl/best/defenders/under-5m",     text: "DEF Under £5.0m" },
                { href: "/fpl/best/defenders/under-5-5m",   text: "DEF Under £5.5m" },
                { href: "/fpl/best/defenders/under-6m",     text: "DEF Under £6.0m" },
                { href: "/fpl/best/midfielders/under-5m",   text: "MID Under £5.0m" },
                { href: "/fpl/best/midfielders/under-5-5m", text: "MID Under £5.5m" },
                { href: "/fpl/best/midfielders/under-6m",   text: "MID Under £6.0m" },
                { href: "/fpl/best/midfielders/under-6-5m", text: "MID Under £6.5m" },
                { href: "/fpl/best/midfielders/under-7m",   text: "MID Under £7.0m" },
                { href: "/fpl/best/forwards/under-6m",      text: "FWD Under £6.0m" },
                { href: "/fpl/best/forwards/under-6-5m",    text: "FWD Under £6.5m" },
                { href: "/fpl/best/forwards/under-7m",      text: "FWD Under £7.0m" },
                { href: "/fpl/best/forwards/under-7-5m",    text: "FWD Under £7.5m" },
                { href: "/fpl/best/forwards/under-8m",      text: "FWD Under £8.0m" },
              ].map(({ href, text }) => (
                <div
                  key={href}
                  className="inline-block"
                  style={{
                    padding: "1.5px",
                    borderRadius: "9999px",
                    background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
                    backgroundSize: "200% 200%",
                    animation: "glow_scroll 3.5s linear infinite",
                  }}
                >
                  <Link
                    href={href}
                    className="flex items-center rounded-full px-4 py-2 text-xs font-semibold"
                    style={{ background: "rgba(0,0,0,0.9)" }}
                  >
                    <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {text}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-10 h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }}
          />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{
              border: "1px solid rgba(0,255,135,0.18)",
              borderLeft: "4px solid #00FF87",
              background: "rgba(0,255,135,0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Can&apos;t split them?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, transfer budget, and rival managers to give you a personalised verdict. Try it free - no credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
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
    </div>
  )
}
