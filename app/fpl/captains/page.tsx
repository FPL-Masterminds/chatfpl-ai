import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { getCaptainHub, isSeasonOver, type CaptainHubPlayer } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

export const revalidate = 3600
export const dynamic = "force-dynamic"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Captain Picks | ChatFPL AI" }
  const data = await getCaptainHub()
  const gw = data?.gw ?? "?"
  return {
    title: `Best FPL Captain Picks Gameweek ${gw} | ChatFPL AI`,
    description: `The top FPL captain options for Gameweek ${gw}, ranked by expected points. Live form, fixture difficulty and ownership data for every pick.`,
    openGraph: {
      title: `Best FPL Captain Picks Gameweek ${gw} | ChatFPL AI`,
      description: `Top FPL captain options for GW${gw} ranked by expected points, form and fixture.`,
      url: "https://www.chatfpl.ai/fpl/captains",
    },
  }
}

// ─── FDR colour (green only, 5 shades) ────────────────────────────────────────

function fdrDot(fdr: number | null) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: i <= fdr ? "#00FF87" : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </span>
  )
}

// ─── Single player card ────────────────────────────────────────────────────────

function CaptainCard({ player, rank }: { player: CaptainHubPlayer; rank: number }) {
  const isDoubt = player.chance < 75 && player.chance > 0
  const GREEN = "#00FF87"

  return (
    <Link
      href={`/fpl/${player.slug}`}
      className="group block rounded-2xl transition-all hover:scale-[1.01]"
      style={{
        border: "1px solid rgba(0,255,135,0.18)",
        background: "rgba(0,255,135,0.03)",
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Rank */}
        <div className="shrink-0 w-7 text-center">
          <span
            className="text-lg font-black"
            style={{ color: rank === 1 ? GREEN : "rgba(255,255,255,0.3)" }}
          >
            {rank}
          </span>
        </div>

        {/* Photo */}
        <div className="shrink-0 flex flex-col items-center" style={{ width: 52 }}>
          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
            alt={player.displayName}
            width={52}
            height={65}
            style={{ objectFit: "contain" }}
            unoptimized
          />
          <div
            style={{
              height: 1,
              width: 52,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }}
          />
        </div>

        {/* Name + club */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate group-hover:text-[#00FF87] transition-colors">
            {player.displayName}
          </p>
          <p className="text-[11px] text-white/50 mt-0.5">
            {player.position} · {player.club} · {player.price}
          </p>
          {isDoubt && (
            <p className="text-[10px] mt-0.5" style={{ color: "#FFB347" }}>
              {player.news || `${player.chance}% fit`}
            </p>
          )}
        </div>

        {/* Stats — fixed width columns so values align vertically */}
        <div className="hidden sm:flex items-center shrink-0">
          <div className="w-14 text-center">
            <p className="text-base font-bold tabular-nums" style={{ color: GREEN }}>
              {player.ep_next.toFixed(1)}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">xPts</p>
          </div>
          <div className="w-14 text-center">
            <p className="text-base font-bold tabular-nums text-white/80">{player.form}</p>
            <p className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">Form</p>
          </div>
          <div className="w-14 text-center">
            <p className="text-base font-bold tabular-nums text-white/80">{player.ownership}%</p>
            <p className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">Owned</p>
          </div>
          <div className="w-14 text-center">
            <div className="flex justify-center">{fdrDot(player.fdrNext)}</div>
            <p className="text-[9px] uppercase tracking-wider text-white/50 mt-1">FDR</p>
          </div>
        </div>

        {/* Mobile stat — xPts only */}
        <div className="flex sm:hidden flex-col items-end shrink-0">
          <p className="text-base font-bold tabular-nums" style={{ color: GREEN }}>
            {player.ep_next.toFixed(1)}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-white/50">xPts</p>
        </div>

        {/* Arrow */}
        <svg
          className="hidden sm:block shrink-0 h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CaptainsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const data = await getCaptainHub()
  if (!data) notFound()

  const { gw, players } = data
  const GREEN = "#00FF87"

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        {/* Badge */}
        <span
          className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: "rgba(0,255,135,0.08)",
            border: "1px solid rgba(0,255,135,0.25)",
            color: GREEN,
          }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black text-black"
            style={{ background: GREEN }}
          >
            FPL
          </span>
          Captain Analysis
        </span>

        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(26px, 5vw, 52px)", maxWidth: 820 }}
        >
          <span className="text-white">The Best FPL Captain Picks for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
              WebkitBackgroundClip: "text",
            }}
          >
            Gameweek {gw}
          </span>
        </h1>

        <p className="text-white/60 text-base max-w-xl">
          Ranked by expected points. Click any player for the full captaincy verdict, fixture analysis, and AI chat.
        </p>
      </section>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl">

          {/* Column headers — desktop only */}
          <div className="hidden sm:flex items-center gap-4 px-5 mb-2 text-[9px] uppercase tracking-[0.15em] text-white/40">
            <div className="w-7 shrink-0" />
            <div className="shrink-0" style={{ width: 52 }} />
            <div className="flex-1">Player</div>
            <div className="flex shrink-0">
              <span className="w-14 text-center">xPts</span>
              <span className="w-14 text-center">Form</span>
              <span className="w-14 text-center">Owned</span>
              <span className="w-14 text-center">FDR</span>
            </div>
            <div className="w-4 shrink-0" />
          </div>

          {/* Player cards */}
          <div className="flex flex-col gap-3">
            {players.map((player, i) => (
              <CaptainCard key={player.slug} player={player} rank={i + 1} />
            ))}
          </div>

          {/* Explainer note */}
          <p className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
            Rankings based on FPL expected points for GW{gw}. Excludes goalkeepers and players ruled out. Updated hourly.
          </p>

          {/* Divider */}
          <div
            className="my-10 h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }}
          />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{
              border: "1px solid rgba(0,255,135,0.18)",
              borderLeft: "4px solid #00FF87",
              background: "rgba(0,255,135,0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Still not sure who to captain?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, budget, and rivals to give you a personalised captain recommendation. 20 free messages — no credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
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
