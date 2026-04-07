import { notFound } from "next/navigation"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import Link from "next/link"
import Image from "next/image"
import {
  getPlayerTransferData,
  buildDifferentialPageText,
  getEligibleSlugs,
  isSeasonOver,
  type FixtureGW,
  type DifferentialAlternative,
} from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

export const revalidate = 3600
export const dynamicParams = true

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getEligibleSlugs()
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getPlayerTransferData(slug)
  if (!data) return { title: "FPL Differential Analysis | ChatFPL AI" }

  const { player: p, gw } = data
  return {
    title: `Is ${p.displayName} a good differential for FPL Gameweek ${gw}? | ChatFPL AI`,
    description: `Should you pick ${p.displayName} as a differential in FPL GW${gw}? We analyse ownership, form, fixture run, and rank impact to tell you whether ${p.webName} qualifies as a genuine differential this week.`,
    openGraph: {
      title: `Is ${p.displayName} a differential pick in FPL GW${gw}? | ChatFPL AI`,
      description: `Data-driven differential analysis for ${p.displayName} in Fantasy Premier League Gameweek ${gw}.`,
      url: `https://www.chatfpl.ai/fpl/${slug}/differential`,
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
          className="block h-1.5 w-1.5 rounded-full"
          style={{ background: i <= fdr ? "#00FF87" : "rgba(255,255,255,0.12)" }}
        />
      ))}
    </span>
  )
}

// ─── Fixture run strip ────────────────────────────────────────────────────────

function FixtureStrip({ fixtureRun }: { fixtureRun: FixtureGW[] }) {
  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-4">Fixture run</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fixtureRun.map((f) => (
          <div
            key={f.gw}
            className="rounded-2xl px-4 py-4 text-center flex flex-col items-center gap-1"
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
                <svg className="h-7 w-7" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ stroke: "url(#blankGradDiff)" }}>
                  <defs>
                    <linearGradient id="blankGradDiff" x1="0" y1="0" x2="1" y2="0">
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
        ))}
      </div>
    </div>
  )
}

// ─── Differential alternatives card ──────────────────────────────────────────

