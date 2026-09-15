import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { Reveal } from "@/components/scroll-reveal"
import { buildPageMetadata } from "@/lib/seo/metadata"
import { isSiteOwner } from "@/lib/god-mode"
import {
  formatNextPriceChangeCountdown,
  getPriceChangesHub,
  type PriceChangePlayer,
} from "@/lib/fpl-price-changes"

export const dynamic = "force-dynamic"

export const metadata = buildPageMetadata({
  title: "Dev Price Changes Hub - ChatFPL AI",
  description: "Private preview of the FPL price changes hub.",
  path: "/dev-pricechangeshub",
  noIndex: true,
})

const GREEN = "#00FF87"
const CYAN = "#00FFFF"
const MUTED = "#8b949e"
const SURFACE = "rgba(13,17,23,0.82)"
const BORDER = "rgba(255,255,255,0.07)"
const RISE = "#00FF87"
const FALL = "#ff6b6b"
const LOCKED = "#fbbf24"

const LIST_LIMIT = 25

function statusTone(player: PriceChangePlayer): string {
  if (player.isLocked) return LOCKED
  if (player.direction === "rise") return RISE
  if (player.direction === "fall") return FALL
  return MUTED
}

function StatusBadge({ player }: { player: PriceChangePlayer }) {
  const tone = statusTone(player)
  return (
    <span
      className="shrink-0 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{
        color: tone,
        background: `${tone}18`,
        border: `1px solid ${tone}55`,
      }}
    >
      {player.statusLabel}
    </span>
  )
}

