import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { UpgradeCTAPanel } from "@/components/upgrade-cta-panel"
import { ConversationalPlayer } from "@/components/conversational-player"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import { DefconComingSoon } from "@/components/defcon-coming-soon"
import { isSeasonOver } from "@/lib/fpl-player-page"
import {
  getDefconCompare,
  getDefconComparePairs,
  getDefconHub,
  DEFCON_POSITION_META,
  extractPriceRaw,
  type DefconPlayer,
} from "@/lib/fpl-defcon"

export const revalidate = 43200
export const dynamicParams = true

const GREEN = "#00FF87"

export async function generateStaticParams() {
  return await getDefconComparePairs()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerA: string; playerB: string }>
}): Promise<Metadata> {
  const { playerA, playerB } = await params
  const data = await getDefconCompare(playerA, playerB)
  if (!data) return { title: "FPL DEFCON Comparison | ChatFPL AI" }
  const { playerA: a, playerB: b, gw } = data
  const title = `${a.displayName} vs ${b.displayName} DEFCON: Who has the better Fantasy Premier League defensive contribution rate for Gameweek ${gw}? | ChatFPL AI`
  const description = `${a.displayName} vs ${b.displayName} - Gameweek ${gw} Fantasy Premier League DEFCON comparison. Per-90 rate, raw counts, fixture context and a full verdict on who to pick.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/defcon/compare/${playerA}/${playerB}`,
    },
  }
}

// Compact player summary card in the hero region
function PlayerSummaryCard({ player, cbitThreshold }: { player: DefconPlayer; cbitThreshold: number }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center gap-2"
      style={{
        border: "1px solid rgba(0,255,135,0.25)",
        background: "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.14) 0%, rgba(0,255,135,0.04) 50%, transparent 100%)",
        minWidth: 180,
      }}
    >
      <div style={{ height: 2, alignSelf: "stretch", background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6, borderRadius: 2 }} />
      <div className="w-24">
        <HubPlayerPhoto code={player.code} name={player.displayName} />
      </div>
      <div className="w-24" style={{
        height: 1,
        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
        boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
      }} />
      <div className="flex items-center gap-2">
        <p className="font-bold text-white text-sm">{player.webName}</p>
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
          alt={player.club}
          width={18} height={18}
          style={{ objectFit: "contain" }}
          unoptimized
        />
      </div>
      <p className="text-[11px] text-white/70">{player.position} · {player.price}</p>
      <div className="flex items-center gap-3 mt-1">
        <div className="text-center">
          <p className="font-bold tabular-nums text-base" style={{ color: GREEN }}>{player.dc90.toFixed(2)}</p>
          <p className="text-[9px] text-white/70">DC/90</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="font-bold tabular-nums text-base" style={{ color: GREEN }}>{player.dc}</p>
          <p className="text-[9px] text-white/70">DC</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="font-bold tabular-nums text-base" style={{ color: GREEN }}>{player.cbit}</p>
          <p className="text-[9px] text-white/70">CBIT</p>
        </div>
      </div>
      <p className="text-[10px] text-white/50 mt-1">Bonus at {cbitThreshold}+ CBIT</p>
    </div>
  )
}

// Horizontal stat comparison table
const STAT_COLS: { label: string; key: keyof DefconPlayer; higherIsBetter: boolean; format?: (v: unknown) => string }[] = [
  { label: "DC/90",       key: "dc90",      higherIsBetter: true,  format: (v) => (v as number).toFixed(2) },
  { label: "DC",          key: "dc",        higherIsBetter: true  },
  { label: "CBIT",        key: "cbit",      higherIsBetter: true  },
  { label: "Minutes",     key: "minutes",   higherIsBetter: true,  format: (v) => (v as number).toLocaleString("en-GB") },
  { label: "Season Pts",  key: "totalPts",  higherIsBetter: true  },
  { label: "GW xPts",     key: "ep_next",   higherIsBetter: true,  format: (v) => (v as number).toFixed(1) },
]

function StatTable({ playerA, playerB }: { playerA: DefconPlayer; playerB: DefconPlayer }) {
  const WIN_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  }
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
            <th className="text-center px-2 py-3 text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold whitespace-nowrap">Price</th>
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
                <td className="px-3 py-2 text-center" style={{ position: "sticky", left: 0, zIndex: 2, background: "#020a05" }}>
                  <div className="flex flex-col items-center mx-auto" style={{ width: 52 }}>
                    <Image
                      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                      alt={player.webName}
                      width={52} height={65}
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                    <div style={{
                      height: 1, width: 52,
                      background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                      boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                    }} />
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">{player.webName}</p>
                  <p className="text-[10px] text-white/70 whitespace-nowrap">{player.position} - {player.club}</p>
                </td>
                {STAT_COLS.map((col) => {
                  const rawVal = player[col.key] as number
                  const rawOther = other[col.key] as number
                  const wins = col.higherIsBetter ? rawVal > rawOther : rawVal < rawOther
                  const display = col.format ? col.format(rawVal) : String(rawVal)
                  return (
                    <td key={col.label} className="text-center px-2 py-2">
                      <span className="text-sm font-bold" style={wins ? WIN_STYLE : { color: "rgba(255,255,255,0.85)" }}>
                        {display}
                      </span>
                    </td>
                  )
                })}
                {/* Price cell */}
                <td className="text-center px-2 py-2">
                  <span
                    className="text-sm font-bold"
                    style={extractPriceRaw(player) < extractPriceRaw(other) ? WIN_STYLE : { color: "rgba(255,255,255,0.85)" }}
                  >
                    {player.price}
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

