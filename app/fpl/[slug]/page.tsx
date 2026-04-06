import { notFound } from "next/navigation"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import Link from "next/link"
import {
  getPlayerPageData,
  buildPageText,
  buildSlugLookup,
  toSlug,
} from "@/lib/fpl-player-page"

// ISR — revalidate all player pages every hour
export const revalidate = 3600

// Allow on-demand generation for slugs not in static params
// (e.g. a player who just crossed the threshold mid-season)
export const dynamicParams = true

// ─── Static params — pre-render all eligible players at build time ─────────────

export async function generateStaticParams() {
  try {
    const bootstrap = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { headers: { "User-Agent": "ChatFPL/1.0" }, next: { revalidate: 86400 } }
    ).then((r) => r.json())

    // Only pre-render players with meaningful season data
    const eligible = (bootstrap.elements ?? []).filter(
      (p: any) =>
        p.minutes >= 1000 &&
        parseFloat(p.selected_by_percent ?? "0") >= 1.0
    )

    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])
    return Array.from(slugMap.keys()).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ─── Dynamic metadata per player ──────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getPlayerPageData(slug)
  if (!data) return { title: "FPL Player Captain Analysis | ChatFPL AI" }

  const { player: p, gw } = data
  return {
    title: `Should I captain ${p.displayName} in Fantasy Premier League? | ChatFPL AI`,
    description: `Live form, expected points, and fixture analysis for ${p.displayName} in FPL Gameweek ${gw}. Get the full captain verdict, transfer advice, and fixture breakdown.`,
    openGraph: {
      title: `Should I captain ${p.displayName}? - FPL Gameweek ${gw} | ChatFPL AI`,
      description: `Is ${p.displayName} worth the armband in Gameweek ${gw}? Live FPL data, form, fixture difficulty, and full captaincy analysis.`,
      url: `https://www.chatfpl.ai/fpl/${slug}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FplPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getPlayerPageData(slug)
  if (!data) notFound()

  const { gw, player, showcasePlayers, relatedPlayers } = data
  const {
    verdict, verdictLabel, verdictColor, verdictBullets,
    caseFor, caseAgainst, caseHeading,
    ctaLeadin, qaItems, welcome,
  } = buildPageText(data)

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      {/* FAQPage JSON-LD schema */}
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
        h1White={`Should I captain ${player.displayName} in `}
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

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
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

        {/* For / Against */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <h2 className="text-lg font-bold text-white mb-5">{caseHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <span className="text-white">{player.webName} Analysis </span>
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
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
            <Link
              href={`/fpl/${slug}/differential`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Is {player.webName} a differential?
            </Link>
            {relatedPlayers.map((rp) => (
              <Link
                key={rp.slug}
                href={`/fpl/${rp.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
              >
                Should I captain {rp.name}?
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
