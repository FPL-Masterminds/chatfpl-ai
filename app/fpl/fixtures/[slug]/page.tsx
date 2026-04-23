import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import { isSeasonOver, getBestValueHubLink } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import {
  getFixturePageData,
  getFixtureSlugs,
  buildFixturePageText,
  FDR_LABELS,
  type FixtureHubPlayer,
} from "@/lib/fpl-fixtures"

export const revalidate = 43200
export const dynamicParams = true

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getFixtureSlugs()
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getFixturePageData(slug)
  if (!data) return { title: "FPL Fixture Difficulty | ChatFPL AI" }

  const { player: p, gw } = data
  return {
    title: `Is ${p.displayName} worth owning for FPL Gameweek ${gw}? Fixture Difficulty | ChatFPL AI`,
    description: `${p.displayName}'s upcoming fixture run for Gameweek ${gw} and beyond. Five-game schedule, difficulty ratings, form analysis, and AI projections for Fantasy Premier League.`,
    openGraph: {
      title: `${p.displayName} FPL Fixture Difficulty - Gameweek ${gw} | ChatFPL AI`,
      description: `${p.displayName} fixture run rated ${p.verdictLabel.toLowerCase()} for GW${gw}. Live FPL data, form, and full schedule analysis.`,
      url: `https://www.chatfpl.ai/fpl/fixtures/${slug}`,
    },
  }
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const GREEN = "#00FF87"

// ─── FDR dots ─────────────────────────────────────────────────────────────────

function FdrBar({ fdr }: { fdr: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: i <= fdr ? GREEN : "rgba(255,255,255,0.10)",
          }}
        />
      ))}
    </div>
  )
}

// ─── Glowing gradient pill button — matches captain page style ────────────────

function GlowPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
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
        href={href}
        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        style={{ background: "rgba(0,0,0,0.9)" }}
      >
        <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {children}
        </span>
      </Link>
    </div>
  )
}

// ─── Fixture table — all text white ───────────────────────────────────────────

