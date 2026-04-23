import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { DevHeader } from "@/components/dev-header"
import { ComparisonHero } from "@/components/comparison-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import {
  getComparisonData,
  buildComparisonText,
  ComparisonPlayer,
} from "@/lib/fpl-comparison"
import type { FixtureGW } from "@/lib/fpl-player-page"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

export const revalidate = 43200
export const dynamicParams = true


// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerA: string; playerB: string }>
}) {
  const { playerA, playerB } = await params
  const data = await getComparisonData(playerA, playerB)
  if (!data) return { title: "FPL Player Comparison | ChatFPL AI" }

  const { playerA: a, playerB: b, gw } = data
  return {
    title: `${a.displayName} vs ${b.displayName}: Who to pick in Fantasy Premier League? | ChatFPL AI`,
    description: `${a.displayName} vs ${b.displayName} - Gameweek ${gw} comparison. Form, expected points, fixture difficulty and a full verdict on who to start in your FPL squad.`,
    openGraph: {
      title: `${a.displayName} vs ${b.displayName}: FPL Gameweek ${gw} | ChatFPL AI`,
      description: `Head-to-head FPL analysis: ${a.displayName} vs ${b.displayName} for Gameweek ${gw}. Who has the better fixture, form, and value?`,
      url: `https://www.chatfpl.ai/fpl/compare/${playerA}/${playerB}`,
    },
  }
}

// ─── FDR dots ─────────────────────────────────────────────────────────────────

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <span className="flex gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{ width: 6, height: 6, background: i <= fdr ? "#00FF87" : "rgba(255,255,255,0.12)" }}
        />
      ))}
    </span>
  )
}

// ─── Fixture panel — player photo + 4 sell-page-style GW tiles in a row ─────

function PlayerPhoto({ player }: { player: ComparisonPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: 80 }}>
      <div className="relative flex flex-col items-center">
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
          alt={player.webName}
          width={68}
          height={86}
          style={{ objectFit: "contain" }}
          unoptimized
        />
        {/* Glowing white separator line — same as fpl-player-hero.tsx */}
        <div
          style={{
            height: 1,
            width: "100%",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          }}
        />
      </div>
      <p className="text-[10px] font-bold text-white text-center leading-tight mt-1">{player.webName}</p>
    </div>
  )
}

