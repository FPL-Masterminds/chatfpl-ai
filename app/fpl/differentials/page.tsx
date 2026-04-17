import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { getDifferentialHub, getCaptainHub, isSeasonOver, type DifferentialHubPlayer } from "@/lib/fpl-player-page"
import { getComparisonHub } from "@/lib/fpl-comparison"
import { SeasonEnded } from "@/components/season-ended"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"

export const revalidate = 3600
export const dynamic = "force-dynamic"

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Differential Picks | ChatFPL AI" }
  const data = await getDifferentialHub()
  const gw = data?.gw ?? "?"
  return {
    title: `Best FPL Differential Picks Gameweek ${gw} | ChatFPL AI`,
    description: `The top FPL differential picks for Gameweek ${gw} — low-ownership players with high expected points who could rocket your rank. Updated hourly.`,
    openGraph: {
      title: `Best FPL Differential Picks Gameweek ${gw} | ChatFPL AI`,
      description: `Top FPL differentials for GW${gw} ranked by expected points per ownership percentage.`,
      url: "https://www.chatfpl.ai/fpl/differentials",
    },
  }
}

// ─── Text generation — 3 rotating templates ───────────────────────────────────

function buildDiffText(player: DifferentialHubPlayer, gw: number | string, rank: number, randomBase: number): string {
  const name      = player.displayName
  const ownership = player.ownership
  const ep        = player.ep_next.toFixed(1)
  const form      = player.form
  const price     = player.price
  const fdrLabel  = FDR_LABELS[player.fdrNext ?? 3] ?? "Medium"
  const fixture   = player.opponentName
    ? `${player.opponentName} (${player.isHome ? "H" : "A"})`
    : "their next opponent"
  const swingPct  = Math.round(100 - parseFloat(String(ownership)))

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `Only ${ownership}% of FPL managers own ${name} heading into Gameweek ${gw}, ` +
      `which makes this one of the more compelling rank-swing opportunities available. ` +
      `A return here gains on roughly ${swingPct}% of the field, and at ${price}, the financial commitment is low. ` +
      `The model projects ${ep} expected points against ${fixture}, rated ${fdrLabel} for difficulty, ` +
      `with recent form sitting at ${form} per game over six gameweeks. ` +
      `The numbers are there to back the punt rather than just hope for it.`
  }

  if (variant === 1) {
    return `${name} faces ${fixture} in Gameweek ${gw}, a fixture rated ${fdrLabel} for difficulty, ` +
      `and the broader data supports a return. ` +
      `Form of ${form} points per game over the last six gameweeks and projected expected points of ${ep} ` +
      `suggest this is more than a speculative pick. ` +
      `Ownership sits at just ${ownership}%, meaning the vast majority of rivals won't benefit if ${name} delivers. ` +
      `That is exactly the asymmetry differential picking is built around.`
  }

  return `Form of ${form} points per game over the last six gameweeks and a ${fdrLabel} fixture ` +
    `against ${fixture} in Gameweek ${gw} make ${name} one of the cleaner differential cases this week. ` +
    `Expected points of ${ep} put them among the stronger low-ownership options available. ` +
    `The ownership figure tells the real story: just ${ownership}%. ` +
    `Getting ${name} right when roughly ${swingPct}% of managers don't own them is how rank climbs happen. ` +
    `At ${price}, the cost of being wrong is manageable. The cost of missing a haul at this ownership is not.`
}

// ─── FDR dots + label ─────────────────────────────────────────────────────────

function FdrDots({ fdr }: { fdr: number | null }) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="block rounded-full" style={{
          width: 7, height: 7,
          background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
        }} />
      ))}
    </span>
  )
}

