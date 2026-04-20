import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import {
  getTransferTrendPageData,
  getTransferTrendSlugs,
  buildTransferPageText,
  fmtTransfers,
  fdrLabel,
  type TransferTrendPlayer,
  type TransferTrendPair,
} from "@/lib/fpl-transfer-trends"

export const revalidate = 3600
export const dynamic = "force-dynamic"
export const dynamicParams = true

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getTransferTrendSlugs(400)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ player_out: string; player_in: string }>
}): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Transfer Analysis | ChatFPL AI" }
  const { player_out, player_in } = await params
  const data = await getTransferTrendPageData(player_out, player_in)
  if (!data) return { title: "FPL Transfer Analysis | ChatFPL AI" }
  const { gw, playerOut: pOut, playerIn: pIn } = data
  const title = `Should I sell ${pOut.displayName} for ${pIn.displayName}? FPL Transfer Analysis Gameweek ${gw} | ChatFPL AI`
  const description = `Live transfer analysis for Gameweek ${gw}: ${fmtTransfers(pOut.transfersOut)} managers have sold ${pOut.webName}, ${fmtTransfers(pIn.transfersIn)} have bought ${pIn.webName}. Ownership impact, budget and fixture breakdown inside.`
  return {
    title,
    description,
    openGraph: { title, description, url: `https://www.chatfpl.ai/fpl/transfer-trends/${player_out}/${player_in}` },
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN  = "#00FF87"
const CYAN   = "#00FFFF"
const BORDER = "rgba(0,255,135,0.18)"
const SURFACE = "rgba(4,14,9,0.92)"

// ─── FDR dots — same component as captains hub ───────────────────────────────

function FdrDots({ fdr }: { fdr: number | null }) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className="block rounded-full" style={{
          width: 7, height: 7,
          background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
        }} />
      ))}
    </span>
  )
}

// ─── Player hero photo strip ──────────────────────────────────────────────────

