import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { DevHeader } from "@/components/dev-header"
import { FplPlayerHero, type FplCardPlayer } from "@/components/fpl-player-hero"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCard(p: InjuryPlayer): FplCardPlayer {
  return {
    code:     p.code,
    name:     p.displayName,
    club:     p.club,
    teamCode: p.teamCode,
    position: p.position,
    price:    p.price,
    form:     p.form,
    totalPts: p.totalPts,
  }
}

function buildVerdict(player: InjuryPlayer, gw: number) {
  const { status, chance, news, displayName, minutes, form, totalPts } = player
  const isUnavailable = status === "i" || status === "u" || chance === 0
  const isSuspended   = status === "s"
  const isConcern     = !isUnavailable && !isSuspended && chance < 100
  const isAvailable   = status === "a" && chance >= 100

  let verdictLabel: string
  let verdict: string
  let bullets: string[]
  let context: string

  if (isAvailable) {
    verdictLabel = "AVAILABLE"
    verdict = `${displayName} has no current injury concerns and is expected to be available for Gameweek ${gw}.`
    bullets = [
      `Fully fit — no FPL news flags heading into GW${gw}`,
      `${minutes} minutes accumulated this season — regular starter`,
      `Form: ${form} pts/game over recent gameweeks`,
    ]
    context = `With ${totalPts} total points this season at ${player.price}, ${displayName} remains a reliable asset. No action required from an injury perspective.`
  } else if (isSuspended) {
    verdictLabel = "SUSPENDED"
    verdict = `${displayName} is suspended and unavailable for Gameweek ${gw}.`
    bullets = [
      news ? `FPL news: ${news}` : `${displayName} is serving a suspension for GW${gw}`,
      `Suspension typically clears after one gameweek — check official FPL for the exact ban length`,
      `Consider one of the alternatives below while they serve the ban`,
    ]
    context = `Suspensions are short-term. If ${displayName} is central to your team, holding is usually the right call unless the alternatives below represent a clear upgrade.`
  } else if (isUnavailable) {
    verdictLabel = "INJURED"
    verdict = `${displayName} is currently unavailable for Gameweek ${gw} with a ${chance}% chance of playing.`
    bullets = [
      news ? `FPL news: ${news}` : `${displayName} has a ${chance}% chance of playing in GW${gw}`,
      `${minutes} minutes this season — a significant loss if they are a regular starter`,
      `Monitor official club and FPL news ahead of the GW${gw} deadline`,
    ]
    context = `With a ${chance}% chance of playing, selecting ${displayName} this week carries real risk. The alternatives below are the best available options at a similar price point.`
  } else {
    verdictLabel = chance >= 75 ? "FITNESS CONCERN" : "INJURY DOUBT"
    verdict = `${displayName} is a ${chance >= 75 ? "fitness concern" : "significant doubt"} for Gameweek ${gw} — ${chance}% chance of playing.`
    bullets = [
      news ? `FPL news: ${news}` : `${displayName} has a ${chance}% chance of playing`,
      chance >= 75
        ? `A ${chance}% chance is worth risking if you are short on budget for alternatives`
        : `A ${chance}% chance is a significant risk — having a cover option is advisable`,
      `Check for updates in the 24 hours before the GW${gw} deadline`,
    ]
    context = `${displayName} has a ${chance}% chance of playing. ${
      chance >= 75
        ? "The data suggests they are likely to feature, but the risk is real."
        : "At this probability, the data points towards having an alternative ready."
    } Factor in their fixture and form before deciding.`
  }

  return { verdictLabel, verdict, bullets, context }
}

// ─── Alternative player box ───────────────────────────────────────────────────

