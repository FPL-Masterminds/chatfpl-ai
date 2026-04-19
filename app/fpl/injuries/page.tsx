import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { InjuryHubFilters } from "@/components/injury-hub-filters"
import { getInjuryHub, statusLabel, type InjuryPlayer } from "@/lib/fpl-injury"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import { notFound } from "next/navigation"

export const revalidate = 3600

const GREEN = "#00FF87"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const data = await getInjuryHub()
  const gw = data?.gw ?? "?"
  return {
    title: `FPL Injury News Gameweek ${gw} — Who Is Injured? | ChatFPL AI`,
    description: `Full FPL injury and availability update for Gameweek ${gw}. Every injured, doubtful, and suspended player with their chance of playing and latest news.`,
    openGraph: {
      title: `FPL Injury News GW${gw} | ChatFPL AI`,
      description: `Every injured and doubtful FPL player for Gameweek ${gw} with their chance of playing.`,
      url: "https://www.chatfpl.ai/fpl/injuries",
    },
  }
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status, chance }: { status: string; chance: number }) {
  const label = statusLabel(status, chance)
  return (
    <span
      className="shrink-0 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black whitespace-nowrap"
      style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
    >
      {label}
    </span>
  )
}

// ─── Injury card ──────────────────────────────────────────────────────────────

function InjuryCard({ player, rank }: { player: InjuryPlayer; rank: number }) {
  const isAvailable = player.status === "a" && player.chance >= 100

  const stats = [
    { label: "Play Chance", value: isAvailable ? "100%" : player.chance === 0 ? "0%" : `${player.chance}%` },
    { label: "Position",    value: player.position },
    { label: "Price",       value: player.price },
    { label: "Minutes",     value: `${player.minutes}` },
  ]

  return (
    <div style={{
      background: "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
    }}>
      <div className="flex flex-row">

        {/* Left — photo strip */}
        <div
          className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
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

        {/* Right — data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

          {/* Name + badge + status pill */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-semibold truncate text-sm sm:text-lg">{player.displayName}</h2>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                alt={player.club} width={20} height={20}
                style={{ objectFit: "contain", flexShrink: 0 }}
                unoptimized
              />
            </div>
            <StatusPill status={player.status} chance={player.chance} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p
                  className="font-bold tabular-nums text-sm sm:text-base text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* News text + CTA */}
          <div className="flex items-center justify-between gap-2"
            style={{ padding: "7px 10px", background: "#1A1A1A", borderRadius: 4 }}
          >
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <span className="shrink-0" style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: "#00FF87", boxShadow: "0 0 5px 2px rgba(0,255,135,0.5)",
              }} />
              <p className="text-[11px] sm:text-xs text-white leading-relaxed">
                {player.news || `No injury concerns. ${player.displayName} is available for selection.`}
              </p>
            </div>
            <Link
              href={`/fpl/injury/${player.slug}`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
            >
              Full update
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InjuriesHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />
  const data = await getInjuryHub()
  if (!data) notFound()

  const { gw, players } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Injury and Fitness Update: "
        headingGradient={`Gameweek ${gw}`}
        subtitle={`Every injured, doubtful, and suspended FPL player for Gameweek ${gw}. Updated hourly. Click any player for their full fitness update.`}
      />

      {/* Filters + Cards */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <InjuryHubFilters players={players} />

        {/* Browse by budget */}
        <div className="w-full max-w-4xl mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-6 text-center">Browse by budget</p>
          <div className="space-y-3">
            {[
              { label: "Goalkeepers", links: [
                { href: "/fpl/best/goalkeepers/under-4m",   text: "Under £4.0m" },
                { href: "/fpl/best/goalkeepers/under-4-5m", text: "Under £4.5m" },
                { href: "/fpl/best/goalkeepers/under-5m",   text: "Under £5.0m" },
              ]},
              { label: "Defenders", links: [
                { href: "/fpl/best/defenders/under-4m",   text: "Under £4.0m" },
                { href: "/fpl/best/defenders/under-4-5m", text: "Under £4.5m" },
                { href: "/fpl/best/defenders/under-5m",   text: "Under £5.0m" },
                { href: "/fpl/best/defenders/under-5-5m", text: "Under £5.5m" },
                { href: "/fpl/best/defenders/under-6m",   text: "Under £6.0m" },
              ]},
              { label: "Midfielders", links: [
                { href: "/fpl/best/midfielders/under-5m",   text: "Under £5.0m" },
                { href: "/fpl/best/midfielders/under-5-5m", text: "Under £5.5m" },
                { href: "/fpl/best/midfielders/under-6m",   text: "Under £6.0m" },
                { href: "/fpl/best/midfielders/under-6-5m", text: "Under £6.5m" },
                { href: "/fpl/best/midfielders/under-7m",   text: "Under £7.0m" },
              ]},
              { label: "Forwards", links: [
                { href: "/fpl/best/forwards/under-6m",   text: "Under £6.0m" },
                { href: "/fpl/best/forwards/under-6-5m", text: "Under £6.5m" },
                { href: "/fpl/best/forwards/under-7m",   text: "Under £7.0m" },
                { href: "/fpl/best/forwards/under-7-5m", text: "Under £7.5m" },
                { href: "/fpl/best/forwards/under-8m",   text: "Under £8.0m" },
              ]},
            ].map(({ label, links }) => (
              <div key={label} className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-white/40 w-24 shrink-0">{label}</span>
                <div className="flex flex-wrap gap-2">
                  {links.map(({ href, text }) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition-all hover:border-[#00FF87]/40 hover:text-[#00FF87] hover:bg-[#00FF87]/[0.06]"
                    >
                      {text}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