function PlayerHero({ player, side }: { player: TransferTrendPlayer; side: "out" | "in" }) {
  const badgeBg   = side === "out" ? "rgba(255,50,50,0.12)"    : "rgba(0,255,135,0.12)"
  const badgeCol  = side === "out" ? "#ff6b6b"                 : GREEN
  const badgeBdr  = side === "out" ? "rgba(255,100,100,0.25)"  : "rgba(0,255,135,0.3)"
  const badgeText = side === "out" ? "SELLING"                 : "BUYING"

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Badge */}
      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ background: badgeBg, color: badgeCol, border: `1px solid ${badgeBdr}` }}
      >{badgeText}</span>
      {/* Photo */}
      <div className="relative w-24 sm:w-40">
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
          alt={player.displayName} width={160} height={204}
          className="w-full" style={{ objectFit: "contain" }} unoptimized
        />
        <div style={{ height: 1, width: "100%",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
          boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
      </div>
      {/* Name + badge */}
      <div className="flex items-center gap-1.5 justify-center">
        <Image src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
          alt={player.club} width={18} height={18} style={{ objectFit: "contain" }} unoptimized />
        <span className="font-bold text-white text-sm sm:text-base text-center">{player.displayName}</span>
      </div>
      <span className="font-bold text-lg" style={{ color: GREEN }}>{player.price}</span>
      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-1.5 w-full max-w-[160px]">
        {[
          { label: side === "out" ? "Sold GW" : "Bought GW", value: fmtTransfers(side === "out" ? player.transfersOut : player.transfersIn) },
          { label: "Owned",  value: `${player.ownership}%` },
          { label: "xPts",   value: player.ep_next === 0 ? "--" : player.ep_next.toFixed(1) },
          { label: "Form",   value: player.form },
        ].map(s => (
          <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "6px 8px", textAlign: "center" }}>
            <p className="font-bold tabular-nums text-sm" style={{ color: GREEN }}>{s.value}</p>
            <p className="text-[10px] mt-0.5 text-white">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Fixture */}
      {player.opponentName && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center" style={{ padding: "5px 10px", background: "#1A1A1A", borderRadius: 4 }}>
          <span className="text-[10px] text-white">Next:</span>
          <FdrDots fdr={player.fdrNext} />
          <span className="text-[10px] font-semibold text-white">
            {player.opponentName} ({player.isHome ? "H" : "A"}) — {fdrLabel(player.fdrNext)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Analysis panel ───────────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5"
      style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GREEN}` }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: GREEN }}>{title}</p>
      <div className="text-sm text-white/80 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Verdict colours ─────────────────────────────────────────────────────────

function verdictStyle(label: string) {
  if (label === "BACK THE MARKET") return { bg: "rgba(0,255,135,0.12)", border: "rgba(0,255,135,0.4)", color: GREEN }
  if (label === "STAY PUT")        return { bg: "rgba(255,180,0,0.08)", border: "rgba(255,180,0,0.3)", color: "#FFBE0B" }
  return { bg: "rgba(255,255,255,0.04)", border: BORDER, color: "white" }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TransferTrendPage({
  params,
}: {
  params: Promise<{ player_out: string; player_in: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />

  const { player_out, player_in } = await params
  const data = await getTransferTrendPageData(player_out, player_in)
  if (!data) notFound()

  const { gw, playerOut: pOut, playerIn: pIn } = data
  const text = buildTransferPageText(data)
  const vs = verdictStyle(text.verdictLabel)
  const delta = Math.abs(data.budgetDelta).toFixed(1)
  const budgetLine = data.budgetDelta > 0.05
    ? `Costs £${delta}m extra`
    : data.budgetDelta < -0.05
    ? `Frees £${delta}m`
    : "Price neutral"

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      {/* Hero header */}
      <section className="relative bg-black px-4 pt-28 pb-10 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,40,20,0.5) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: GREEN }}>
            Transfer Analysis · Gameweek {gw}
          </p>
          <h1 className="font-bold leading-tight tracking-tighter mb-4 text-white"
            style={{ fontSize: "clamp(22px, 4.5vw, 42px)" }}
          >
            Should I sell{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(to right,${GREEN},${CYAN})`, WebkitBackgroundClip: "text" }}
            >{pOut.displayName}</span>
            {" "}for{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(to right,${GREEN},${CYAN})`, WebkitBackgroundClip: "text" }}
            >{pIn.displayName}</span>?
          </h1>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            {fmtTransfers(pOut.transfersOut)} managers sold {pOut.webName} this week.{" "}
            {fmtTransfers(pIn.transfersIn)} bought {pIn.webName}. Here is the full picture.
          </p>
        </div>
      </section>

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-6">

          {/* Player comparison hero */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div style={{ height: 2, background: `linear-gradient(to right,${GREEN},${CYAN})`, opacity: 0.6 }} />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
              {/* OUT player */}
              <div className="flex flex-col items-center p-4 sm:p-6" style={{ borderRight: `1px solid ${BORDER}` }}>
                <PlayerHero player={pOut} side="out" />
              </div>
              {/* Divider arrow */}
              <div className="flex flex-col items-center justify-center px-2 sm:px-4 gap-2">
                <svg width="20" height="36" viewBox="0 0 20 36" fill="none">
                  <path d="M10 2v28M4 24l6 8 6-8" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)", writingMode: "vertical-rl" }}>
                  {budgetLine}
                </span>
              </div>
              {/* IN player */}
              <div className="flex flex-col items-center p-4 sm:p-6" style={{ borderLeft: `1px solid ${BORDER}` }}>
                <PlayerHero player={pIn} side="in" />
              </div>
            </div>
          </div>

          {/* Verdict banner */}
          <div className="rounded-xl p-5 text-center"
            style={{ background: vs.bg, border: `1px solid ${vs.border}` }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Transfer Verdict · Gameweek {gw}
            </p>
            <p className="text-xl font-bold mb-3" style={{ color: vs.color }}>{text.verdictLabel}</p>
            <p className="text-sm text-white/70 leading-relaxed max-w-xl mx-auto">{text.verdict}</p>
          </div>

          {/* Analysis panels */}
          <Panel title="Market Movement">
            <p>{text.marketPanel}</p>
          </Panel>

          <Panel title="Ownership and Rank">
            <p>{text.ownershipPanel}</p>
          </Panel>

          <Panel title="Budget Impact">
            <p>{text.budgetPanel}</p>
          </Panel>

          <Panel title="Fixture Window">
            <p>{text.fixturePanel}</p>
          </Panel>

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: `1px solid ${BORDER}`, borderLeft: `4px solid ${GREEN}`, background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Get a verdict based on your actual squad
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI factors in your full squad, available budget, and mini-league rivals before recommending whether to make this transfer. Try it free - no credit card required.
            </p>
            <Link
              href={`/chat?q=${encodeURIComponent(text.ctaPrompt)}`}
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: `linear-gradient(to right,${GREEN},${CYAN})` }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
              {text.ctaPrompt}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Back to hub */}
          <div className="flex justify-center">
            <Link href="/fpl/transfer-trends"
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              All transfer market trends for Gameweek {gw}
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
