import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"
import { HubHero } from "@/components/hub-hero"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import {
  getFixtureHub,
  buildFixtureHubText,
  type FixtureHubPlayer,
  type FixtureGW,
} from "@/lib/fpl-fixtures"

export const revalidate = 3600
export const dynamic = "force-dynamic"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Fixture Difficulty | ChatFPL AI" }
  const data = await getFixtureHub()
  const gw = data?.gw ?? "?"
  return {
    title: `FPL Fixture Difficulty Gameweek ${gw} | Best Schedules | ChatFPL AI`,
    description: `Which FPL players have the best fixture run for Gameweek ${gw} and beyond? Live fixture difficulty ratings, five-game schedules, and AI projections for every eligible player.`,
    openGraph: {
      title: `FPL Fixture Difficulty Gameweek ${gw} | ChatFPL AI`,
      description: `Best FPL fixture schedules for GW${gw}. Sorted by upcoming difficulty rating with five-game previews.`,
      url: "https://www.chatfpl.ai/fpl/fixtures",
    },
  }
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const GREEN = "#00FF87"

// ─── FDR dots — identical to captains page pattern ───────────────────────────
// fdr green dots filled, remainder faint grey

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 7,
            height: 7,
            background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </span>
  )
}

// ─── Fixture card — rich card with crest + FDR dots ──────────────────────────

function FixtureCard({ fix }: { fix: FixtureGW }) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 10px",
        minWidth: 56,
      }}
    >
      <span className="text-[9px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>
        GW{fix.gw}
      </span>
      {fix.opponentCode > 0 && (
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${fix.opponentCode}.png`}
          alt={fix.opponentShort}
          width={24} height={24}
          style={{ objectFit: "contain" }}
          unoptimized
        />
      )}
      <span className="text-[10px] font-bold text-white leading-none">{fix.opponentShort}</span>
      <span
        className="text-[9px] font-semibold leading-none"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {fix.isHome ? "H" : "A"}
      </span>
      <FdrDots fdr={fix.fdr} />
    </div>
  )
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "Favourable") {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black"
        style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
      >
        Favourable
      </span>
    )
  }
  if (verdict === "Mixed") {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
        style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
      >
        Mixed
      </span>
    )
  }
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
    >
      Challenging
    </span>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  player, rank, even, gw, text,
}: {
  player: FixtureHubPlayer
  rank: number
  even: boolean
  gw: number | string
  text: string
}) {
  // Full number with comma separator — no abbreviated decimals
  const transfersLabel = player.transfersIn.toLocaleString("en-GB")

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.18) 0%, rgba(0,255,135,0.07) 45%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Gradient top line */}
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6 }} />

      <div className="flex flex-row">

        {/* Left — photo strip */}
        <div
          className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <HubPlayerPhoto
              code={player.code}
              name={player.displayName}
              width={160}
              height={204}
              className="w-14 sm:w-[160px]"
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

          {/* Row 1: name + badge + price */}
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
            <div className="flex items-center gap-2 shrink-0">
              <VerdictBadge verdict={player.verdictLabel} />
              <span className="font-bold text-white text-base sm:text-xl">{player.price}</span>
            </div>
          </div>

          {/* Row 2: stats — full transfer number, no abbreviated decimals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { label: player.ep_next === 0 ? "xPts (Blank GW)" : "xPts", value: player.ep_next === 0 ? "0.0" : player.ep_next.toFixed(1) },
              { label: "Form",         value: player.form },
              { label: "Owned",        value: `${player.ownership}%` },
              { label: "Transfers In", value: transfersLabel },
            ].map((s) => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base" style={{ color: GREEN }}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Row 3: fixture run — rich cards with crest + FDR dots */}
          <div style={{ background: "#1A1A1A", borderRadius: 4, padding: "8px 10px" }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold text-white">
                {player.ep_next === 0
                  ? `Fixture run from GW${player.fixtures[0]?.gw ?? "next"} (Blank GW${gw})`
                  : "Next 5 fixtures"}
              </span>
              <Link
                href={`/fpl/fixtures/${player.slug}`}
                className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "5px 12px" }}
              >
                Full analysis
              </Link>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {player.fixtures.slice(0, 5).map((fix) => (
                <FixtureCard key={fix.gw} fix={fix} />
              ))}
              {player.fixtures.length === 0 && (
                <span className="text-[10px] text-white/40 py-2">No upcoming fixtures available</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Expandable analysis */}
      <div className="border-t px-4 py-3" style={{ borderColor: "rgba(0,255,135,0.18)" }}>
        <HubCardExpand
          slug={player.slug}
          gw={gw}
          text={text}
          promptLabel={`${player.displayName} fixture run - Gameweek ${gw}`}
        />
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FixtureHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const data = await getFixtureHub()
  if (!data) notFound()

  const { gw, players } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Fixture Difficulty "
        headingGradient={`Gameweek ${gw}`}
        subtitle="Sorted by upcoming schedule rating. Click any player for the full five-game fixture breakdown and AI projections."
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">

          {/* FDR key — green dots out of 5, matching captains page style */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3"
            style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)" }}
          >
            <span className="text-[10px] uppercase tracking-widest text-white/50">Fixture Rating:</span>
            {[
              { fdr: 1, label: "Very Easy" },
              { fdr: 2, label: "Easy" },
              { fdr: 3, label: "Medium" },
              { fdr: 4, label: "Hard" },
              { fdr: 5, label: "Very Hard" },
            ].map(({ fdr, label }) => (
              <div key={fdr} className="flex items-center gap-1.5">
                <FdrDots fdr={fdr} />
                <span className="text-[10px] text-white">{label}</span>
              </div>
            ))}
          </div>

          {players.map((player, i) => (
            <Reveal key={player.slug} delay={i * 0.06}>
              <PlayerCard
                player={player}
                rank={i + 1}
                even={(i + 1) % 2 === 0}
                gw={gw}
                text={buildFixtureHubText(player, gw, i + 1)}
              />
            </Reveal>
          ))}

          <p className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
            Sorted by average fixture difficulty rating over the next five gameweeks. Players ranked by schedule then expected points. Updated hourly.
          </p>

          {/* Divider */}
          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Which fixtures suit your specific squad?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI cross-references upcoming fixtures with your squad, budget, and rank target to give you a personalised hold, sell, or buy verdict. Try it free - no credit card required.
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
