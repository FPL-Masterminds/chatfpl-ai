import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { UpgradeCTAPanel } from "@/components/upgrade-cta-panel"
import { ConversationalPlayer } from "@/components/conversational-player"
import { DefconPlayerCard } from "@/components/defcon-player-card"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { getDefconPlayerPage, getDefconPlayerSlugs, DEFCON_POSITION_META } from "@/lib/fpl-defcon"

export const revalidate = 43200
export const dynamicParams = true

const GREEN = "#00FF87"

export async function generateStaticParams() {
  return await getDefconPlayerSlugs()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getDefconPlayerPage(slug)
  if (!data) return { title: "FPL DEFCON Analysis | ChatFPL AI" }
  const { player, gw } = data
  const title = `${player.displayName} DEFCON Analysis: Is he a reliable Fantasy Premier League pick for Gameweek ${gw}? | ChatFPL AI`
  const description = `${player.displayName} has ${player.dc} DEFCON returns from ${player.minutes.toLocaleString("en-GB")} minutes at ${player.dc90.toFixed(2)} per 90 this season. Full DEFCON breakdown, fixture context and Gameweek ${gw} recommendation.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/defcon/${slug}`,
    },
  }
}

export default async function DefconPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />
  const { slug } = await params
  const data = await getDefconPlayerPage(slug)
  if (!data) notFound()

  const { player, gw, positionRank, positionTotal, positionSlug, peers, qaItems, verdict, early } = data
  const posMeta = DEFCON_POSITION_META[positionSlug]

  const chatQA = qaItems.map((q, i) => ({
    id: `dc-q${i}`,
    question: q.question,
    answer: q.answer,
  }))

  const welcome = `I've pulled the DEFCON data for ${player.displayName} - ${player.dc} returns from ${player.minutes.toLocaleString("en-GB")} minutes at ${player.dc90.toFixed(2)} per 90 this season. Click any question below for the full breakdown.`

  const ctaHeading = (() => {
    if (verdict.label === "DEFCON Elite") return `${player.displayName} is one of the strongest DEFCON profiles in the league - does he fit your specific squad?`
    if (verdict.label === "DEFCON Reliable") return `${player.displayName} offers a solid DEFCON floor - would he actually fit your squad in Gameweek ${gw}?`
    if (verdict.label === "DEFCON Occasional") return `${player.displayName}'s DEFCON return is moderate - is he still the right pick for your squad this week?`
    return `${player.displayName}'s DEFCON case is thin - is there a better DEFCON option for your squad in Gameweek ${gw}?`
  })()

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black overflow-x-hidden">
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
            mainEntity: qaItems.map(q => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer },
            })),
          }),
        }}
      />

      <DevHeader />

      {/* Hero - reuse HubHero for identical styling, override CTA */}
      <HubHero
        headingWhite={`${player.displayName} DEFCON Analysis: `}
        headingGradient={`Fantasy Premier League Gameweek ${gw}`}
        subtitle={`${player.position} · ${player.club} · ${player.dc90.toFixed(2)} DEFCON per 90 · ranked ${positionRank} of ${positionTotal} eligible ${posMeta.label.toLowerCase()}.`}
        ctaHref="/chat"
        ctaLabel="Ask ChatFPL AI"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Player card - central, single */}
        <div className="relative z-10 w-full max-w-3xl mx-auto mb-10">
          <Reveal>
            <div
              className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5"
              style={{
                border: "1px solid rgba(0,255,135,0.25)",
                background: "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.14) 0%, rgba(0,255,135,0.04) 50%, transparent 100%)",
              }}
            >
              <div style={{ height: 2, position: "absolute", top: 0, left: 12, right: 12, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6, borderRadius: 12 }} />
              <div className="w-40 shrink-0">
                <HubPlayerPhoto code={player.code} name={player.displayName} />
                <div className="w-full mt-1" style={{
                  height: 1,
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                  boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-white text-xl font-bold">{player.displayName}</h2>
                  <Image
                    src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                    alt={player.club}
                    width={26} height={26}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </div>
                <p className="text-white/70 text-sm mb-4">{player.position} · {player.club} · {player.price}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "DC/90",  value: player.dc90.toFixed(2) },
                    { label: "DC",     value: String(player.dc) },
                    { label: "CBIT",   value: String(player.cbit) },
                    { label: "Mins",   value: player.minutes.toLocaleString("en-GB") },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 6, padding: "10px 12px" }}>
                      <p className="font-bold tabular-nums text-lg" style={{ color: GREEN }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5 text-white/80">{s.label}</p>
                    </div>
                  ))}
                </div>
                {player.smallSample && (
                  <p className="mt-3 text-[11px] text-white/70 italic">
                    Sample size is still small this season - treat the rate as a signal rather than a settled read.
                  </p>
                )}
                {early && !player.smallSample && (
                  <p className="mt-3 text-[11px] text-white/70 italic">
                    The season is early - the underlying rate will settle further from Gameweek 7 or 8 onwards.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Verdict block */}
        <div className="relative z-10 w-full max-w-3xl mx-auto mb-10">
          <Reveal>
            <div
              className="rounded-2xl px-6 py-6"
              style={{
                border: "1px solid rgba(0,255,135,0.3)",
                background: "rgba(0,255,135,0.03)",
                borderLeft: "4px solid #00FF87",
              }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                  style={{ background: GREEN }}
                >
                  {verdict.label}
                </span>
                <p className="text-white font-semibold text-base leading-snug">{verdict.text}</p>
              </div>
              <ul className="space-y-2">
                {verdict.bullets.map((b) => (
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
        </div>

        {/* Chat heading */}
        <div className="relative z-10 text-center mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
            <span className="text-white">{player.webName}&apos;s DEFCON case for </span>
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
          <ConversationalPlayer welcome={welcome} qaItems={chatQA} />
        </div>

        {/* CTA */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <UpgradeCTAPanel
            heading={ctaHeading}
            subline="ChatFPL AI factors in your specific squad, chip strategy and remaining budget."
            chatQuery={`Should I sign ${player.displayName} for Gameweek ${gw} based on their DEFCON output?`}
          />
        </div>

        {/* Peers section */}
        {peers.length > 0 && (
          <div className="relative z-10 w-full max-w-3xl mx-auto mt-16">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-4 text-center">
                Similar DEFCON profiles at this position
              </p>
              <div className="flex flex-col gap-3">
                {peers.map((peer, i) => (
                  <Reveal key={peer.slug} delay={i * 0.04}>
                    <DefconPlayerCard player={peer} even={i % 2 === 0} cbitThreshold={posMeta.cbitThreshold} />
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* Also analyse */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/fpl/${player.slug}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I captain {player.webName}?
            </Link>
            <Link
              href={`/fpl/${player.slug}/transfer`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Should I transfer in {player.webName}?
            </Link>
            <Link
              href={`/fpl/${player.slug}/differential`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              Is {player.webName} a differential?
            </Link>
            <Link
              href={`/fpl/defcon/${positionSlug}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
            >
              All DEFCON {posMeta.label.toLowerCase()}
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
              href="/fpl/defcon"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Back to the DEFCON Hub →
              </span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
