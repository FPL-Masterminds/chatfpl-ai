import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { SeasonEnded } from "@/components/season-ended"
import { isSeasonOver } from "@/lib/fpl-player-page"
import {
  getGameweekDetail,
  getGameweekSlugs,
  type DGWPlayer,
  type DGWTeamSummary,
  type BGWTeamSummary,
} from "@/lib/fpl-gameweeks"

export const revalidate = 43200
export const dynamicParams = true

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

export async function generateStaticParams() {
  return getGameweekSlugs()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gw: string }>
}): Promise<Metadata> {
  const { gw } = await params
  const gwNum = parseInt(gw.replace("gw", ""), 10)
  const data  = await getGameweekDetail(gwNum)
  if (!data) return { title: "FPL Gameweek Planner | ChatFPL AI" }

  const dgwTeamNames = data.dgwTeams.map((t) => t.teamName).join(", ")
  const bgwTeamNames = data.bgwTeams.map((t) => t.teamName).join(", ")

  let desc = `Fantasy Premier League Gameweek ${gwNum} fixture landscape.`
  if (data.dgwTeams.length > 0) desc += ` Double Gameweek teams: ${dgwTeamNames}.`
  if (data.bgwTeams.length > 0) desc += ` Blank Gameweek teams: ${bgwTeamNames}.`

  return {
    title: `FPL ${data.dgwTeams.length > 0 ? "Double" : "Blank"} Gameweek ${gwNum} - Players to Target | ChatFPL AI`,
    description: desc,
    openGraph: {
      title: `FPL Gameweek ${gwNum} DGW Guide | ChatFPL AI`,
      description: desc,
      url: `https://www.chatfpl.ai/fpl/gameweeks/gw${gwNum}`,
    },
  }
}

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

function GlowPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="relative inline-block rounded-full" style={{ padding: "1px", background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)", backgroundSize: "220% 220%", animation: "glow_scroll 6s linear infinite" }}>
      <Link href={href} className="relative block rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:text-[#00FF87]" style={{ background: "rgba(0,0,0,0.85)" }}>
        {children}
      </Link>
    </div>
  )
}

// ─── Team fixture card ─────────────────────────────────────────────────────────

