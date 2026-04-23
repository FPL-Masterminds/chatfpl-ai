import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"
import { SeasonEnded } from "@/components/season-ended"
import { isSeasonOver } from "@/lib/fpl-player-page"
import {
  getGameweekHub,
  buildDGWHubText,
  type DGWPlayer,
  type GameweekSummary,
} from "@/lib/fpl-gameweeks"

export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Gameweek Planner | ChatFPL AI" }
  const data = await getGameweekHub()
  const gw = data?.currentGW ?? "?"
  const nextDGW = data?.nextDGW
  return {
    title: `FPL Double Gameweek ${nextDGW ?? gw} Planner - Players to Target | ChatFPL AI`,
    description: `Which teams have a Double or Blank Gameweek in Fantasy Premier League? Full landscape for Gameweek ${gw} and beyond, with top players to target and avoid.`,
    openGraph: {
      title: `FPL Double Gameweek Planner - Gameweek ${gw} | ChatFPL AI`,
      description: `Full DGW and BGW landscape for Gameweek ${gw}. Top players to target from doubling teams ranked by expected points.`,
      url: "https://www.chatfpl.ai/fpl/gameweeks",
    },
  }
}

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="block rounded-full" style={{
          width: 7, height: 7,
          background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
        }} />
      ))}
    </span>
  )
}

// ─── GW landscape card ────────────────────────────────────────────────────────

