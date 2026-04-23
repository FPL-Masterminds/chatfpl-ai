import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { HubCardExpand } from "@/components/hub-card-expand"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import {
  getTeamHub,
  getTeamSlugs,
  isSeasonOver,
  TEAM_POSITION_SLUGS,
  POSITION_META,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page"

export const revalidate = 43200
export const dynamic = "force-dynamic"

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const teams = await getTeamSlugs()
  return teams.flatMap(({ teamSlug }) =>
    TEAM_POSITION_SLUGS.map((position) => ({ team: teamSlug, position }))
  )
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string; position: string }>
}): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "Best FPL Team Players | ChatFPL AI" }
  const { team, position } = await params
  const posMeta = POSITION_META[position]
  if (!posMeta) return { title: "Best FPL Team Players | ChatFPL AI" }

  const data = await getTeamHub(team, position)
  if (!data) return { title: "Best FPL Team Players | ChatFPL AI" }

  const { gw, teamName } = data
  const title = `Best FPL ${teamName} ${posMeta.label} Gameweek ${gw} | ChatFPL AI`
  const description = `The best FPL ${teamName} ${posMeta.label.toLowerCase()} for Gameweek ${gw}, ranked by expected points. Form, fixture difficulty and ownership data for every pick.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/team/${team}/${position}`,
    },
  }
}

// ─── Analysis text ─────────────────────────────────────────────────────────────

function buildTeamText(
  player: CaptainHubPlayer,
  gw: number | string,
  teamName: string,
  positionSingular: string,
  index: number,
  randomBase: number,
): string {
  const name      = player.displayName
  const ep        = player.ep_next.toFixed(1)
  const formNum   = parseFloat(player.form)
  const form      = player.form
  const price     = player.price
  const ownership = player.ownership
  const fdrLabel  = FDR_LABELS[player.fdrNext ?? 3] ?? "Medium"
  const fixture   = player.opponentName
    ? `${player.opponentName} (${player.isHome ? "H" : "A"})`
    : "their next opponent"
  const epNum     = parseFloat(ep)
  const prospect  = epNum >= 5 ? "a strong return candidate" : epNum >= 3 ? "a reasonable option" : "a speculative pick"
  const formLine  = formNum > 0
    ? `Form of ${form} points per game over the last six gameweeks.`
    : `No recent form returns over the last six gameweeks.`

  const variant = (randomBase + index) % 3

  if (variant === 0) {
    return `${name} faces ${fixture} in Gameweek ${gw}, rated ${fdrLabel} for difficulty. ` +
      `The model projects ${ep} expected points, making ${name} ${prospect} among ${teamName}'s ${positionSingular.toLowerCase()}s this week. ` +
      `${formLine} ` +
      `At ${price} and ${ownership}% ownership.`
  }

  if (variant === 1) {
    return `At ${price}, ${name} faces ${fixture} in Gameweek ${gw}, a ${fdrLabel} rated fixture. ` +
      `The model projects ${ep} expected points. ` +
      `${formLine} ` +
      `${ownership}% of managers currently own ${name}.`
  }

  return `${name} is ${prospect} among ${teamName}'s ${positionSingular.toLowerCase()}s heading into Gameweek ${gw}. ` +
    `Fixture: ${fixture} (${fdrLabel}). ` +
    `Expected points: ${ep}. ` +
    `${formLine} ` +
    `Price: ${price}. Ownership: ${ownership}%.`
}

// ─── FDR helpers ──────────────────────────────────────────────────────────────

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
  return <span className="text-xs font-semibold text-white">{FDR_LABELS[fdr] ?? fdr}</span>
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  player, even, gw, text,
}: {
  player: CaptainHubPlayer
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
      overflow: "hidden",
    }}>
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6 }} />
      <div className="flex flex-row">

        {/* Photo strip */}
        <div
          className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
          style={{ minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div
            className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-[160px]">
              <HubPlayerPhoto code={player.code} name={player.displayName} />
            </div>
            <div className="w-14 sm:w-[160px]" style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base" style={{ color: GREEN }}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

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
              href={`/fpl/${player.slug}/transfer`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
            >
              Transfer analysis
            </Link>
          </div>

        </div>
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: "rgba(0,255,135,0.18)" }}>
        <HubCardExpand
          slug={player.slug}
          gw={gw}
          text={text}
          promptLabel={`Is ${player.displayName} worth signing in GW${gw}?`}
        />
      </div>
    </div>
  )
}

// ─── Related positions nav ─────────────────────────────────────────────────────

function GlowButton({ href, label }: { href: string; label: string }) {
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
        className="flex items-center rounded-full px-4 py-2 text-xs font-semibold"
        style={{ background: "rgba(0,0,0,0.9)" }}
      >
        <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {label}
        </span>
      </Link>
    </div>
  )
}

function RelatedPositions({
  teamSlug,
  teamName,
  currentPosition,
}: {
  teamSlug: string
  teamName: string
  currentPosition: string
}) {
  const others = TEAM_POSITION_SLUGS.filter((p) => p !== currentPosition)
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold leading-tight tracking-tight mb-6 text-center">
        <span className="text-white">Other {teamName} </span>
        <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>Positions</span>
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        <GlowButton href={`/fpl/team/${teamSlug}`} label={`All ${teamName} players`} />
        {others.map((pos) => {
          const pm = POSITION_META[pos]
          return <GlowButton key={pos} href={`/fpl/team/${teamSlug}/${pos}`} label={pm.label} />
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamPositionPage({
  params,
}: {
  params: Promise<{ team: string; position: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />

  const { team, position } = await params
  const posMeta = POSITION_META[position]
  if (!posMeta) notFound()

  const data = await getTeamHub(team, position)
  if (!data) notFound()

  const { gw, players, teamName, positionLabel } = data
  const randomBase = Math.floor(Math.random() * 3)

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite={`Best FPL ${teamName} `}
        headingGradient={`${positionLabel ?? ""}: Gameweek ${gw}`}
        subtitle={`All ${teamName} ${(positionLabel ?? "").toLowerCase()} ranked by expected points for Gameweek ${gw}. Form, fixture difficulty and ownership updated hourly.`}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">

          {players.length === 0 ? (
            <p className="text-center text-white/50 py-16">
              No available {teamName} {(positionLabel ?? "").toLowerCase()} found for Gameweek {gw}.
            </p>
          ) : (
            players.map((player, i) => (
              <Reveal key={player.slug} delay={i * 0.05}>
                <PlayerCard
                  player={player}
                  even={i % 2 === 0}
                  gw={gw}
                  text={buildTeamText(player, gw, teamName, posMeta.singular, i, randomBase)}
                />
              </Reveal>
            ))
          )}

          <RelatedPositions teamSlug={team} teamName={teamName} currentPosition={position} />

          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Not sure which {teamName} {posMeta.singular.toLowerCase()} fits your squad?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, budget, and rivals to recommend the best {teamName} {posMeta.singular.toLowerCase()} for your specific team. Try it free. No credit card required.
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
