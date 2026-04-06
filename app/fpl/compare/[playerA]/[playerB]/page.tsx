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
    description: `${a.displayName} vs ${b.displayName} — Gameweek ${gw} comparison. Form, expected points, fixture difficulty and a full verdict on who to start in your FPL squad.`,
    openGraph: {
      title: `${a.displayName} vs ${b.displayName}: FPL Gameweek ${gw} | ChatFPL AI`,
      description: `Head-to-head FPL analysis: ${a.displayName} vs ${b.displayName} for Gameweek ${gw}. Who has the better fixture, form, and value?`,
      url: `https://www.chatfpl.ai/fpl/compare/${playerA}/${playerB}`,
    },
  }
}

// ─── FDR dots (reused from transfer page) ─────────────────────────────────────

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="rounded-full"
          style={{
            width: 5, height: 5,
            background:
              n <= fdr
                ? fdr <= 2
                  ? "#00FF87"
                  : fdr === 3
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,80,80,0.7)"
                : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
  )
}

// ─── Fixture column ────────────────────────────────────────────────────────────

function FixtureColumn({ fixtureRun, player }: { fixtureRun: FixtureGW[]; player: ComparisonPlayer }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 text-center font-semibold">{player.webName}</p>
      {fixtureRun.map((f) => (
        <div
          key={f.gw}
          className="rounded-2xl px-3 py-3 text-center flex flex-col items-center gap-1"
          style={
            f.matches.length === 0
              ? { border: "1px dashed rgba(255,255,255,0.08)", background: "transparent" }
              : f.matches.length >= 2
              ? { border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.04)" }
              : { border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }
          }
        >
          <div className="flex items-center gap-1">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">{`GW${f.gw}`}</p>
            {f.matches.length >= 2 && (
              <span className="text-[7px] font-black uppercase rounded px-1 py-0.5 text-black" style={{ background: "#00FF87" }}>DGW</span>
            )}
          </div>

          {f.matches.length === 0 ? (
            <div className="flex flex-col items-center gap-1 mt-1">
              <svg className="h-6 w-6" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ stroke: "url(#blankGradComp)" }}>
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
            <div className="flex flex-col gap-1.5 w-full mt-1">
              {f.matches.map((m, idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  {m.opponentCode ? (
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/70/t${m.opponentCode}.png`}
                      alt={m.opponent} width={22} height={22} className="object-contain" unoptimized
                    />
                  ) : <div className="h-5 w-5" />}
                  <p className="text-[10px] font-bold text-white leading-tight">{m.opponent}</p>
                  <p className="text-[9px] text-white/50">{m.isHome ? "H" : "A"}</p>
                  <FdrDots fdr={m.fdr} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {f.matches[0].opponentCode ? (
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/70/t${f.matches[0].opponentCode}.png`}
                  alt={f.matches[0].opponent} width={28} height={28} className="object-contain" unoptimized
                />
              ) : <div className="h-7 w-7" />}
              <p className="text-xs font-bold text-white leading-tight">{f.matches[0].opponent}</p>
              <p className="text-[9px] text-white/50">{f.matches[0].isHome ? "Home" : "Away"}</p>
              <FdrDots fdr={f.matches[0].fdr} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Head-to-head stat row ─────────────────────────────────────────────────────

function StatRow({
  label,
  valA,
  valB,
  higherIsBetter = true,
}: {
  label: string
  valA: string
  valB: string
  higherIsBetter?: boolean
}) {
  const numA = parseFloat(valA.replace(/[^0-9.]/g, ""))
  const numB = parseFloat(valB.replace(/[^0-9.]/g, ""))
  const aWins = higherIsBetter ? numA > numB : numA < numB
  const bWins = higherIsBetter ? numB > numA : numB < numA

  const winStyle = {
    backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  } as React.CSSProperties

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="text-right">
        <span
          className="text-base font-bold"
          style={aWins ? winStyle : { color: "rgba(255,255,255,0.8)" }}
        >
          {valA}
        </span>
        {aWins && <span className="ml-1.5 text-[10px] font-black" style={{ color: "#00FF87" }}>▲</span>}
      </div>
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-[0.15em] text-white/50 whitespace-nowrap">{label}</p>
      </div>
      <div className="text-left">
        {bWins && <span className="mr-1.5 text-[10px] font-black" style={{ color: "#00FF87" }}>▲</span>}
        <span
          className="text-base font-bold"
          style={bWins ? winStyle : { color: "rgba(255,255,255,0.8)" }}
        >
          {valB}
        </span>
      </div>
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

  const welcome = `I've pulled the latest GW${gw} data for ${playerA.displayName} and ${playerB.displayName}. The verdict is below — click any question for more detail.`

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
        subtitle={`${playerA.position} · GW${gw} comparison · ${playerA.club} vs ${playerB.club}`}
        playerA={playerA}
        playerB={playerB}
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

        {/* Head-to-head stat table */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-2">
            {/* Player name headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 border-b border-white/[0.08] mb-1">
              <p className="text-right text-sm font-bold text-white">{playerA.webName}</p>
              <p className="text-center text-[9px] uppercase tracking-[0.15em] text-white/40">Head-to-head</p>
              <p className="text-left text-sm font-bold text-white">{playerB.webName}</p>
            </div>
            <StatRow label="GW xPts" valA={String(playerA.ep_next)} valB={String(playerB.ep_next)} />
            <StatRow label="Form" valA={playerA.form} valB={playerB.form} />
            <StatRow label="Season pts" valA={String(playerA.totalPts)} valB={String(playerB.totalPts)} />
            <StatRow label="Goals" valA={String(playerA.goals)} valB={String(playerB.goals)} />
            <StatRow label="Assists" valA={String(playerA.assists)} valB={String(playerB.assists)} />
            <StatRow label="Pts per £m" valA={String(playerA.ptsPerMillion)} valB={String(playerB.ptsPerMillion)} />
            <StatRow label="Ownership" valA={`${playerA.ownership}%`} valB={`${playerB.ownership}%`} higherIsBetter={false} />
            <StatRow label="Price" valA={playerA.price} valB={playerB.price} higherIsBetter={false} />
          </div>
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

        {/* Fixture runs — side by side */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/50 mb-4">Fixture run — next 4 gameweeks</p>
          <div className="grid grid-cols-2 gap-4">
            <FixtureColumn fixtureRun={fixtureRunA} player={playerA} />
            <FixtureColumn fixtureRun={fixtureRunB} player={playerB} />
          </div>
        </div>

        {/* For/Against — two player columns */}
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

        {/* Also compare */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Also analyse</p>
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
