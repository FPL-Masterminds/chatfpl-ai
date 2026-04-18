import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { DevHeader } from "@/components/dev-header"
import { Reveal } from "@/components/scroll-reveal"
import {
  getInjuryPlayerData,
  getInjurySlugs,
  statusLabel,
  type InjuryPlayer,
} from "@/lib/fpl-injury"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

export const revalidate = 3600
export const dynamicParams = true

const GREEN = "#00FF87"

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getInjurySlugs()
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getInjuryPlayerData(slug)
  if (!data) return { title: "FPL Injury Update | ChatFPL AI" }

  const { player, gw } = data
  const isAvailable = player.status === "a" && player.chance >= 100

  return {
    title: `Is ${player.displayName} fit for Gameweek ${gw}? | ChatFPL AI`,
    description: isAvailable
      ? `${player.displayName} is fit and available for Gameweek ${gw} in Fantasy Premier League. No injury concerns.`
      : `${player.displayName} injury update for FPL Gameweek ${gw}. ${player.news || `${player.chance}% chance of playing.`}`,
    openGraph: {
      title: `Is ${player.displayName} fit for GW${gw}? | ChatFPL AI`,
      description: isAvailable
        ? `${player.displayName} — no injury concerns for Gameweek ${gw}.`
        : `${player.displayName} — ${statusLabel(player.status, player.chance)} for GW${gw}.`,
      url: `https://www.chatfpl.ai/fpl/injury/${slug}`,
    },
  }
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status, chance }: { status: string; chance: number }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
      style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
    >
      {statusLabel(status, chance)}
    </span>
  )
}

// ─── Alternative player card ──────────────────────────────────────────────────

function AltCard({ player }: { player: InjuryPlayer }) {
  const altStats = [
    { label: "PRICE",    value: player.price },
    { label: "POSITION", value: player.position },
    { label: "MINUTES",  value: `${player.minutes}` },
  ]
  return (
    <div style={{
      background: "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
    }}>
      <div className="flex flex-row">
        {/* Photo strip */}
        <div
          className="relative shrink-0 w-16 sm:w-20 flex flex-col items-center justify-end"
          style={{ background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", paddingBottom: 0 }}
        >
          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
            alt={player.displayName} width={72} height={92}
            style={{ objectFit: "contain", display: "block" }} unoptimized
          />
          <div style={{
            height: 1, width: "100%",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          }} />
        </div>

        {/* Data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 gap-2">
          {/* Name + badge + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-semibold text-sm sm:text-base truncate">{player.displayName}</span>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                alt={player.club} width={18} height={18}
                style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
            </div>
            <Link
              href={`/fpl/${player.slug}`}
              className="shrink-0 whitespace-nowrap text-[11px] font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "5px 14px" }}
            >
              Full analysis
            </Link>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-3 gap-1.5">
            {altStats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 6, padding: "6px 8px" }}>
                <p
                  className="font-bold tabular-nums text-sm text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >{s.value}</p>
                <p className="text-[9px] sm:text-[10px] mt-0.5 text-white uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InjuryPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />
  const { slug } = await params
  const data = await getInjuryPlayerData(slug)
  if (!data) notFound()

  const { gw, player, alternatives } = data
  const isAvailable = player.status === "a" && player.chance >= 100

  const stats = [
    { label: "Status",       value: statusLabel(player.status, player.chance) },
    { label: "Play Chance",  value: isAvailable ? "100%" : `${player.chance}%` },
    { label: "Price",        value: player.price },
    { label: "Minutes",      value: `${player.minutes}` },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
      }} />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(24px, 4.5vw, 48px)", maxWidth: 820 }}
        >
          <span className="text-white">Is {player.displayName} fit for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
          >
            Gameweek {gw}
          </span>
          <span className="text-white"> in Fantasy Premier League?</span>
        </h1>
        <p className="text-white/60 text-base max-w-xl">
          Live fitness and availability update for {player.displayName} — {player.club} {player.position}. Updated hourly from the official FPL API.
        </p>
      </section>

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-6">

          {/* ── Player card ── */}
          <Reveal>
            <div style={{
              background: "rgba(0,255,135,0.03)",
              border: "1px solid rgba(0,255,135,0.18)",
              borderRadius: 12,
            }}>
              <div className="flex flex-row">

                {/* Photo strip */}
                <div
                  className="relative shrink-0 w-24 sm:w-40 flex flex-col items-center justify-center"
                  style={{ minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
                >
                  <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                    style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
                  >
                    {player.position}
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                      alt={player.displayName} width={88} height={112}
                      style={{ objectFit: "contain" }} unoptimized
                    />
                    <div style={{
                      height: 1, width: 88,
                      background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                      boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                    }} />
                  </div>
                </div>

                {/* Data */}
                <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

                  {/* Name + badge + pill */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-white font-semibold truncate text-sm sm:text-lg">{player.displayName}</h2>
                      <Image
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                        alt={player.club} width={20} height={20}
                        style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
                      />
                    </div>
                    <StatusPill status={player.status} chance={player.chance} />
                  </div>

                  {/* Stat boxes */}
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

                  {/* News / fitness verdict */}
                  <div style={{ background: "#1A1A1A", borderRadius: 4, padding: "10px 12px" }}>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 mt-1" style={{
                        display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                        background: "#00FF87", boxShadow: "0 0 6px 3px rgba(0,255,135,0.5)",
                      }} />
                      <p className="text-xs sm:text-sm text-white leading-relaxed">
                        {player.news
                          ? player.news
                          : `No injury concerns. ${player.displayName} is available for Gameweek ${gw} and expected to start.`}
                      </p>
                    </div>
                  </div>

                  {/* Link to full player analysis */}
                  <div style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 10px" }} className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Want the full captain and transfer analysis?</span>
                    <Link
                      href={`/fpl/${player.slug}`}
                      className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                      style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
                    >
                      Full analysis
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Alternatives ── */}
          {!isAvailable && alternatives.length > 0 && (
            <Reveal delay={0.1}>
              <div>
                <h2 className="text-white font-bold text-lg mb-4">
                  Fit alternatives at a similar price
                </h2>
                <div className="flex flex-col gap-3">
                  {alternatives.map((alt) => (
                    <AltCard key={alt.slug} player={alt} />
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* ── Back to hub ── */}
          <Reveal delay={0.15}>
            <div className="flex items-center gap-3">
              <Link
                href="/fpl/injuries"
                className="text-sm font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "8px 20px" }}
              >
                All GW{gw} injury news
              </Link>
              <Link href="/chat" className="text-sm text-white/50 hover:text-white transition-colors">
                Ask ChatFPL AI about your squad
              </Link>
            </div>
          </Reveal>

        </div>
      </main>
    </div>
  )
}