export default async function DefconComparePage({
  params,
}: {
  params: Promise<{ playerA: string; playerB: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />
  const { playerA: slugA, playerB: slugB } = await params
  const data = await getDefconCompare(slugA, slugB)
  if (!data) {
    const hub = await getDefconHub()
    if (hub && !hub.ready) {
      return (
        <DefconComingSoon
          gw={hub.gw}
          maxMinutes={hub.maxMinutes}
          compareOf={{ a: slugA.replace(/-/g, " "), b: slugB.replace(/-/g, " ") }}
        />
      )
    }
    notFound()
  }

  const { playerA, playerB, gw, positionSlug, cbitThreshold, qaItems, verdict, early } = data
  const posMeta = DEFCON_POSITION_META[positionSlug]

  const chatQA = qaItems.map((q, i) => ({
    id: `dcx-${i}`,
    question: q.question,
    answer: q.answer,
  }))

  const welcome = `I've pulled the DEFCON data for ${playerA.displayName} and ${playerB.displayName} in Gameweek ${gw}. Click any question below for the full breakdown.`

  // Dynamic CTA hook
  const priceDiff = Math.abs(extractPriceRaw(playerA) - extractPriceRaw(playerB))
  const rateGap = Math.abs(playerA.dc90 - playerB.dc90)
  const cheaper = extractPriceRaw(playerA) <= extractPriceRaw(playerB) ? playerA : playerB
  const rateWinner = playerA.dc90 > playerB.dc90 ? playerA : playerB

  let ctaHeading: string
  if (rateGap < 0.05) {
    ctaHeading = `${playerA.webName} and ${playerB.webName} have near-identical DEFCON rates - which fits your squad?`
  } else if (priceDiff >= 0.1 && rateWinner.webName === cheaper.webName) {
    ctaHeading = `${rateWinner.webName} has the better DEFCON rate and is £${priceDiff.toFixed(1)}m cheaper - is it a no-brainer for your squad?`
  } else if (priceDiff >= 0.1) {
    ctaHeading = `${rateWinner.webName} has the DEFCON edge but costs £${priceDiff.toFixed(1)}m more than ${cheaper.webName}. Where should the money go?`
  } else {
    ctaHeading = `${rateWinner.webName} has the DEFCON edge at a similar price. Would he fit your specific squad?`
  }

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

      <HubHero
        headingWhite={`${playerA.displayName} vs ${playerB.displayName} DEFCON: `}
        headingGradient={`Fantasy Premier League Gameweek ${gw}`}
        subtitle={`Head-to-head DEFCON comparison for two ${posMeta.label.toLowerCase()}. Per-90 rate, raw workload and Gameweek ${gw} recommendation.`}
        ctaHref="/chat"
        ctaLabel="Ask ChatFPL AI"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {early && (
          <div className="relative z-10 w-full max-w-3xl mx-auto mb-6">
            <div
              className="rounded-2xl px-5 py-4 text-center"
              style={{
                border: "1px solid rgba(0,255,135,0.2)",
                background: "rgba(0,255,135,0.03)",
              }}
            >
              <p className="text-[11px] text-white/80 leading-relaxed">
                Season is early - both DEFCON rates reflect a small sample and will settle from Gameweek 7 or 8 onwards.
              </p>
            </div>
          </div>
        )}

        {/* Side-by-side hero player cards */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Reveal>
            <PlayerSummaryCard player={playerA} cbitThreshold={cbitThreshold} />
          </Reveal>
          <div
            className="text-lg font-black uppercase tracking-widest"
            style={{
              background: "linear-gradient(to right,#00FF87,#00FFFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            vs
          </div>
          <Reveal>
            <PlayerSummaryCard player={playerB} cbitThreshold={cbitThreshold} />
          </Reveal>
        </div>

        {/* Sub-heading */}
        <div className="relative z-10 text-center mb-8 max-w-6xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">
            <span className="text-white">{playerA.displayName} vs {playerB.displayName}: </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              DEFCON Analysis
            </span>
          </h2>
        </div>

        {/* Stat table */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <Reveal>
            <StatTable playerA={playerA} playerB={playerB} />
          </Reveal>
        </div>

        {/* Verdict */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
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

        {/* Chat panel */}
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
            subline="ChatFPL AI factors in your specific squad, chip strategy and remaining budget before recommending."
            chatQuery={`I'm choosing between ${playerA.displayName} and ${playerB.displayName} on DEFCON grounds for Gameweek ${gw}. Which fits my squad better?`}
          />
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

        {/* Also analyse */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/fpl/defcon/${playerA.slug}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              {playerA.webName} DEFCON deep dive
            </Link>
            <Link href={`/fpl/defcon/${playerB.slug}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              {playerB.webName} DEFCON deep dive
            </Link>
            <Link href={`/fpl/compare/${playerA.slug}/${playerB.slug}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              Full head-to-head comparison
            </Link>
            <Link href={`/fpl/defcon/${positionSlug}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]">
              All DEFCON {posMeta.label.toLowerCase()}
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
