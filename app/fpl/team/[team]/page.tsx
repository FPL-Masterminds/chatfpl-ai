import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { SeasonEnded } from "@/components/season-ended"
import {
  getTeamHub,
  getTeamSlugs,
  isSeasonOver,
  TEAM_POSITION_SLUGS,
  POSITION_META,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page"

export const revalidate = 3600
export const dynamic = "force-dynamic"

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const teams = await getTeamSlugs()
  return teams.map(({ teamSlug }) => ({ team: teamSlug }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>
}): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "Best FPL Team Players | ChatFPL AI" }
  const { team } = await params
  const data = await getTeamHub(team, null)
  if (!data) return { title: "Best FPL Team Players | ChatFPL AI" }

  const { gw, teamName } = data
  const title = `Best FPL ${teamName} Players Gameweek ${gw} | ChatFPL AI`
  const description = `All FPL ${teamName} players ranked by expected points for Gameweek ${gw}. Form, fixture difficulty, ownership and transfer data updated hourly.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/team/${team}`,
    },
  }
}

// ─── Compact player row ────────────────────────────────────────────────────────

function PlayerRow({ player }: { player: CaptainHubPlayer }) {
  const fdrLabel = FDR_LABELS[player.fdrNext ?? 3] ?? "Medium"
  const fdrColor =
    player.fdrNext === 1 || player.fdrNext === 2 ? "#00FF87"
    : player.fdrNext === 4 || player.fdrNext === 5 ? "#ff6b6b"
    : "#f0c040"

  return (
    <Link
      href={`/fpl/${player.slug}/transfer`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04] group"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Image
        src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
        alt={player.displayName}
        width={40} height={51}
        className="w-9 shrink-0"
        style={{ objectFit: "contain" }}
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate group-hover:text-[#00FF87] transition-colors">
          {player.displayName}
        </p>
        <p className="text-white/40 text-[11px]">{player.price}</p>
      </div>
      <div className="hidden sm:flex items-center gap-3 shrink-0 text-right">
        <div className="text-center">
          <p className="text-[11px] font-bold tabular-nums" style={{ color: GREEN }}>{player.ep_next.toFixed(1)}</p>
          <p className="text-[9px] text-white/40">xPts</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold tabular-nums" style={{ color: fdrColor }}>{fdrLabel}</p>
          <p className="text-[9px] text-white/40">FDR</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold tabular-nums text-white/70">{player.ownership}%</p>
          <p className="text-[9px] text-white/40">Owned</p>
        </div>
      </div>
      <svg className="h-3.5 w-3.5 text-white/20 group-hover:text-[#00FF87] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ─── Position section ──────────────────────────────────────────────────────────

function PositionSection({
  teamSlug,
  teamName,
  posSlug,
  players,
}: {
  teamSlug: string
  teamName: string
  posSlug: string
  players: CaptainHubPlayer[]
}) {
  const pm = POSITION_META[posSlug]
  const filtered = players.filter((p) => {
    const posCodeMap: Record<string, string> = { GKP: "goalkeepers", DEF: "defenders", MID: "midfielders", FWD: "forwards" }
    return posCodeMap[p.position] === posSlug
  })
  if (filtered.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: GREEN }}>
          {pm.label}
        </h2>
        <Link
          href={`/fpl/team/${teamSlug}/${posSlug}`}
          className="text-[11px] font-semibold transition-all hover:scale-105 rounded-full px-3 py-1"
          style={{ border: "1px solid rgba(0,255,135,0.3)", color: GREEN, background: "rgba(0,255,135,0.06)" }}
        >
          View all {pm.label}
        </Link>
      </div>
      <div className="flex flex-col gap-1.5">
        {filtered.map((p) => <PlayerRow key={p.slug} player={p} />)}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamOverviewPage({
  params,
}: {
  params: Promise<{ team: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />

  const { team } = await params
  const data = await getTeamHub(team, null)
  if (!data) notFound()

  const { gw, players, teamName, teamCode } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite={`Best FPL `}
        headingGradient={`${teamName} Players: GW${gw}`}
        subtitle={`All ${teamName} players ranked by expected points for Gameweek ${gw}. Click any player for their full transfer analysis.`}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl">

          {/* Team badge */}
          <div className="flex justify-center mb-8">
            <Image
              src={`https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`}
              alt={teamName}
              width={70} height={70}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>

          {/* Players grouped by position */}
          {TEAM_POSITION_SLUGS.map((posSlug) => (
            <PositionSection
              key={posSlug}
              teamSlug={team}
              teamName={teamName}
              posSlug={posSlug}
              players={players}
            />
          ))}

          {/* Divider */}
          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Not sure which {teamName} player to bring in?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, budget, and rivals to tell you exactly which {teamName} asset is worth buying this gameweek. Try it free. No credit card required.
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
