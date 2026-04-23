import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { isSeasonOver, getBestValueHubLink } from "@/lib/fpl-player-page"
import {
  getDGWPlayerData,
  getDGWPlayerSlugs,
} from "@/lib/fpl-gameweeks"

export const revalidate = 43200
export const dynamicParams = true

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

export async function generateStaticParams() {
  return getDGWPlayerSlugs()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getDGWPlayerData(slug)
  if (!data) return { title: "FPL Double Gameweek Analysis | ChatFPL AI" }

  const { player: p, gw } = data
  return {
    title: `Should I play ${p.displayName} in Double Gameweek ${gw}? | ChatFPL AI`,
    description: `${p.displayName} has a Double Gameweek ${gw} with fixtures against ${p.dgwFixtures.map((f) => `${f.opponentName} (${f.isHome ? "H" : "A"})`).join(" and ")}. Projected ${p.projectedPts.toFixed(1)} combined expected points. Full analysis inside.`,
    openGraph: {
      title: `${p.displayName} Double Gameweek ${gw} - Should You Play Him? | ChatFPL AI`,
      description: `${p.displayName} doubles in GW${gw}. Projected ${p.projectedPts.toFixed(1)} combined points. Form: ${p.form}. Ownership: ${p.ownership}%.`,
      url: `https://www.chatfpl.ai/fpl/double-gameweek/${slug}`,
    },
  }
}

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="block rounded-full" style={{
          width: 8, height: 8,
          background: i <= fdr ? GREEN : "rgba(255,255,255,0.10)",
        }} />
      ))}
    </span>
  )
}

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

export default async function DGWPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (await isSeasonOver()) return <SeasonEnded />

  const data = await getDGWPlayerData(slug)
  if (!data) notFound()

  const {
    gw, player, showcasePlayers, relatedPlayers,
    verdictLabel, verdictText, verdictBullets,
    caseFor, caseAgainst, qaItems, welcome, ctaLeadin,
  } = data

  const bestValueLink  = getBestValueHubLink(player.position, player.price)
  const isAvail        = player.chance >= 75 && player.status === "a"

  const verdictBorderColor = isAvail ? GREEN : "rgba(255,255,255,0.4)"

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
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

      <FplPlayerHero
        h1White={`Should I play ${player.displayName} in `}
        h1Gradient={`Fantasy Premier League Double Gameweek ${gw}?`}
        subtitle={`Gameweek ${gw} Double - ${player.club} - ${player.position} - ${player.price}`}
        players={showcasePlayers}
        badgeLabel="Double Gameweek Analysis"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }} />

        <div className="relative z-10 w-full max-w-4xl flex flex-col gap-10">

          {/* Availability banner */}
          {(!isAvail || player.news) && (
            <Reveal>
              <div className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.25)", borderLeft: "4px solid #00FF87" }}>
                <span className="shrink-0 inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black whitespace-nowrap" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
                  {player.chance === 0 ? "Ruled Out" : player.chance < 50 ? "Injury Doubt" : "Fitness Concern"}
                </span>
                <p className="text-sm text-white leading-relaxed">
                  {player.news || `${player.displayName} has a ${player.chance}% chance of playing. Monitor before the deadline.`}
                </p>
              </div>
            </Reveal>
          )}

          {/* Stat strip */}
          <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: `Projected pts, GW${gw}`,  value: `${player.projectedPts.toFixed(1)} (x2)` },
              { label: "Single game xPts",         value: player.ep_next.toFixed(1) },
              { label: "Form (last 6 GWs)",        value: player.form },
              { label: "Ownership",                value: `${player.ownership}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center">
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-1">{s.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text leading-tight"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          </Reveal>

          {/* Verdict */}
          <Reveal>
          <div className="rounded-2xl px-6 py-6" style={{ border: `1px solid ${verdictBorderColor}30`, background: "rgba(0,255,135,0.05)", borderLeft: `4px solid ${verdictBorderColor}` }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {isAvail ? (
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
          </Reveal>

          {/* Fixture table */}
          <Reveal>
            <h2 className="text-2xl font-bold leading-tight tracking-tight mb-5">
              <span className="text-white">{player.webName} Double Gameweek </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                Fixtures
              </span>
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.02)" }}>
              <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.5 }} />
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                    {["Gameweek", "Opponent", "H/A", "Difficulty", "Rating"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-semibold text-white" style={{ borderBottom: "1px solid rgba(0,255,135,0.15)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {player.dgwFixtures.map((fix, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: idx < player.dgwFixtures.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td className="px-4 py-3">
                        <span className="font-bold tabular-nums text-xs text-white">GW{fix.gw}</span>
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
                        <span className="text-white font-semibold text-xs">{fix.isHome ? "Home" : "Away"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <FdrDots fdr={fix.fdr} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white text-xs font-semibold">{FDR_LABELS[fix.fdr] ?? "Medium"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Case for / against */}
          <Reveal>
            <h2 className="text-lg font-bold text-white mb-5">
              Should you start {player.displayName} in Double Gameweek {gw}?
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
          </Reveal>

          {/* Chat heading */}
          <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
              <span className="text-white">{player.webName} Double Gameweek </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                Analysis
              </span>
            </h2>
            <p className="text-white/70 text-sm">Click a question below and get the full breakdown.</p>
          </div>

          </Reveal>

          {/* Chat */}
          <Reveal>
          <div className="w-full flex flex-col" style={{ height: "clamp(520px, 72vh, 780px)" }}>
            <ConversationalPlayer welcome={welcome} qaItems={qaItems} />
          </div>
          </Reveal>

          {/* CTA */}
          <Reveal>
          <div className="rounded-2xl px-8 py-10 text-center" style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}>
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
          </Reveal>

          {/* Hub nav */}
          <Reveal>
          <div className="flex flex-wrap justify-center gap-3">
            <GlowPill href="/fpl/gameweeks">Gameweek Planner</GlowPill>
            <GlowPill href={`/fpl/${slug}`}>Captain Analysis</GlowPill>
            <GlowPill href={`/fpl/${slug}/transfer`}>Transfer Analysis</GlowPill>
            <GlowPill href="/fpl/fixtures">Fixture Difficulty</GlowPill>
            {bestValueLink && <GlowPill href={bestValueLink.href}>{bestValueLink.label}</GlowPill>}
          </div>
          </Reveal>

          {/* Also analyse */}
          {relatedPlayers.length > 0 && (
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Also analyse</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={`/fpl/${slug}/differential`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
                  Is {player.webName} a differential?
                </Link>
                <Link href={`/fpl/${slug}/sell`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
                  Should I sell {player.webName}?
                </Link>
                {relatedPlayers.map((rp) => (
                  <Link key={rp.slug} href={`/fpl/double-gameweek/${rp.slug}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
                    {rp.name} double gameweek
                  </Link>
                ))}
              </div>
            </Reveal>
          )}

        </div>
      </main>
    </div>
  )
}
