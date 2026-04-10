import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { getComparisonHub, type ComparisonHubPair } from "@/lib/fpl-comparison"
import { isSeasonOver, getCaptainHub, getDifferentialHub } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

export const revalidate = 3600
export const dynamic = "force-dynamic"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Head-to-Head Comparisons | ChatFPL AI" }
  const data = await getComparisonHub()
  const gw = data?.gw ?? "?"
  return {
    title: `FPL Head-to-Head Comparisons Gameweek ${gw} | ChatFPL AI`,
    description: `The most-owned FPL players head-to-head for Gameweek ${gw}. Haaland vs Salah, Salah vs Palmer and more — expected points, form and a full verdict on who to pick.`,
    openGraph: {
      title: `FPL Head-to-Head Comparisons Gameweek ${gw} | ChatFPL AI`,
      description: `The most-owned FPL players head-to-head for GW${gw} — who to pick, who to bench.`,
      url: "https://www.chatfpl.ai/fpl/comparisons",
    },
  }
}

// ─── Comparison card ───────────────────────────────────────────────────────────

function ComparisonCard({ pair, rank }: { pair: ComparisonHubPair; rank: number }) {
  const GREEN = "#00FF87"
  const winnerEp = pair.epA >= pair.epB ? "A" : "B"

  return (
    <Link
      href={`/fpl/compare/${pair.slugA}/${pair.slugB}`}
      className="group block rounded-2xl transition-all hover:scale-[1.01]"
      style={{
        border: "1px solid rgba(0,255,135,0.18)",
        background: "rgba(0,255,135,0.03)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">

        {/* Rank */}
        <div className="shrink-0 w-6 text-center">
          <span
            className="text-base font-black"
            style={{ color: rank === 1 ? GREEN : "rgba(255,255,255,0.25)" }}
          >
            {rank}
          </span>
        </div>

        {/* Player A photo */}
        <div className="shrink-0 flex flex-col items-center" style={{ width: 46 }}>
          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeA}.png`}
            alt={pair.nameA}
            width={46}
            height={58}
            style={{ objectFit: "contain" }}
            unoptimized
          />
          <div
            style={{
              height: 1,
              width: 46,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }}
          />
        </div>

        {/* VS divider */}
        <div
          className="shrink-0 text-[9px] font-black tracking-widest"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          VS
        </div>

        {/* Player B photo */}
        <div className="shrink-0 flex flex-col items-center" style={{ width: 46 }}>
          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeB}.png`}
            alt={pair.nameB}
            width={46}
            height={58}
            style={{ objectFit: "contain" }}
            unoptimized
          />
          <div
            style={{
              height: 1,
              width: 46,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }}
          />
        </div>

        {/* Names + position */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              className="font-bold text-sm leading-tight truncate group-hover:text-[#00FF87] transition-colors"
              style={{ color: winnerEp === "A" ? GREEN : "rgba(255,255,255,0.9)" }}
            >
              {pair.nameA}
            </span>
            <span className="text-[10px] text-white/30 font-semibold shrink-0">vs</span>
            <span
              className="font-bold text-sm leading-tight truncate group-hover:text-[#00FF87] transition-colors"
              style={{ color: winnerEp === "B" ? GREEN : "rgba(255,255,255,0.9)" }}
            >
              {pair.nameB}
            </span>
          </div>
          <p className="text-[10px] text-white/45 mt-0.5">
            {pair.position} · {pair.clubA} vs {pair.clubB}
          </p>
        </div>

        {/* Stats — desktop */}
        <div className="hidden sm:flex items-center gap-0 shrink-0">
          {/* xPts A */}
          <div className="w-16 text-center">
            <p
              className="text-base font-bold tabular-nums"
              style={{ color: winnerEp === "A" ? GREEN : "rgba(255,255,255,0.7)" }}
            >
              {pair.epA.toFixed(1)}
            </p>
            <p className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">
              {pair.nameA.split(" ")[0]} xPts
            </p>
          </div>
          {/* xPts B */}
          <div className="w-16 text-center">
            <p
              className="text-base font-bold tabular-nums"
              style={{ color: winnerEp === "B" ? GREEN : "rgba(255,255,255,0.7)" }}
            >
              {pair.epB.toFixed(1)}
            </p>
            <p className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">
              {pair.nameB.split(" ")[0]} xPts
            </p>
          </div>
          {/* Gap */}
          <div className="w-14 text-center">
            <p className="text-base font-bold tabular-nums text-white/50">
              {Math.abs(pair.epA - pair.epB).toFixed(1)}
            </p>
            <p className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">Gap</p>
          </div>
        </div>

        {/* Mobile stat — gap only */}
        <div className="flex sm:hidden flex-col items-end shrink-0">
          <p className="text-sm font-bold tabular-nums text-white/50">
            {Math.abs(pair.epA - pair.epB).toFixed(1)}
          </p>
          <p className="text-[8px] uppercase tracking-wider text-white/40">Gap</p>
        </div>

        {/* Arrow */}
        <svg
          className="hidden sm:block shrink-0 h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparisonsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const [data, captainData, diffData] = await Promise.all([
    getComparisonHub(),
    getCaptainHub(),
    getDifferentialHub(),
  ])
  if (!data) notFound()

  const { gw, pairs } = data
  const topCaptain = captainData?.players?.[0] ?? null
  const topDiff    = diffData?.players?.[0] ?? null
  const GREEN = "#00FF87"

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(24px, 4.5vw, 50px)", maxWidth: 860 }}
        >
          <span className="text-white">Fantasy Premier League Head-to-Head Player Comparisons. </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
              WebkitBackgroundClip: "text",
            }}
          >
            Who Should You Pick?
          </span>
        </h1>

        <p className="text-white/60 text-base max-w-2xl">
          The most-owned FPL players going head-to-head for Gameweek {gw}. Ranked by combined ownership, the bigger the names, the higher up the list.
        </p>
      </section>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl">

          {/* Column headers — desktop */}
          <div className="hidden sm:flex items-center gap-3 px-5 mb-2 text-[9px] uppercase tracking-[0.15em] text-white/70">
            <div className="w-6 shrink-0" />
            <div className="shrink-0" style={{ width: 46 }} />
            <div className="shrink-0 w-8 text-center" />
            <div className="shrink-0" style={{ width: 46 }} />
            <div className="flex-1">Matchup</div>
            <div className="flex shrink-0">
              <span className="w-16 text-center">Player A xPts</span>
              <span className="w-16 text-center">Player B xPts</span>
              <span className="w-14 text-center">Gap</span>
            </div>
            <div className="w-4 shrink-0" />
          </div>

          {/* Comparison cards */}
          <div className="flex flex-col gap-3">
            {pairs.map((pair, i) => (
              <ComparisonCard
                key={`${pair.slugA}-${pair.slugB}`}
                pair={pair}
                rank={i + 1}
              />
            ))}
          </div>

          {/* Explainer */}
          <p className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
            25 random matchups from the top 10 most-owned defenders, midfielders and forwards for GW{gw}. Ranked by combined ownership. Excludes goalkeepers and ruled-out players. Refreshes each visit.
          </p>

          {/* Divider */}
          <div
            className="my-10 h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }}
          />

          {/* Other hubs */}
          <div className="grid gap-4 sm:grid-cols-2 mb-10">
            {/* Captains Hub panel */}
            <Link
              href="/fpl/captains"
              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.01]"
              style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.03)", minHeight: 96 }}
            >
              <div className="px-6 py-5 relative z-10" style={{ paddingRight: topCaptain ? 70 : undefined }}>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Also see</p>
                <p className="font-bold text-white text-sm group-hover:text-[#00FF87] transition-colors">
                  Captains Hub →
                </p>
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

            {/* Differentials Hub panel */}
            <Link
              href="/fpl/differentials"
              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.01]"
              style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.03)", minHeight: 96 }}
            >
              <div className="px-6 py-5 relative z-10" style={{ paddingRight: topDiff ? 70 : undefined }}>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Also see</p>
                <p className="font-bold text-white text-sm group-hover:text-[#00FF87] transition-colors">
                  Differentials Hub →
                </p>
                <p className="text-[11px] text-white/50 mt-0.5">Low-ownership gems for GW{gw}</p>
              </div>
              {topDiff && (
                <div className="absolute right-4 inset-y-0 flex items-center justify-center z-0" style={{ width: 56 }}>
                  <div className="flex flex-col items-center">
                    <Image src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${topDiff.code}.png`} alt={topDiff.displayName} width={56} height={70} style={{ objectFit: "contain" }} unoptimized />
                    <div style={{ height: 1, width: 56, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)", boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)" }} />
                  </div>
                </div>
              )}
            </Link>
          </div>

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
              Can&apos;t split them?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, transfer budget, and rival managers to give you a personalised verdict. 20 free messages — no credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
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