function FixtureTable({ player, gw }: { player: FixtureHubPlayer; gw: number }) {
  if (player.fixtures.length === 0) {
    return (
      <p className="text-sm text-white/50 text-center py-6">
        No upcoming fixtures found for this player.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(0,255,135,0.15)" }}>
      <table className="w-full text-sm border-collapse min-w-[380px]">
        <thead>
          <tr style={{ background: "rgba(0,255,135,0.08)" }}>
            {["GW", "Opponent", "H/A", "Difficulty", "Rating"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-semibold text-white"
                style={{ borderBottom: "1px solid rgba(0,255,135,0.15)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {player.fixtures.map((fix, idx) => {
            const isCurrent = fix.gw === gw
            return (
              <tr
                key={fix.gw}
                style={{
                  background: isCurrent ? "rgba(0,255,135,0.06)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  borderBottom: idx < player.fixtures.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <span className="font-bold tabular-nums text-xs text-white">
                    GW{fix.gw}
                    {isCurrent && (
                      <span
                        className="ml-1.5 text-[9px] font-black uppercase rounded-full px-1.5 py-0.5"
                        style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a" }}
                      >
                        Next
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {fix.opponentCode > 0 && (
                      <Image
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${fix.opponentCode}.png`}
                        alt={fix.opponentName}
                        width={16} height={16}
                        style={{ objectFit: "contain" }}
                        unoptimized
                      />
                    )}
                    <span className="text-white font-medium">{fix.opponentName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white font-semibold text-xs">
                    {fix.isHome ? "Home" : "Away"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FdrBar fdr={fix.fdr} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-white text-xs font-semibold">
                    {FDR_LABELS[fix.fdr] ?? "Medium"}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FixturePlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (await isSeasonOver()) return <SeasonEnded />

  const data = await getFixturePageData(slug)
  if (!data) notFound()

  const { gw, player, showcasePlayers, similarPlayers } = data
  const bestValueLink = getBestValueHubLink(player.position, player.price)
  const blankGW = player.ep_next === 0
  const isInjured = player.chance === 0 || player.status === "i"

  const {
    verdictLabel, verdictText, verdictBullets,
    caseFor, caseAgainst, qaItems, welcome, ctaLeadin,
  } = buildFixturePageText(player, gw)

  const verdictBorderColor =
    verdictLabel === "Favourable" ? GREEN :
    verdictLabel === "Mixed"      ? "rgba(255,255,255,0.4)" :
    "rgba(255,255,255,0.2)"

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
        @keyframes glow_scroll { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>

      {/* FAQPage JSON-LD */}
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

      {/* Hero — identical to captain page with flanking players */}
      <FplPlayerHero
        h1White={`Is ${player.displayName} worth owning for `}
        h1Gradient={`Fantasy Premier League Gameweek ${gw}?`}
        subtitle={`Gameweek ${gw} · ${player.club} · ${player.position} · ${player.price}`}
        players={showcasePlayers}
      />

      {/* Analysis */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Availability banner */}
        {(player.news || player.chance < 100 || player.status !== "a" || blankGW) && (
          <div className="relative z-10 w-full max-w-4xl mx-auto mb-6">
            <div
              className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.25)", borderLeft: "4px solid #00FF87" }}
            >
              <span
                className="shrink-0 inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black whitespace-nowrap"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
              >
                {blankGW ? "Blank Gameweek"
                  : player.status === "i" || player.chance === 0 ? "Injured"
                  : player.status === "u" ? "Unavailable"
                  : player.status === "s" ? "Suspended"
                  : player.chance < 50 ? "Injury Doubt"
                  : "Fitness Concern"}
              </span>
              <p className="text-sm text-white leading-relaxed">
                {blankGW
                  ? `${player.displayName} has a Blank Gameweek ${gw} - no fixture is scheduled for their club this week. The fixture run picks up after this blank.`
                  : player.news
                  ? player.news
                  : `${player.displayName} has a ${player.chance}% chance of playing - monitor before the deadline.`}
              </p>
            </div>
          </div>
        )}

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: `Expected pts, GW${gw}`, value: blankGW ? "0.0 (Blank GW)" : String(player.ep_next.toFixed(1)) },
              { label: "Form (last 6 GWs)",     value: player.form },
              { label: "Fixture Run",            value: player.verdictLabel },
              { label: "Ownership",              value: `${player.ownership}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center">
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-1">{s.label}</p>
                <p
                  className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text leading-tight"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Verdict block */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div
            className="rounded-2xl px-6 py-6"
            style={{ border: `1px solid ${verdictBorderColor}30`, background: "rgba(0,255,135,0.05)", borderLeft: `4px solid ${verdictBorderColor}` }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {verdictLabel === "Favourable" ? (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
                  {verdictLabel}
                </span>
              ) : (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                  {verdictLabel}
                </span>
              )}
              <p className="text-white font-semibold text-base leading-snug">{verdictText}</p>
            </div>
            <ul className="space-y-2">
              {verdictBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GREEN }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fixture table */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl font-bold leading-tight tracking-tight mb-5">
            <span className="text-white">{player.webName} Fixture Run </span>
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
              Next {player.fixtures.length} Gameweeks
            </span>
          </h2>
          <FixtureTable player={player} gw={gw} />
        </div>

        {/* Case for / against — distinct heading, no duplication */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-lg font-bold text-white mb-5">
            Should you hold {player.displayName} through these fixtures?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: GREEN }}>The case for</p>
              <ul className="space-y-2.5">
                {caseFor.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GREEN }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
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
            <span className="text-white">{player.webName} Fixture Analysis </span>
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
              Gameweek {gw}
            </span>
          </h2>
          <p className="text-white/70 text-sm">Click a question below and get the full breakdown.</p>
        </div>

        {/* Chat window */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col" style={{ height: "clamp(520px, 72vh, 780px)" }}>
          <ConversationalPlayer welcome={welcome} qaItems={qaItems} />
        </div>

        {/* CTA */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <div
            className="rounded-2xl px-8 py-10"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{ctaLeadin}</h3>
            <p className="text-sm text-white/70 mb-7">Get 20 free messages. No credit card required.</p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 2.4s linear infinite" }} />
              Try ChatFPL AI for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Hub nav — glowing gradient border pills (captain page style) */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-10 flex flex-wrap justify-center gap-3">
          <GlowPill href="/fpl/fixtures">All Fixture Ratings</GlowPill>
          <GlowPill href={`/fpl/${slug}`}>Captain Analysis</GlowPill>
          <GlowPill href={`/fpl/${slug}/transfer`}>Transfer Analysis</GlowPill>
          {bestValueLink && <GlowPill href={bestValueLink.href}>{bestValueLink.label}</GlowPill>}
          <GlowPill href="/fpl/captains">Captain Picks</GlowPill>
        </div>

        {/* Also analyse — player-specific actions */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/fpl/${slug}/differential`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              Is {player.webName} a differential?
            </Link>
            <Link href={`/fpl/${slug}/sell`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              Should I sell {player.webName}?
            </Link>
            {similarPlayers.map((sp) => (
              <Link
                key={sp.slug}
                href={`/fpl/fixtures/${sp.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
              >
                {sp.displayName ?? sp.name} fixture run ({sp.verdictLabel})
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