function FixturePanel({ fixtureRun, player }: { fixtureRun: FixtureGW[]; player: ComparisonPlayer }) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-center gap-4"
      style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.03)" }}
    >
      <PlayerPhoto player={player} />

      {/* 4 GW tiles — sell page size and style */}
      <div className="flex-1 grid grid-cols-4 gap-3">
        {fixtureRun.map((f) => (
          <div
            key={f.gw}
            className="rounded-2xl px-3 py-4 text-center flex flex-col items-center gap-1"
            style={
              f.matches.length === 0
                ? { border: "1px dashed rgba(255,255,255,0.08)", background: "transparent" }
                : f.matches.length >= 2
                ? { border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.04)" }
                : { border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }
            }
          >
            <div className="flex items-center gap-1.5">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">{`GW${f.gw}`}</p>
              {f.matches.length >= 2 && (
                <span className="text-[8px] font-black uppercase tracking-wider rounded px-1 py-0.5 text-black" style={{ background: "#00FF87" }}>DGW</span>
              )}
            </div>

            {f.matches.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 mt-1">
                <svg className="h-7 w-7" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ stroke: "url(#blankGradComp)" }}>
                  <defs>
                    <linearGradient id="blankGradComp" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00FF87" />
                      <stop offset="100%" stopColor="#00FFFF" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" />
                </svg>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white">No fixture</p>
              </div>
            ) : f.matches.length >= 2 ? (
              <div className="flex gap-2 w-full mt-1 justify-center">
                {f.matches.map((m, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                    {m.opponentCode ? (
                      <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${m.opponentCode}.png`} alt={m.opponent} width={22} height={22} className="object-contain" unoptimized />
                    ) : <div className="h-5 w-5" />}
                    <p className="text-[9px] font-bold text-white leading-tight text-center w-full truncate">{m.opponent}</p>
                    <p className="text-[8px] text-white/70">{m.isHome ? "H" : "A"}</p>
                    <FdrDots fdr={m.fdr} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {f.matches[0].opponentCode ? (
                  <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${f.matches[0].opponentCode}.png`} alt={f.matches[0].opponent} width={36} height={36} className="object-contain" unoptimized />
                ) : <div className="h-9 w-9" />}
                <p className="text-sm font-bold text-white leading-tight">{f.matches[0].opponent}</p>
                <p className="text-[10px] text-white/70">{f.matches[0].isHome ? "Home" : "Away"}</p>
                <FdrDots fdr={f.matches[0].fdr} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal stat table ────────────────────────────────────────────────────

const STAT_COLS: { label: string; key: keyof ComparisonPlayer; higherIsBetter: boolean }[] = [
  { label: "GW xPts",    key: "ep_next",        higherIsBetter: true  },
  { label: "Form",       key: "formVal",         higherIsBetter: true  },
  { label: "Season Pts", key: "totalPts",        higherIsBetter: true  },
  { label: "Goals",      key: "goals",           higherIsBetter: true  },
  { label: "Assists",    key: "assists",         higherIsBetter: true  },
  { label: "Pts per £m", key: "ptsPerMillion",   higherIsBetter: true  },
  { label: "Ownership",  key: "ownership",       higherIsBetter: false },
  { label: "Price",      key: "priceRaw",        higherIsBetter: false },
]

function formatStat(player: ComparisonPlayer, key: string): string {
  if (key === "ep_next")      return String(player.ep_next)
  if (key === "formVal")      return player.form
  if (key === "totalPts")     return String(player.totalPts)
  if (key === "goals")        return String(player.goals)
  if (key === "assists")      return String(player.assists)
  if (key === "ptsPerMillion") return String(player.ptsPerMillion)
  if (key === "ownership")    return `${player.ownership}%`
  if (key === "priceRaw")     return player.price
  return ""
}

const WIN_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
}

function StatTable({ playerA, playerB }: { playerA: ComparisonPlayer; playerB: ComparisonPlayer }) {
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.03)" }}>
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <th className="text-center px-3 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold" style={{ position: "sticky", left: 0, zIndex: 3, background: "#020a05" }}>Photo</th>
            <th className="text-center px-3 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold">Player</th>
            {STAT_COLS.map((col) => (
              <th key={col.label} className="text-center px-2 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[playerA, playerB].map((player, rowIdx) => {
            const other = rowIdx === 0 ? playerB : playerA
            return (
              <tr
                key={player.slug}
                style={{ borderBottom: rowIdx === 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
              >
                {/* Photo cell — sticky so it stays visible when scrolling right */}
                <td className="px-3 py-2 text-center" style={{ position: "sticky", left: 0, zIndex: 2, background: "#020a05" }}>
                  <div className="flex flex-col items-center mx-auto" style={{ width: 52 }}>
                    <Image
                      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                      alt={player.webName}
                      width={52}
                      height={65}
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                    <div
                      style={{
                        height: 1, width: 52,
                        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                        boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                      }}
                    />
                  </div>
                </td>
                {/* Player name cell — centred */}
                <td className="px-3 py-2 text-center">
                  <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">{player.webName}</p>
                  <p className="text-[10px] text-white/70 whitespace-nowrap">{player.position} - {player.club}</p>
                </td>
                {/* Stat cells */}
                {STAT_COLS.map((col) => {
                  const valNum  = player[col.key as keyof ComparisonPlayer] as number
                  const othNum  = other[col.key as keyof ComparisonPlayer] as number
                  const wins    = col.higherIsBetter ? valNum > othNum : valNum < othNum
                  const display = formatStat(player, col.key as string)
                  return (
                    <td key={col.label} className="text-center px-2 py-2">
                      <span className="text-sm font-bold" style={wins ? WIN_STYLE : { color: "rgba(255,255,255,0.85)" }}>
                        {display}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ playerA: string; playerB: string }>
}) {
  const { playerA: slugA, playerB: slugB } = await params
  if (await isSeasonOver()) return <SeasonEnded />
  const data = await getComparisonData(slugA, slugB)
  if (!data) notFound()

  const { gw, playerA, playerB, fixtureRunA, fixtureRunB } = data
  const text = buildComparisonText(data)

  const VERDICT_COLOR = "#00FF87"

  const qaForChat = text.qaItems.map((q, i) => ({
    id: `comp-q${i}`,
    question: q.question,
    answer: q.answer,
  }))

  const welcome = `I've pulled the latest GW${gw} data for ${playerA.displayName} and ${playerB.displayName}. The verdict is below - click any question for more detail.`

  // ── Dynamic CTA hook ──────────────────────────────────────────────────────
  const aBlank = (fixtureRunA[0]?.matches.length ?? 1) === 0
  const bBlank = (fixtureRunB[0]?.matches.length ?? 1) === 0
  const aDgw   = (fixtureRunA[0]?.matches.length ?? 0) >= 2
  const bDgw   = (fixtureRunB[0]?.matches.length ?? 0) >= 2

  const priceDiff    = Math.abs(playerA.priceRaw - playerB.priceRaw)
  const hasPriceDiff = priceDiff >= 0.1
  const priceDiffStr = priceDiff.toFixed(1)
  const cheaper = playerA.priceRaw <= playerB.priceRaw ? playerA : playerB
  const dearer  = playerA.priceRaw <= playerB.priceRaw ? playerB : playerA
  const cheaperBlank = cheaper.webName === playerA.webName ? aBlank : bBlank
  const dearerBlank  = cheaper.webName === playerA.webName ? bBlank : aBlank

  // fdrNext isn't on ComparisonPlayer interface so use ep_next as proxy:
  // player with higher ep_next has the better expected fixture outcome
  const betterFix =
    playerA.ep_next > playerB.ep_next ? playerA :
    playerB.ep_next > playerA.ep_next ? playerB : null

  let ctaH3: string
  let ctaBody: string

  // DGW is the strongest signal — flag it first
  if (aDgw || bDgw) {
    const dgwPlayer   = aDgw ? playerA : playerB
    const otherPlayer = aDgw ? playerB : playerA
    ctaH3 = `${dgwPlayer.webName} has a Double Gameweek ${gw} - two fixtures where ${otherPlayer.webName} has one.`
    ctaBody = `Ask ChatFPL AI if a Double Gameweek changes your captaincy and squad plans.`
  // Both blank - neither has an active fixture
  } else if (aBlank && bBlank) {
    ctaH3 = `Both ${playerA.webName} and ${playerB.webName} have a blank this Gameweek ${gw}.`
    ctaBody = `Ask ChatFPL AI if there is a better use of your transfer budget while both players sit out.`
  // Cheaper player has a blank - don't recommend them on price alone
  } else if (hasPriceDiff && cheaperBlank) {
    ctaH3 = `${cheaper.webName} is £${priceDiffStr}m cheaper - but has a blank Gameweek ${gw} with no fixture.`
    ctaBody = `Ask ChatFPL AI whether the saving is worth the short-term cost, or whether ${dearer.webName} is the safer pick this week.`
  // Dearer player has blank - cheaper player is the active one
  } else if (hasPriceDiff && dearerBlank) {
    ctaH3 = `${cheaper.webName} is £${priceDiffStr}m cheaper and has the active fixture this week.`
    ctaBody = `Ask ChatFPL AI if the downgrade makes sense for your specific squad and budget.`
  // Normal case: better fixture costs more
  } else if (betterFix && hasPriceDiff && betterFix.webName !== cheaper.webName) {
    ctaH3 = `${betterFix.webName} has the better fixture run - but ${cheaper.webName} frees up £${priceDiffStr}m.`
    ctaBody = `Ask ChatFPL AI how to spend that £${priceDiffStr}m saving on your specific squad.`
  // Better fixture is also cheaper
  } else if (betterFix && hasPriceDiff && betterFix.webName === cheaper.webName) {
    ctaH3 = `${betterFix.webName} has the better fixture and the lower price tag - saving you £${priceDiffStr}m.`
    ctaBody = `Ask ChatFPL AI where that saving should go in your specific squad.`
  // Same fixture quality, just a price gap
  } else if (hasPriceDiff) {
    ctaH3 = `Similar fixtures this week - but ${cheaper.webName} is £${priceDiffStr}m cheaper.`
    ctaBody = `Ask ChatFPL AI where to invest that £${priceDiffStr}m saving in your specific squad.`
  // Same price, fixture edge
  } else if (betterFix) {
    ctaH3 = `${betterFix.webName} has the better expected return this Gameweek ${gw}.`
    ctaBody = `Ask ChatFPL AI which fits better in your specific squad and mini-league context.`
  } else {
    ctaH3 = `It is close to call between ${playerA.webName} and ${playerB.webName} this gameweek.`
    ctaBody = `Ask ChatFPL AI which fits better in your specific squad.`
  }

  const ctaPrompt = `I'm choosing between ${playerA.displayName} and ${playerB.displayName} for Gameweek ${gw}. Which should I pick for my specific squad?`

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black overflow-x-hidden">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
        @media (max-width: 480px) {
          .comp-hero-cards { transform: scale(0.68); transform-origin: center top; margin-bottom: -99px; }
        }
        @media (min-width: 481px) and (max-width: 620px) {
          .comp-hero-cards { transform: scale(0.82); transform-origin: center top; margin-bottom: -56px; }
        }
      `}</style>

      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: text.qaItems.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer },
            })),
          }),
        }}
      />

      <DevHeader />

      {/* Hero */}
      <ComparisonHero
        h1White={`${playerA.displayName} vs ${playerB.displayName}: Who should I pick for `}
        h1Gradient={`Fantasy Premier League Gameweek ${gw}?`}
        subtitle={`${playerA.position} · Gameweek ${gw} Fantasy Premier League Head-to-Head Comparison`}
        playerA={playerA}
        playerB={playerB}
        gw={gw}
      />

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Subheading */}
        <div className="relative z-10 text-center mb-10 max-w-6xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">
            <span className="text-white">{playerA.displayName} vs {playerB.displayName}: </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Gameweek {gw} Analysis
            </span>
          </h2>
        </div>

        {/* Horizontal stat table */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <StatTable playerA={playerA} playerB={playerB} />
        </div>

        {/* Verdict block */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div
            className="rounded-2xl px-6 py-6"
            style={{
              border: `1px solid ${VERDICT_COLOR}30`,
              background: `${VERDICT_COLOR}08`,
              borderLeft: `4px solid ${VERDICT_COLOR}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                style={{ background: VERDICT_COLOR }}
              >
                {text.verdictLabel}
              </span>
              <p className="text-white font-semibold text-base leading-snug">{text.verdictText}</p>
            </div>
            <ul className="space-y-2">
              {text.verdictBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDICT_COLOR }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fixture run - one panel per player */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-4">Fixture run - next 4 gameweeks</p>
          <div className="flex flex-col gap-3">
            <FixturePanel fixtureRun={fixtureRunA} player={playerA} />
            <FixturePanel fixtureRun={fixtureRunB} player={playerB} />
          </div>
        </div>

        {/* Case for each player */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-lg font-bold text-white mb-5">The case for each player</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: "#00FF87" }}>
                {playerA.webName}
              </p>
              <ul className="space-y-2.5">
                {text.caseForA.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#00FF87" }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: "#00FF87" }}>
                {playerB.webName}
              </p>
              <ul className="space-y-2.5">
                {text.caseForB.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#00FF87" }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
            <span className="text-white">{playerA.webName} vs {playerB.webName} </span>
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
          <ConversationalPlayer welcome={welcome} qaItems={qaForChat} />
        </div>

        {/* CTA */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              border: "1px solid rgba(0,255,135,0.18)",
              borderLeft: "4px solid #00FF87",
              background: "rgba(0,255,135,0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">
              {ctaH3}
            </h3>
            <p className="text-sm text-white/70 mb-7">
              {ctaBody}
            </p>
            <Link
              href={`/chat?q=${encodeURIComponent(ctaPrompt)}`}
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
              Ask ChatFPL AI about my squad
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Back to hub */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-10 text-center">
          <div
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
              href="/fpl/comparisons"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Head-to-Head comparisons for Gameweek {gw} →
              </span>
            </Link>
          </div>
        </div>

        {/* Also analyse */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/fpl/${slugA}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I captain {playerA.webName}?
            </Link>
            <Link
              href={`/fpl/${slugA}/transfer`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I transfer in {playerA.webName}?
            </Link>
            <Link
              href={`/fpl/${slugB}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I captain {playerB.webName}?
            </Link>
            <Link
              href={`/fpl/${slugB}/transfer`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I transfer in {playerB.webName}?
            </Link>
            <Link
              href={`/fpl/${slugA}/differential`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Is {playerA.webName} a differential?
            </Link>
            <Link
              href={`/fpl/${slugB}/differential`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Is {playerB.webName} a differential?
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