function DifferentialAlts({ alts, currentSlug }: { alts: DifferentialAlternative[]; currentSlug: string }) {
  if (alts.length === 0) return null
  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-4">Genuine differential alternatives this week</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {alts
          .filter((a) => a.slug !== currentSlug)
          .map((alt) => (
            <Link
              key={alt.slug}
              href={`/fpl/${alt.slug}/differential`}
              className="group rounded-2xl px-4 pt-4 pb-5 flex flex-col items-center gap-2 text-center transition-all hover:border-white/20"
              style={{ border: "1px solid rgba(0,255,135,0.15)", background: "rgba(0,255,135,0.03)" }}
            >
              {/* Diff badge */}
              <span
                className="text-[8px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 text-black"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
              >
                {alt.ownership < 5 ? "STRONG DIFF" : alt.ownership < 10 ? "DIFFERENTIAL" : "MILD DIFF"}
              </span>

              {/* Player photo + glowing line */}
              <div className="flex flex-col items-center w-full">
                <div className="relative flex justify-center" style={{ height: 90 }}>
                  <Image
                    src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${alt.code}.png`}
                    alt={alt.name}
                    width={70}
                    height={90}
                    className="object-contain object-bottom"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(0,255,133,0.2))" }}
                    unoptimized
                  />
                </div>
                <div
                  style={{
                    height: 1,
                    width: "80%",
                    background: "linear-gradient(to right, transparent, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.5) 70%, transparent)",
                    boxShadow: "0 0 6px 1px rgba(255,255,255,0.2)",
                  }}
                />
              </div>

              <p className="text-sm font-bold text-white leading-tight mt-1">{alt.name}</p>
              <p className="text-[10px] text-white/70">{alt.club} · {alt.position}</p>

              <div className="flex items-center gap-3 mt-1">
                <div className="text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/70">Own</p>
                  <p
                    className="text-sm font-bold text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                  >
                    {alt.ownership.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/70">xPts</p>
                  <p
                    className="text-sm font-bold text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                  >
                    {alt.ep_next.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/70">Price</p>
                  <p className="text-sm font-bold text-white">{alt.price}</p>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FplDifferentialPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (await isSeasonOver()) return <SeasonEnded />
  const data = await getPlayerTransferData(slug)
  if (!data) notFound()

  const { gw, player, showcasePlayers, relatedPlayers, fixtureRun, transfersInGW, differentialAlternatives } = data
  const {
    verdict, verdictLabel, verdictColor, verdictBullets,
    captaincyPanel,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
    showAlternatives,
  } = buildDifferentialPageText(data)

  const ownershipPct = Math.min(100, player.ownership)
  const isNotDiff = player.ownership >= 20

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

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

      <FplPlayerHero
        h1White={`Is ${player.displayName} a good differential for `}
        h1Gradient={`Fantasy Premier League Gameweek ${gw}?`}
        subtitle={`Gameweek ${gw} · ${player.club} · ${player.position} · ${player.price}`}
        players={showcasePlayers}
        badgeLabel="Differential Analysis"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ownership",              value: `${player.ownership}%` },
              { label: "Form (last 6 GWs)",       value: player.form },
              { label: `Expected pts, GW${gw}`,   value: String(player.ep_next) },
              { label: "Transfers in this GW",    value: transfersInGW > 1000 ? `${Math.round(transfersInGW / 1000)}k` : String(transfersInGW) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center">
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

        {/* Ownership bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">FPL ownership</p>
              <p className="text-xs font-semibold text-white">{player.ownership}% of managers own {player.webName}</p>
            </div>
            {/* Bar: flex segments 5% + 5% + 10% + 80% so boundaries are exactly 5%, 10%, 20% (not %-of-parent bugs) */}
            <div className="relative h-2.5 w-full min-w-0 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="absolute left-0 top-0 z-[1] h-full rounded-l-full transition-[width] duration-300"
                style={{
                  width: `${Math.min(ownershipPct, 100)}%`,
                  background: "linear-gradient(to right,#00FF87,#00FFFF)",
                }}
              />
              {/* Vertical rules at 5%, 10%, 20% — same flex math as label row */}
              <div className="pointer-events-none absolute inset-0 z-[2] flex min-w-0">
                <div className="h-full w-[5%] shrink-0 border-r border-white/40" />
                <div className="h-full w-[5%] shrink-0 border-r border-white/40" />
                <div className="h-full w-[10%] shrink-0 border-r border-white/40" />
                <div className="h-full min-w-0 flex-1" />
              </div>
            </div>
            {/* Scale ends */}
            <div className="mt-1 flex justify-between text-[9px] text-white/50">
              <span>0%</span>
              <span>100%</span>
            </div>
            {/* Mobile: 5% column is ~16px wide — use a readable legend instead */}
            <p className="mt-2 text-[10px] leading-relaxed text-white/60 sm:hidden">
              Scale: <span className="text-white/85">Strong differential</span> ≤5% ownership ·{" "}
              <span className="text-white/85">Differential</span> ≤10% · <span className="text-white/85">Mild</span> ≤20% · above that is template territory.
            </p>
            {/* sm+: tier columns align exactly with bar segments (same 5/5/10/80 flex) */}
            <div className="mt-2 hidden min-w-0 text-[8px] leading-tight text-white/70 sm:flex sm:text-[9px]">
              <div className="w-[5%] shrink-0 text-center">
                <span className="block font-medium text-white/90">Strong diff</span>
                <span className="text-white/45">≤5%</span>
              </div>
              <div className="w-[5%] shrink-0 border-l border-white/[0.12] text-center">
                <span className="block font-medium text-white/90">Diff</span>
                <span className="text-white/45">≤10%</span>
              </div>
              <div className="w-[10%] shrink-0 border-l border-white/[0.12] text-center">
                <span className="block font-medium text-white/90">Mild diff</span>
                <span className="text-white/45">≤20%</span>
              </div>
              <div className="min-w-0 flex-1 border-l border-white/[0.12] pl-2 text-left text-white/50">
                Template territory
              </div>
            </div>
          </div>
        </div>

        <FixtureStrip fixtureRun={fixtureRun} />

        {/* Verdict block */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div
            className="rounded-2xl px-6 py-6"
            style={{
              border: `1px solid ${verdictColor}30`,
              background: `${verdictColor}08`,
              borderLeft: `4px solid ${verdictColor}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                style={{ background: verdictColor }}
              >
                {verdictLabel}
              </span>
              <p className="text-white font-semibold text-base leading-snug">{verdict}</p>
            </div>
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

        {/* Captaincy differential panel */}
        {captaincyPanel && (
          <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
            <div
              className="rounded-2xl px-6 py-5"
              style={{ border: "1px solid rgba(0,255,135,0.15)", background: "rgba(0,255,135,0.03)", borderLeft: "4px solid #00FF87" }}
            >
              <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: "#00FF87" }}>Differential captaincy</p>
              <p className="text-sm text-white/80 leading-relaxed">{captaincyPanel}</p>
            </div>
          </div>
        )}

        {/* Differential alternatives */}
        {showAlternatives && differentialAlternatives.length > 0 && (
          <DifferentialAlts alts={differentialAlternatives} currentSlug={slug} />
        )}

        {/* For / Against */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-lg font-bold text-white mb-5">{caseHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: "#00FF87" }}>
                {isNotDiff ? "Why this matters for your rank" : "The case for picking him"}
              </p>
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
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/70 mb-3">
                {isNotDiff ? "The risks of not owning him" : "The risks of the differential play"}
              </p>
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
            <span className="text-white">{player.webName} Differential Analysis </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Gameweek {gw}
            </span>
          </h2>
          <p className="text-white/70 text-sm">Click a question below for the full breakdown.</p>
        </div>

        {/* Chat window */}
        <div
          className="relative z-10 w-full max-w-4xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalPlayer welcome={welcome} qaItems={qaItems} />
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
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{ctaLeadin}</h3>
            <p className="text-sm text-white/70 mb-7">Get 20 free messages. No credit card required.</p>
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
              href={`/fpl/${slug}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I captain {player.webName}?
            </Link>
            <Link
              href={`/fpl/${slug}/transfer`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I transfer {player.webName} in?
            </Link>
            <Link
              href={`/fpl/${slug}/sell`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I sell {player.webName}?
            </Link>
            {relatedPlayers.map((rp) => (
              <Link
                key={rp.slug}
                href={`/fpl/${rp.slug}/differential`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
              >
                Is {rp.name} a differential?
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