function AltBox({ player }: { player: InjuryPlayer }) {
  return (
    <div
      className="rounded-2xl px-4 py-5 flex flex-col items-center gap-2 text-center"
      style={{ border: "1px solid rgba(0,255,135,0.18)", background: "rgba(0,255,135,0.03)" }}
    >
      <div className="flex flex-col items-center">
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
          alt={player.displayName} width={80} height={102}
          style={{ objectFit: "contain", display: "block" }} unoptimized
        />
        <div style={{
          height: 1, width: 80,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
          boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
        }} />
      </div>
      <div className="flex items-center gap-1.5 justify-center">
        <p className="text-sm font-bold text-white leading-tight">{player.displayName}</p>
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
          alt={player.club} width={16} height={16}
          style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
        />
      </div>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{player.price} · {player.position}</p>
      <p
        className="text-lg font-bold text-transparent bg-clip-text"
        style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
      >
        {player.epNext.toFixed(1)}
        <span className="text-[9px] text-white/40 font-normal ml-1 uppercase tracking-wide">xPts</span>
      </p>
      <Link
        href={`/fpl/${player.slug}`}
        className="mt-1 whitespace-nowrap text-[11px] font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
        style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "5px 14px" }}
      >
        Full analysis
      </Link>
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
  const { verdictLabel, verdict, bullets, context } = buildVerdict(player, gw)

  // Build 5-card showcase: alt0 | alt1 | PLAYER | alt2 | alt3
  const pad = alternatives[0] ?? toCard(player) as unknown as InjuryPlayer
  const showcasePlayers: FplCardPlayer[] = [
    toCard(alternatives[0] ?? pad),
    toCard(alternatives[1] ?? pad),
    toCard(player),
    toCard(alternatives[2] ?? pad),
    toCard(alternatives[3] ?? pad),
  ]

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      <DevHeader />

      <FplPlayerHero
        h1White={`Is ${player.displayName} fit for `}
        h1Gradient={`Gameweek ${gw} in Fantasy Premier League?`}
        subtitle={`GW${gw} · ${player.club} · ${player.position} · ${player.price}`}
        players={showcasePlayers}
        badgeLabel="Injury Update"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Status",      value: statusLabel(player.status, player.chance) },
              { label: "Play Chance", value: isAvailable ? "100%" : `${player.chance}%` },
              { label: "Price",       value: player.price },
              { label: "Minutes",     value: `${player.minutes}` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center"
              >
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-1">{s.label}</p>
                <p
                  className="text-2xl font-bold text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Verdict panel */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div
            className="rounded-2xl px-6 py-6"
            style={{
              border: "1px solid rgba(0,255,135,0.25)",
              background: "rgba(0,255,135,0.04)",
              borderLeft: "4px solid #00FF87",
            }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
              >
                {verdictLabel}
              </span>
              <p className="text-white font-semibold text-base leading-snug">{verdict}</p>
            </div>

            {/* FPL news with orb */}
            {player.news && (
              <div className="flex items-center gap-2 mb-4 rounded-xl px-4 py-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: "#00FF87", boxShadow: "0 0 6px 3px rgba(0,255,135,0.5)",
                }} />
                <p className="text-sm text-white leading-relaxed">{player.news}</p>
              </div>
            )}

            <ul className="space-y-2 mb-4">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#00FF87" }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <p className="text-sm text-white/60 leading-relaxed">{context}</p>

            <p className="mt-4 text-[11px] text-white/30 italic">
              This page presents the statistics. The decision is yours. For a recommendation based on your specific squad, budget, and remaining gameweeks, ask ChatFPL AI directly.
            </p>
          </div>
        </div>

        {/* Alternatives */}
        {!isAvailable && alternatives.length > 0 && (
          <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
            <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
              <span className="text-white">{player.webName} Injury — FPL Alternatives for </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Gameweek {gw}
              </span>
            </h2>
            <p className="text-white/50 text-sm mb-6">Fit replacements at a similar price point, ranked by expected points.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {alternatives.map((alt) => (
                <AltBox key={alt.slug} player={alt} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-6 text-center">
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              border: "1px solid rgba(0,255,135,0.18)",
              borderLeft: "4px solid #00FF87",
              background: "rgba(0,255,135,0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">
              Get a personalised verdict on {player.displayName} for your squad
            </h3>
            <p className="text-sm text-white/70 mb-7">Get 20 free messages. No credit card required.</p>
            <Link
              href="/chat"
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
              Ask ChatFPL AI for free
            </Link>
          </div>
        </div>

        {/* Back to hub */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-10 text-center">
          <div
            className="inline-block"
            style={{
              padding: "1.5px", borderRadius: "9999px",
              background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
              backgroundSize: "200% 200%", animation: "glow_scroll 3.5s linear infinite",
            }}
          >
            <Link
              href="/fpl/injuries"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                All GW{gw} injury news
              </span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