function ProgressBar({ player }: { player: PriceChangePlayer }) {
  const pct = Math.abs(player.progressPercent)
  const width = Math.min(pct, 100)
  const tone = statusTone(player)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>Progress</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: tone }}>
          {player.progressPercent > 0 ? "+" : ""}{player.progressPercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right, ${tone}, ${player.direction === "fall" ? "#ff9b9b" : CYAN})`,
            boxShadow: `0 0 12px ${tone}55`,
          }}
        />
      </div>
    </div>
  )
}

function ProjectionStrip({ player }: { player: PriceChangePlayer }) {
  if (!player.projections.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {player.projections.map((proj) => {
        const label = proj.offset === 0 ? "Tonight" : proj.offset === 1 ? "Tomorrow" : `+${proj.offset}d`
        const tone = proj.likelihood > 0 ? RISE : proj.likelihood < 0 ? FALL : MUTED
        return (
          <span
            key={proj.offset}
            className="rounded px-2 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ background: "rgba(255,255,255,0.05)", color: tone, border: `1px solid ${tone}33` }}
          >
            {label}: {proj.projectedPercent > 0 ? "+" : ""}{proj.projectedPercent.toFixed(1)}%
          </span>
        )
      })}
    </div>
  )
}

function PriceChangeCard({ player, rank }: { player: PriceChangePlayer; rank: number }) {
  const tone = statusTone(player)
  const changedLabel =
    player.costChangeEvent > 0
      ? `+£${player.costChangeEvent.toFixed(1)}m this GW`
      : player.costChangeEvent < 0
        ? `-£${Math.abs(player.costChangeEvent).toFixed(1)}m this GW`
        : null

  return (
    <div
      style={{
        background: SURFACE,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${BORDER}`,
        borderTop: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: 16,
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.8)",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(to right, ${tone}, ${CYAN})`, opacity: 0.55 }} />
      <div className="flex flex-col sm:flex-row">
        <div
          className="relative shrink-0 flex items-center justify-center gap-3 px-4 py-4 sm:w-56"
          style={{ background: "rgba(0,0,0,0.45)", borderRight: `1px solid ${BORDER}` }}
        >
          <span
            className="absolute top-3 left-3 rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: "rgba(0,255,135,0.12)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            #{rank}
          </span>
          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
            alt={player.displayName}
            width={110}
            height={140}
            className="w-16 sm:w-20"
            style={{ objectFit: "contain" }}
            unoptimized
          />
          <div className="min-w-0 sm:hidden">
            <p className="text-white font-bold truncate">{player.displayName}</p>
            <p className="text-xs" style={{ color: MUTED }}>{player.club}</p>
          </div>
        </div>

        <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
          <div className="hidden sm:flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-lg truncate">{player.displayName}</h2>
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                  alt={player.club}
                  width={18}
                  height={18}
                  style={{ objectFit: "contain", flexShrink: 0 }}
                  unoptimized
                />
              </div>
              <p className="text-sm" style={{ color: MUTED }}>
                {player.club} · {player.position} · {player.price}
              </p>
            </div>
            <StatusBadge player={player} />
          </div>

          <div className="sm:hidden flex items-center justify-between gap-2">
            <StatusBadge player={player} />
            <span className="text-sm font-bold text-white">{player.price}</span>
          </div>

          <ProgressBar player={player} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Hourly rate", value: player.hourlyRate.toLocaleString("en-GB") },
              { label: "Owned", value: `${player.ownership.toFixed(1)}%` },
              { label: "TI / TO (GW)", value: `${(player.transfersIn / 1000).toFixed(0)}k / ${(player.transfersOut / 1000).toFixed(0)}k` },
              { label: "Season Δ", value: `${player.costChangeSeason > 0 ? "+" : ""}£${player.costChangeSeason.toFixed(1)}m` },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#1A1A1A", borderRadius: 6, padding: "8px 10px" }}>
                <p className="text-sm font-bold text-white tabular-nums">{stat.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <ProjectionStrip player={player} />

          {player.isLocked && player.lockedUntil && (
            <p className="text-xs" style={{ color: LOCKED }}>
              Price locked until {new Date(player.lockedUntil).toLocaleString("en-GB", { timeZone: "Europe/London" })} UK
            </p>
          )}

          {changedLabel && (
            <p className="text-xs font-semibold" style={{ color: player.costChangeEvent > 0 ? RISE : FALL }}>
              {changedLabel}
            </p>
          )}

          {player.slug && (
            <div className="pt-1">
              <Link
                href={`/fpl/${player.slug}/transfer`}
                className="text-xs font-semibold transition-colors hover:text-white"
                style={{ color: GREEN }}
              >
                Open transfer analysis for {player.webName}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  players,
  empty,
}: {
  title: string
  subtitle: string
  players: PriceChangePlayer[]
  empty: string
}) {
  const visible = players.slice(0, LIST_LIMIT)
  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm mt-1" style={{ color: MUTED }}>{subtitle}</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          Showing {visible.length} of {players.length}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm rounded-xl px-4 py-6 text-center" style={{ color: MUTED, background: SURFACE, border: `1px solid ${BORDER}` }}>
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((player, i) => (
            <Reveal key={`${title}-${player.elementId}`} delay={i * 0.04}>
              <PriceChangeCard player={player} rank={i + 1} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}

export default async function DevPriceChangesHubPage() {
  const session = await auth()
  if (!isSiteOwner(session?.user?.email)) redirect("/login")

  const data = await getPriceChangesHub()
  if (!data) notFound()

  const fetchedLabel = new Date(data.fetchedAt).toLocaleString("en-GB", { timeZone: "Europe/London" })
  const countdown = formatNextPriceChangeCountdown()

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Price Changes "
        headingGradient={`Gameweek ${data.gw}`}
        subtitle="Live FPL price-rise and price-fall projections from the official bootstrap API. Progress %, hourly transfer rate, and tonight/tomorrow outlook. Dev preview only."
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
            >
              Dev preview
            </span>
            <span className="text-xs text-white/45">Not indexed · owner only</span>
          </div>
        }
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20 gap-10">
        <div
          className="w-full max-w-3xl rounded-2xl px-4 py-4 sm:px-5"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Next change", value: countdown },
              { label: "Likely risers", value: String(data.likelyRisers.length) },
              { label: "Likely fallers", value: String(data.likelyFallers.length) },
              { label: "Locked", value: String(data.locked.length) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-lg font-bold text-white tabular-nums">{item.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: MUTED }}>
            Data fetched {fetchedLabel} UK · refreshes every 15 minutes · next nightly change at midnight UK
          </p>
          {data.seasonCalibrating && (
            <p className="text-xs mt-2 font-medium" style={{ color: LOCKED }}>
              FPL still calibrating early-season price models. Treat borderline flags with extra caution.
            </p>
          )}
        </div>

        <Section
          title="Likely to rise tonight"
          subtitle="Players with positive FPL likelihood scores, sorted by confidence then progress."
          players={data.likelyRisers}
          empty="No players currently flagged as likely risers."
        />

        <Section
          title="Likely to fall tonight"
          subtitle="Players with negative FPL likelihood scores, sorted by confidence then progress."
          players={data.likelyFallers}
          empty="No players currently flagged as likely fallers."
        />

        <Section
          title="Already changed this gameweek"
          subtitle="Players who have already risen or fallen in price during the current gameweek."
          players={data.changedThisGw}
          empty="No price changes recorded this gameweek yet."
        />

        <Section
          title="Price locked"
          subtitle="Injured or unavailable players whose price is frozen until the lock expires."
          players={data.locked}
          empty="No locked prices right now."
        />
      </main>
    </div>
  )
}