function GWLandscapeCard({ gw: gwSummary, currentGW }: { gw: GameweekSummary; currentGW: number }) {
  const isCurrent = gwSummary.gw === currentGW
  const borderColor = gwSummary.isDGW ? "rgba(0,255,135,0.35)" : gwSummary.isBGW ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"
  const leftBorder  = gwSummary.isDGW ? "#00FF87" : gwSummary.isBGW ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${borderColor}`, borderLeft: `4px solid ${leftBorder}`, background: gwSummary.isDGW ? "rgba(0,255,135,0.04)" : "rgba(255,255,255,0.02)" }}
    >
      <div style={{ height: 2, background: gwSummary.isDGW ? "linear-gradient(to right,#00FF87,#00FFFF)" : "transparent", opacity: 0.5 }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">GW{gwSummary.gw}</span>
            {isCurrent && (
              <span className="text-[9px] font-black uppercase rounded-full px-2 py-0.5 text-black" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
                Next
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {gwSummary.isDGW && (
              <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1" style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}>
                DGW
              </span>
            )}
            {gwSummary.isBGW && (
              <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                BGW
              </span>
            )}
            {!gwSummary.hasActivity && (
              <span className="text-[10px] text-white/40">Normal GW</span>
            )}
          </div>
        </div>

        {gwSummary.isDGW && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Teams with double fixture</p>
            <div className="flex flex-wrap gap-2">
              {gwSummary.dgwTeams.map((team) => (
                <div key={team.teamId} className="flex items-center gap-1.5">
                  <Image
                    src={`https://resources.premierleague.com/premierleague/badges/70/t${team.teamCode}.png`}
                    alt={team.teamName}
                    width={16} height={16}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                  <span className="text-xs text-white/80 font-medium">{team.teamName}</span>
                  <span className="text-white/30 text-[10px]">
                    vs {team.fixtures.map((f) => `${f.opponentShort} (${f.isHome ? "H" : "A"})`).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gwSummary.isBGW && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Teams without a fixture</p>
            <div className="flex flex-wrap gap-2">
              {gwSummary.bgwTeams.slice(0, 6).map((team) => (
                <div key={team.teamId} className="flex items-center gap-1">
                  <Image
                    src={`https://resources.premierleague.com/premierleague/badges/70/t${team.teamCode}.png`}
                    alt={team.teamName}
                    width={14} height={14}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                  <span className="text-xs text-white/50">{team.teamName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gwSummary.hasActivity && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link
              href={`/fpl/gameweeks/gw${gwSummary.gw}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold rounded-full transition-all hover:shadow-[0_0_16px_rgba(0,255,135,0.3)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a", padding: "5px 14px" }}
            >
              Full GW{gwSummary.gw} breakdown
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, rank, even, text }: { player: DGWPlayer; rank: number; even: boolean; text: string }) {
  const fix1   = player.dgwFixtures[0]
  const fix2   = player.dgwFixtures[1]

  const stats = [
    { label: "xPts (x2)",    value: player.projectedPts.toFixed(1) },
    { label: "Form",         value: player.form },
    { label: "Owned",        value: `${player.ownership}%` },
    { label: "Transfers In", value: player.transfersIn.toLocaleString("en-GB") },
  ]

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.18) 0%, rgba(0,255,135,0.07) 45%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6 }} />
      <div className="flex flex-row">

        {/* Photo strip */}
        <div className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
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
              width={160} height={204}
              className="w-14 sm:w-[160px]"
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <div className="w-14 sm:w-[160px]" style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

          {/* Name + badge + price */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base" style={{ color: GREEN }}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Fixtures row */}
          <div style={{ padding: "7px 10px", background: "#1A1A1A", borderRadius: 4 }}>
            <div className="flex flex-wrap items-center gap-3">
              {[fix1, fix2].filter(Boolean).map((fix, i) => fix && (
                <div key={i} className="flex items-center gap-1.5">
                  {fix.opponentCode > 0 && (
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/70/t${fix.opponentCode}.png`}
                      alt={fix.opponentName}
                      width={14} height={14}
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  )}
                  <span className="text-[11px] font-semibold text-white">{fix.opponentShort} ({fix.isHome ? "H" : "A"})</span>
                  <FdrDots fdr={fix.fdr} />
                  <span className="text-[10px] text-white/50">{FDR_LABELS[fix.fdr]}</span>
                  {i === 0 && fix2 && <span className="text-white/20 text-xs">|</span>}
                </div>
              ))}
              <Link
                href={`/fpl/double-gameweek/${player.slug}`}
                className="ml-auto shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
              >
                Full analysis
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Expandable analysis */}
      <div className="border-t px-4 py-3" style={{ borderColor: "rgba(0,255,135,0.18)" }}>
        <HubCardExpand
          slug={player.slug}
          gw={player.dgwGW}
          text={text}
          promptLabel={`Should I start ${player.displayName} in Double Gameweek ${player.dgwGW}?`}
        />
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GameweeksHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const data = await getGameweekHub()
  if (!data) notFound()

  const { currentGW, nextDGW, gameweeks, topDGWPlayers } = data
  const hasDGW = topDGWPlayers.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="Fantasy Premier League Double and Blank "
        headingGradient={`Gameweek ${nextDGW ?? currentGW} Planner`}
        subtitle="Which teams have a Double Gameweek? Which have a Blank? Full landscape for the next 8 gameweeks with top players to target ranked by projected points."
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* GW landscape overview */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              <span className="text-white">Upcoming Gameweek </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                Landscape
              </span>
            </h2>
            {gameweeks.filter((g) => g.hasActivity).length > 0 ? (
              <div className="flex flex-col gap-3">
                {gameweeks.filter((g) => g.hasActivity).map((gwSummary) => (
                  <Reveal key={gwSummary.gw}>
                    <GWLandscapeCard gw={gwSummary} currentGW={currentGW} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl px-6 py-8 text-center" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <p className="text-white font-semibold mb-2">No Double or Blank Gameweeks confirmed yet</p>
                <p className="text-white/50 text-sm">Gameweeks {gameweeks[0]?.gw} to {gameweeks[gameweeks.length - 1]?.gw} all have a full set of fixtures. Check back as the schedule is updated.</p>
              </div>
            )}
          </section>

          {/* Top DGW players */}
          {hasDGW ? (
            <section>
              <h2 className="text-xl font-bold mb-1">
                <span className="text-white">Top Players to Target in a </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                  Double Gameweek
                </span>
              </h2>
              <p className="text-sm text-white/50 mb-5">Ranked by single-game expected points. Projected double-game total shown.</p>
              <div className="flex flex-col gap-3">
                {topDGWPlayers.map((player, i) => (
                  <Reveal key={player.slug} delay={i * 0.05}>
                    <PlayerCard
                      player={player}
                      rank={i + 1}
                      even={(i + 1) % 2 === 0}
                      text={buildDGWHubText(player)}
                    />
                  </Reveal>
                ))}
              </div>
            </section>
          ) : (
            <section>
              <div className="rounded-2xl px-6 py-8 text-center" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <p className="text-white/60 text-sm">No confirmed Double Gameweeks in the next 8 gameweeks. Check back as fixtures are confirmed.</p>
              </div>
            </section>
          )}

          <p className="text-center text-[11px] text-white/40 leading-relaxed">
            Double and Blank Gameweeks detected from the official FPL fixtures API. Updated hourly.
          </p>

          {/* Divider */}
          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">Need to know how Double Gameweeks affect your squad?</h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, transfer budget, and chip timing to give you a personalised Double Gameweek strategy. Try it free.
            </p>
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
      </main>
    </div>
  )
}
