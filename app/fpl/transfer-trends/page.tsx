import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"
import { HubHero } from "@/components/hub-hero"
import {
  getTransferTrendsHub,
  buildTransferHubText,
  fmtTransfers,
  fdrLabel,
  type TransferTrendPair,
} from "@/lib/fpl-transfer-trends"

export const revalidate = 3600
export const dynamic = "force-dynamic"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Transfer Trends | ChatFPL AI" }
  const data = await getTransferTrendsHub()
  const gw = data?.gw ?? "?"
  return {
    title: `FPL Transfer Trends Gameweek ${gw} - Who to Sell and Buy | ChatFPL AI`,
    description: `Live FPL transfer market analysis for Gameweek ${gw}. The most active sell-and-buy moves this week, ranked by combined transfer volume with ownership and fixture context.`,
    openGraph: {
      title: `FPL Transfer Trends Gameweek ${gw} | ChatFPL AI`,
      description: `The biggest FPL transfer moves in GW${gw} - ranked by market activity, with ownership risk and fixture analysis.`,
      url: "https://www.chatfpl.ai/fpl/transfer-trends",
    },
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN   = "#00FF87"
const CYAN    = "#00FFFF"
const MUTED   = "#8b949e"
const SURFACE = "rgba(13,17,23,0.82)"
const BORDER  = "rgba(255,255,255,0.07)"

// ─── Transfer direction badge ─────────────────────────────────────────────────

function TransferArrow() {
  return (
    <div className="flex items-center justify-center gap-1 py-1.5">
      <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>SELLING</span>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1 5h14M11 1l4 4-4 4" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>BUYING</span>
    </div>
  )
}

// ─── Transfer card — mirrors CompareCard structure exactly ────────────────────

function TransferCard({ pair, rank, gw, text }: {
  pair: TransferTrendPair; rank: number; gw: number | string; text: string
}) {
  const { playerOut: pOut, playerIn: pIn } = pair
  const priceOut = pOut.priceRaw
  const priceIn  = pIn.priceRaw
  const soldFmt  = fmtTransfers(pOut.transfersOut)
  const boughtFmt = fmtTransfers(pIn.transfersIn)

  return (
    <div
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

        {/* Left photo — OUT player */}
        <div className="relative shrink-0 flex flex-col items-center justify-center w-16 sm:w-52"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5"
            style={{ background: "rgba(0,255,135,0.12)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >OUT</div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pOut.code}.png`}
              alt={pOut.displayName} width={160} height={204} className="w-12 sm:w-[160px]"
              style={{ objectFit: "contain" }} unoptimized
            />
            <div className="w-12 sm:w-[160px]" style={{ height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
          </div>
        </div>

        {/* Centre — stats */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Name row */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-r" style={{ borderColor: BORDER }}>
              <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${pOut.teamCode}.png`}
                alt={pOut.club} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pOut.displayName}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 px-3 py-2.5">
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pIn.displayName}</span>
              <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${pIn.teamCode}.png`}
                alt={pIn.club} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
            </div>
          </div>
          {/* Transfer direction arrow */}
          <div className="border-b" style={{ borderColor: BORDER }}>
            <TransferArrow />
          </div>
          {/* Stats — single grid so auto center column sizes once to widest label */}
          {(() => {
            const bSold = `1px solid ${BORDER}`
            const bInner = "1px solid rgba(255,255,255,0.05)"
            const cell = (wins: boolean, last = false) => ({
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
            const outEp = pOut.ep_next; const inEp = pIn.ep_next
            const epOutWins = outEp > inEp && outEp > 0
            const epInWins  = inEp > outEp && inEp > 0
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr" }}>
                {/* SOLD / BOUGHT */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(false), borderRight: bInner }}>{soldFmt}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl()}>SOLD / BOUGHT</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(pIn.transfersIn > pOut.transfersOut), borderLeft: bInner }}>{boughtFmt}</div>
                {/* OWNED % */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(false), borderRight: bInner }}>{pOut.ownership}%</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl()}>OWNED %</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(false), borderLeft: bInner }}>{pIn.ownership}%</div>
                {/* PRICE */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(priceOut < priceIn), borderRight: bInner }}>{pOut.price}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl()}>PRICE</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(priceIn < priceOut), borderLeft: bInner }}>{pIn.price}</div>
                {/* xPTS */}
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(epOutWins, true), borderRight: bInner }}>{outEp === 0 ? "--" : outEp.toFixed(1)}</div>
                <div className="flex items-center justify-center px-3 py-2" style={lbl(true)}>xPTS</div>
                <div className="flex items-center justify-center px-3 py-2" style={{ ...cell(epInWins, true), borderLeft: bInner }}>{inEp === 0 ? "--" : inEp.toFixed(1)}</div>
              </div>
            )
          })()}
          {/* Link */}
          <div className="flex items-center justify-center px-4 py-5 border-t" style={{ borderColor: BORDER }}>
            <div className="rounded-full p-px transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)]"
              style={{ background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }}
            >
              <Link href={`/fpl/transfer-trends/${pOut.slug}/${pIn.slug}`}
                className="block whitespace-nowrap font-bold rounded-full"
                style={{ background: "#0d1117", padding: "5px 20px", fontSize: "clamp(9px, 1.1vw, 12px)" }}
              >
                <span style={{ backgroundImage: `linear-gradient(to right, ${GREEN}, ${CYAN})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {`Transfer analysis: ${pOut.webName} out, ${pIn.webName} in`}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right photo — IN player */}
        <div className="relative shrink-0 flex flex-col items-center justify-center w-16 sm:w-52"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5"
            style={{ background: "rgba(0,255,135,0.12)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >IN</div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pIn.code}.png`}
              alt={pIn.displayName} width={160} height={204} className="w-12 sm:w-[160px]"
              style={{ objectFit: "contain" }} unoptimized
            />
            <div className="w-12 sm:w-[160px]" style={{ height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
          </div>
        </div>

      </div>

      {/* Expand — full width */}
      <div className="border-t px-4 py-3" style={{ borderColor: BORDER }}>
        <HubCardExpand
          slug={`${pOut.slug}-to-${pIn.slug}`}
          gw={gw}
          text={text}
          promptLabel={`Should I sell ${pOut.webName} for ${pIn.webName} in GW${gw}?`}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TransferTrendsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const randomBase = Math.floor(Math.random() * 3)
  const data = await getTransferTrendsHub()
  if (!data) notFound()

  const { gw, pairs } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Transfer Market Trends "
        headingGradient={`Gameweek ${gw}`}
        subtitle="The most active sell-and-buy moves this week, ranked by combined transfer volume. Click any pair for the full transfer analysis and AI verdict."
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">

          {pairs.map((pair, i) => (
            <Reveal key={`${pair.slugOut}-${pair.slugIn}`} delay={i * 0.06}>
              <TransferCard
                pair={pair}
                rank={i + 1}
                gw={gw}
                text={buildTransferHubText(pair, i + 1, randomBase)}
              />
            </Reveal>
          ))}

          <p className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
            Same-position transfer pairings ranked by combined sales and purchases in Gameweek {gw}. Excludes players ruled out. Updated hourly.
          </p>

          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">Not sure which way to go?</h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI factors in your actual squad, transfer budget, and mini-league rivals to give you a personalised verdict on every transfer. Try it free - no credit card required.
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
      </main>
    </div>
  )
}