function TeamCard({ team }: { team: DGWTeamSummary }) {
  return (
    <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.04)" }}>
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.5, marginBottom: 12, borderRadius: 1 }} />
      <div className="flex items-center gap-2 mb-3">
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${team.teamCode}.png`}
          alt={team.teamName}
          width={24} height={24}
          style={{ objectFit: "contain" }}
          unoptimized
        />
        <span className="text-white font-bold text-sm">{team.teamName}</span>
        <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ml-auto text-black" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
          Double
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {team.fixtures.map((fix, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
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
            <span className="text-white/50 text-xs">({fix.isHome ? "H" : "A"})</span>
            <FdrDots fdr={fix.fdr} />
            <span className="text-xs text-white/50">{FDR_LABELS[fix.fdr]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BGWTeamCard({ team }: { team: BGWTeamSummary }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <Image
        src={`https://resources.premierleague.com/premierleague/badges/70/t${team.teamCode}.png`}
        alt={team.teamName}
        width={24} height={24}
        style={{ objectFit: "contain", opacity: 0.5 }}
        unoptimized
      />
      <span className="text-white/60 text-sm font-medium">{team.teamName}</span>
      <span className="text-[10px] text-white/30 ml-auto">No fixture</span>
    </div>
  )
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, rank }: { player: DGWPlayer; rank: number }) {
  const fix1 = player.dgwFixtures[0]
  const fix2 = player.dgwFixtures[1]

  return (
    <div className="flex items-center gap-3 py-3 px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[11px] font-bold text-white/40 w-5 shrink-0 tabular-nums">{rank}</span>
      <Image
        src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
        alt={player.displayName}
        width={36} height={45}
        style={{ objectFit: "contain", flexShrink: 0 }}
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-sm truncate">{player.displayName}</span>
          <span className="text-[9px] font-bold uppercase rounded px-1 py-0.5 shrink-0" style={{ background: "rgba(0,255,135,0.15)", color: GREEN }}>{player.position}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {[fix1, fix2].filter(Boolean).map((fix, i) => fix && (
            <span key={i} className="text-[10px] text-white/50">
              vs {fix.opponentShort} ({fix.isHome ? "H" : "A"})
            </span>
          ))}
        </div>
      </div>
      <div className="text-center shrink-0">
        <p className="font-bold text-sm tabular-nums" style={{ color: GREEN }}>{player.projectedPts.toFixed(1)}</p>
        <p className="text-[9px] text-white/40">Proj pts</p>
      </div>
      <div className="text-center shrink-0 hidden sm:block">
        <p className="text-sm font-semibold text-white/80">{player.price}</p>
        <p className="text-[9px] text-white/40">Price</p>
      </div>
      <Link
        href={`/fpl/double-gameweek/${player.slug}`}
        className="shrink-0 text-[11px] font-bold rounded-full transition-all hover:shadow-[0_0_16px_rgba(0,255,135,0.3)]"
        style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a", padding: "5px 12px" }}
      >
        Analyse
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GameweekDetailPage({
  params,
}: {
  params: Promise<{ gw: string }>
}) {
  const { gw: gwSlug } = await params
  if (await isSeasonOver()) return <SeasonEnded />

  const gwNum = parseInt(gwSlug.replace("gw", ""), 10)
  if (isNaN(gwNum)) notFound()

  const data = await getGameweekDetail(gwNum)
  if (!data) notFound()

  const { gw, dgwTeams, bgwTeams, players, showcasePlayers } = data
  const hasDGW = dgwTeams.length > 0
  const hasBGW = bgwTeams.length > 0

  const dgwTeamNames = dgwTeams.map((t) => t.teamName).join(" and ")

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        @keyframes glow_scroll { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>

      <DevHeader />

      {showcasePlayers.length === 5 && (
        <FplPlayerHero
          h1White={`Fantasy Premier League `}
          h1Gradient={hasDGW ? `Double Gameweek ${gw} - Players to Target` : `Gameweek ${gw} - Blank and Double Guide`}
          subtitle={hasDGW ? `${dgwTeamNames} have two fixtures in Gameweek ${gw}. Top players ranked by projected double-game points.` : `Gameweek ${gw} fixture landscape - which teams double, which go blank.`}
          players={showcasePlayers}
          badgeLabel="Gameweek Planner"
        />
      )}

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 w-full max-w-4xl flex flex-col gap-10">

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Gameweek",       value: `GW${gw}` },
              { label: "Teams Doubling", value: String(dgwTeams.length) },
              { label: "Teams Blanking", value: String(bgwTeams.length) },
              { label: "Players Listed", value: String(players.length) },
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

          {/* DGW teams section */}
          {hasDGW && (
            <section>
              <h2 className="text-xl font-bold mb-4">
                <span className="text-white">Double Gameweek </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                  Teams and Fixtures
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dgwTeams.map((team) => (
                  <TeamCard key={team.teamId} team={team} />
                ))}
              </div>
            </section>
          )}

          {/* BGW teams section */}
          {hasBGW && (
            <section>
              <h2 className="text-xl font-bold mb-4">
                <span className="text-white">Blank Gameweek </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                  Teams - No Fixture
                </span>
              </h2>
              <p className="text-sm text-white/50 mb-4">Players from these clubs score zero points in Gameweek {gw}. Consider benching or transferring them out.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bgwTeams.map((team) => (
                  <BGWTeamCard key={team.teamId} team={team} />
                ))}
              </div>
            </section>
          )}

          {/* Player rankings */}
          {players.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-1">
                <span className="text-white">Top Players to Target in </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                  Gameweek {gw}
                </span>
              </h2>
              <p className="text-sm text-white/50 mb-4">Ranked by single-game expected points. Projected total is estimated across both games.</p>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.02)" }}>
                <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.5 }} />
                {players.map((player, i) => (
                  <PlayerRow key={player.slug} player={player} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">Need a personalised Gameweek {gw} plan for your squad?</h3>
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

          {/* Hub nav */}
          <div className="flex flex-wrap justify-center gap-3">
            <GlowPill href="/fpl/gameweeks">All Gameweeks</GlowPill>
            <GlowPill href="/fpl/captains">Captain Picks</GlowPill>
            <GlowPill href="/fpl/fixtures">Fixture Difficulty</GlowPill>
            <GlowPill href="/fpl/transfer-trends">Transfer Trends</GlowPill>
          </div>

        </div>
      </main>
    </div>
  )
}
