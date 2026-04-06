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

export const revalidate = 3600
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

// ─── Single GW tile ───────────────────────────────────────────────────────────

function GWTile({ f }: { f: FixtureGW }) {
  return (
    <div
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white">No fixture</p>
        </div>
      ) : f.matches.length >= 2 ? (
        <div className="flex flex-col gap-2 w-full mt-1">
          {f.matches.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              {m.opponentCode ? (
                <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${m.opponentCode}.png`} alt={m.opponent} width={28} height={28} className="object-contain" unoptimized />
              ) : <div className="h-7 w-7" />}
              <p className="text-xs font-bold text-white leading-tight">{m.opponent}</p>
              <p className="text-[10px] text-white/70">{m.isHome ? "H" : "A"}</p>
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
  )
}

// ─── Player fixture column (photo + 2x2 grid of GW tiles) ─────────────────────

function PlayerFixtureCol({ player, fixtureRun }: { player: ComparisonPlayer; fixtureRun: FixtureGW[] }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Photo with glowing line */}
      <div className="flex flex-col items-center">
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
          alt={player.webName}
          width={80}
          height={100}
          style={{ objectFit: "contain" }}
          unoptimized
        />
        <div
          style={{
            height: 1, width: 80,
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          }}
        />
        <p className="text-[11px] font-bold text-white mt-2 tracking-tight">{player.webName}</p>
        <p className="text-[9px] text-white/70">{player.club} - {player.position}</p>
      </div>

      {/* 2x2 GW tile grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {fixtureRun.map((f) => <GWTile key={f.gw} f={f} />)}
      </div>
    </div>
  )
}

// ─── Two-column fixture comparison panel with gradient divider ────────────────

function FixtureComparison({
  playerA, fixtureRunA, playerB, fixtureRunB,
}: {
  playerA: ComparisonPlayer; fixtureRunA: FixtureGW[]
  playerB: ComparisonPlayer; fixtureRunB: FixtureGW[]
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.03)" }}
    >
      <div className="grid grid-cols-[1fr_1px_1fr]">
        {/* Player A */}
        <div className="p-5">
          <PlayerFixtureCol player={playerA} fixtureRun={fixtureRunA} />
        </div>

        {/* Gradient divider */}
        <div
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(0,255,135,0.5) 20%, rgba(0,255,255,0.5) 80%, transparent 100%)",
          }}
        />

        {/* Player B */}
        <div className="p-5">
          <PlayerFixtureCol player={playerB} fixtureRun={fixtureRunB} />
        </div>
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
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold w-44">Player</th>
            {STAT_COLS.map((col) => (
              <th key={col.label} className="text-center px-3 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold whitespace-nowrap">
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
                {/* Player cell */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <Image
                        src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                        alt={player.webName}
                        width={40}
                        height={50}
                        style={{ objectFit: "contain" }}
                        unoptimized
                      />
                      <div
                        style={{
                          height: 1, width: 40,
                          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                          boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{player.webName}</p>
                      <p className="text-[10px] text-white/70">{player.position} - {player.club}</p>
                    </div>
                  </div>
                </td>
                {/* Stat cells */}
                {STAT_COLS.map((col) => {
                  const valNum  = player[col.key as keyof ComparisonPlayer] as number
                  const othNum  = other[col.key as keyof ComparisonPlayer] as number
                  const wins    = col.higherIsBetter ? valNum > othNum : valNum < othNum
                  const display = formatStat(player, col.key as string)
                  return (
                    <td key={col.label} className="text-center px-3 py-3">
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

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
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
        subtitle={`${playerA.position} - GW${gw} comparison - ${playerA.club} vs ${playerB.club}`}
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
        <div className="relative z-10 text-center mb-10 max-w-3xl">
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

        {/* Fixture run - two-column panel with divider */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-4">Fixture run - next 4 gameweeks</p>
          <FixtureComparison
            playerA={playerA} fixtureRunA={fixtureRunA}
            playerB={playerB} fixtureRunB={fixtureRunB}
          />
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
              Still not sure who to pick between {playerA.webName} and {playerB.webName}?
            </h3>
            <p className="text-sm text-white/70 mb-7">
              ChatFPL AI analyses your actual squad and budget to recommend the best transfer for your specific team.
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