function FdrLabel({ fdr }: { fdr: number | null }) {
  if (fdr === null) return <span className="text-white/30 text-xs">-</span>
  return (
    <span className="text-xs font-semibold text-white">
      {FDR_LABELS[fdr] ?? fdr}
    </span>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, rank, even, gw, text }: {
  player: DifferentialHubPlayer
  rank: number
  even: boolean
  gw: number | string
  text: string
}) {
  const transfersLabel = player.transfersIn >= 1000
    ? `${(player.transfersIn / 1000).toFixed(1)}k`
    : `${player.transfersIn}`

  const stats = [
    { label: "xPts",         value: player.ep_next.toFixed(1) },
    { label: "Form",         value: player.form },
    { label: "Owned",        value: `${player.ownership}%` },
    { label: "Transfers In", value: transfersLabel },
  ]

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.18) 0%, rgba(0,255,135,0.07) 45%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
    }}>
      <div className="flex flex-row">

        {/* Left — photo strip */}
        <div className="relative shrink-0 w-24 sm:w-40 flex flex-col items-center justify-center"
          style={{ minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div className="absolute top-2 left-2 z-10 flex items-center justify-center rounded"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.25)" }}
          >
            <span className="text-[10px] font-bold tabular-nums text-white">{rank}</span>
          </div>
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
              alt={player.displayName}
              width={88} height={112}
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <div style={{
              height: 1, width: 88,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Right — data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

          {/* Row 1: name + badge + price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-semibold truncate text-sm sm:text-lg">{player.displayName}</h2>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                alt={player.club}
                width={20} height={20}
                style={{ objectFit: "contain", flexShrink: 0 }}
                unoptimized
              />
            </div>
            <span className="font-bold text-white text-base sm:text-xl shrink-0">{player.price}</span>
          </div>

          {/* Row 2: stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base" style={{ color: GREEN }}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Row 3: FDR + opponent + CTA */}
          <div className="flex items-center justify-between gap-2" style={{
            padding: "7px 10px", background: "#1A1A1A", borderRadius: 4,
          }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-white">FDR:</span>
                <FdrDots fdr={player.fdrNext} />
                <FdrLabel fdr={player.fdrNext} />
              </div>
              {player.opponentName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/20 text-[10px]">|</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white">
                    {player.opponentName} ({player.isHome ? "H" : "A"})
                  </span>
                  {player.opponentCode && (
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/70/t${player.opponentCode}.png`}
                      alt={player.opponentName}
                      width={16} height={16}
                      style={{ objectFit: "contain", flexShrink: 0 }}
                      unoptimized
                    />
                  )}
                </div>
              )}
            </div>
            <Link
              href={`/fpl/${player.slug}/differential`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
            >
              Full analysis
            </Link>
          </div>

          {/* Expandable analysis */}
          <HubCardExpand
            slug={player.slug}
            gw={gw}
            text={text}
            promptLabel={`Is ${player.displayName} a good differential in GW${gw}?`}
          />

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DifferentialsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const randomBase = Math.floor(Math.random() * 3)

  const [data, captainData, compData] = await Promise.all([
    getDifferentialHub(),
    getCaptainHub(),
    getComparisonHub(),
  ])
  if (!data) notFound()

  const { gw, players } = data
  const topCaptain = captainData?.players?.[0] ?? null
  const topPair    = compData?.pairs?.[0] ?? null

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(26px, 5vw, 52px)", maxWidth: 820 }}
        >
          <span className="text-white">The Best FPL Differential Picks for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
              WebkitBackgroundClip: "text",
            }}
          >
            Gameweek {gw}
          </span>
        </h1>
        <p className="text-white/60 text-base max-w-xl">
          Low-ownership players ranked by expected points relative to their ownership. Click any player for the full differential verdict and rank-impact analysis.
        </p>
      </section>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl">

          {/* Player cards */}
          <div className="flex flex-col gap-3">
            {players.map((player, i) => (
              <Reveal key={player.slug} delay={i * 0.06}>
                <PlayerCard
                  player={player}
                  rank={i + 1}
                  even={(i + 1) % 2 === 0}
                  gw={gw}
                  text={buildDiffText(player, gw, i + 1, randomBase)}
                />
              </Reveal>
            ))}
          </div>

          <p className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
            Ranked by expected points divided by ownership percentage. Excludes goalkeepers, ruled-out players, and anyone with more than 20% ownership. Updated hourly.
          </p>

          {/* Other hubs */}
          <div className="grid gap-4 sm:grid-cols-2 mt-8 mb-2">
            <Link
              href="/fpl/captains"
              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.01]"
              style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.03)", minHeight: 96 }}
            >
              <div className="px-6 py-5 relative z-10" style={{ paddingRight: topCaptain ? 70 : undefined }}>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Also see</p>
                <p className="font-bold text-white text-sm group-hover:text-[#00FF87] transition-colors">Captains Hub →</p>
                <p className="text-[11px] text-white/50 mt-0.5">Top captain picks for GW{gw}</p>
              </div>
              {topCaptain && (
                <div className="absolute right-4 inset-y-0 flex items-center justify-center z-0" style={{ width: 56 }}>
                  <div className="flex flex-col items-center">
                    <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${topCaptain.code}.png`} alt={topCaptain.displayName} width={56} height={70} style={{ objectFit: "contain" }} unoptimized />
                    <div style={{ height: 1, width: 56, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)", boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
                  </div>
                </div>
              )}
            </Link>

            <Link
              href="/fpl/comparisons"
              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.01]"
              style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.03)", minHeight: 96 }}
            >
              <div className="px-6 py-5 relative z-10" style={{ paddingRight: topPair ? 116 : undefined }}>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Also see</p>
                <p className="font-bold text-white text-sm group-hover:text-[#00FF87] transition-colors">Head-to-Head Hub →</p>
                <p className="text-[11px] text-white/50 mt-0.5">Top FPL matchups for GW{gw}</p>
              </div>
              {topPair && (
                <div className="absolute right-4 inset-y-0 flex flex-row items-center z-0 gap-1">
                  <div className="flex flex-col items-center">
                    <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${topPair.codeA}.png`} alt={topPair.nameA} width={50} height={63} style={{ objectFit: "contain" }} unoptimized />
                    <div style={{ height: 1, width: 50, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)", boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
                  </div>
                  <div className="flex flex-col items-center">
                    <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${topPair.codeB}.png`} alt={topPair.nameB} width={50} height={63} style={{ objectFit: "contain" }} unoptimized />
                    <div style={{ height: 1, width: 50, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)", boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
                  </div>
                </div>
              )}
            </Link>
          </div>

          <div
            className="my-10 h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }}
          />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{
              border: "1px solid rgba(0,255,135,0.18)",
              borderLeft: "4px solid #00FF87",
              background: "rgba(0,255,135,0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Is a differential the right call for your squad?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, rivals, and rank trajectory to tell you whether a differential play makes sense this gameweek. Try it free - no credit card required.
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
