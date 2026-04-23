import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer } from "@/components/conversational-player"
import { SeasonEnded } from "@/components/season-ended"
import { isSeasonOver } from "@/lib/fpl-player-page"
import {
  getGameweekDetail,
  getGameweekSlugs,
  buildBGWPageText,
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

  const isDGW = data.dgwTeams.length > 0
  const isBGW = data.bgwTeams.length > 0

  let title = `FPL Gameweek ${gwNum} - Full Fixture Round | ChatFPL AI`
  if (isDGW) title = `FPL Double Gameweek ${gwNum} - Who Should You Target? | ChatFPL AI`
  else if (isBGW) title = `FPL Blank Gameweek ${gwNum} - Which Teams Have No Fixture? | ChatFPL AI`

  let desc = `Gameweek ${gwNum} has a full set of Premier League fixtures.`
  if (isDGW) desc = `Double Gameweek ${gwNum}: ${dgwTeamNames} play twice. Top players ranked by projected points. Full analysis on ChatFPL AI.`
  else if (isBGW) desc = `Blank Gameweek ${gwNum}: ${bgwTeamNames} have no fixture. Find out who to bench, sell, or play around in GW${gwNum}.`

  return {
    title,
    description: desc,
    openGraph: {
      title,
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

// ─── BGW player card — full panel, matches hub card style ────────────────────

function BGWPlayerCard({ player, even }: { player: DGWPlayer; even: boolean }) {
  const stats = [
    { label: "Ownership",  value: `${player.ownership}%` },
    { label: "Form",       value: player.form },
    { label: "Total pts",  value: String(player.totalPts) },
    { label: "GW xPTS",    value: "0.0" },
  ]

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.28) 0%, rgba(0,255,135,0.12) 45%, rgba(0,255,135,0.04) 100%)"
        : "rgba(0,255,135,0.07)",
      border: "1px solid rgba(0,255,135,0.28)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.8 }} />
      <div className="flex flex-row">

        {/* Photo strip */}
        <div className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
          style={{ minHeight: 168, background: "rgba(0,0,0,0.35)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.2)", color: GREEN, border: "1px solid rgba(0,255,135,0.4)" }}
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

          {/* Status row */}
          <div style={{ padding: "7px 10px", background: "#1A1A1A", borderRadius: 4 }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-block rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
                Blank Gameweek
              </span>
              <span className="text-[11px] font-semibold text-white">{player.club} have no fixture in Gameweek {player.dgwGW}</span>
              <Link
                href={`/fpl/${player.slug}`}
                className="ml-auto shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
              >
                Full analysis
              </Link>
            </div>
          </div>

        </div>
      </div>
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

  const { gw, dgwTeams, bgwTeams, players, bgwPlayers, showcasePlayers } = data
  const hasDGW = dgwTeams.length > 0
  const hasBGW = bgwTeams.length > 0
  const isNormalGW = !hasDGW && !hasBGW

  const dgwTeamNames = dgwTeams.map((t) => t.teamName).join(" and ")
  const bgwTeamNames = bgwTeams.map((t) => t.teamName)
  const { welcome: bgwWelcome, qaItems: bgwQA } = hasBGW
    ? buildBGWPageText(gw, bgwTeamNames, bgwPlayers)
    : { welcome: "", qaItems: [] }

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        @keyframes glow_scroll { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>

      <DevHeader />

      {showcasePlayers.length === 5 ? (
        <FplPlayerHero
          h1White={hasDGW ? `FPL Double Gameweek ${gw} - ` : `FPL Blank Gameweek ${gw} - `}
          h1Gradient={hasDGW ? `Who Should You Target?` : `Which Teams Have No Fixture?`}
          subtitle={hasDGW ? `${dgwTeamNames} have two fixtures in Gameweek ${gw}. Top players ranked by projected double-game points.` : `Six Premier League clubs have no fixture in Gameweek ${gw}. Find out who to bench, sell, or play around.`}
          players={showcasePlayers}
          badgeLabel={hasDGW ? "Double Gameweek" : "Blank Gameweek"}
        />
      ) : (
        <div className="relative pt-28 pb-12 flex items-center justify-center text-center px-4" style={{ minHeight: 340, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), #000)" }}>
          <div>
            <div className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black mb-6" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
              {isNormalGW ? "Full Fixture Gameweek" : hasDGW ? "Double Gameweek" : "Blank Gameweek"}
            </div>
            <h1 className="font-bold leading-tight tracking-tighter text-white mb-4" style={{ fontSize: "clamp(26px,4vw,52px)" }}>
              {isNormalGW ? `FPL Gameweek ${gw} - ` : hasDGW ? `FPL Double Gameweek ${gw} - ` : `FPL Blank Gameweek ${gw} - `}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                {isNormalGW ? "Full Set of Fixtures" : hasDGW ? "Who Should You Target?" : "Which Teams Have No Fixture?"}
              </span>
            </h1>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 w-full max-w-4xl flex flex-col gap-10">

          {/* Normal GW notice */}
          {isNormalGW && (
            <div className="rounded-2xl px-6 py-8 text-center" style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black mb-4" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}>
                Full Fixture Gameweek
              </span>
              <h2 className="text-xl font-bold text-white mb-3">Gameweek {gw} has a full set of fixtures</h2>
              <p className="text-sm text-white/60 mb-6 max-w-lg mx-auto">
                All 20 Premier League clubs have a game in Gameweek {gw}. No teams are doubling or blanking this week. Use the tools below to plan your squad.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <GlowPill href="/fpl/captains">Captain Picks</GlowPill>
                <GlowPill href="/fpl/fixtures">Fixture Difficulty</GlowPill>
                <GlowPill href="/fpl/differentials">Differentials</GlowPill>
                <GlowPill href="/fpl/transfer-trends">Transfer Trends</GlowPill>
              </div>
            </div>
          )}

          {/* Stat strip */}
          {!isNormalGW && (
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
          )}

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

          {/* BGW players to bench */}
          {hasBGW && bgwPlayers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-1">
                <span className="text-white">Players to Bench in </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                  Gameweek {gw}
                </span>
              </h2>
              <p className="text-sm text-white mb-4">Sorted by ownership - these are the players most FPL managers need to move to the bench this week.</p>
              <div className="flex flex-col gap-3">
                {bgwPlayers.map((player, i) => (
                  <BGWPlayerCard key={player.slug} player={player} even={(i + 1) % 2 === 0} />
                ))}
              </div>
            </section>
          )}

          {/* BGW chatbot */}
          {hasBGW && bgwQA.length > 0 && (
            <section>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold leading-tight tracking-tight mb-2">
                  <span className="text-white">Blank Gameweek {gw} </span>
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                    Planning Guide
                  </span>
                </h2>
                <p className="text-white text-sm">Click a question below for the full breakdown.</p>
              </div>
              <div style={{ height: "clamp(480px, 65vh, 700px)" }}>
                <ConversationalPlayer welcome={bgwWelcome} qaItems={bgwQA} />
              </div>
            </section>
          )}

          {/* DGW Player rankings */}
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
