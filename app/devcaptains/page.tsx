import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getCaptainHub, type CaptainHubPlayer } from "@/lib/fpl-player-page"
import { DevHeader } from "@/components/dev-header"

export const dynamic = "force-dynamic"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"
const GREEN = "#00FF87"

const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

function FdrDots({ fdr }: { fdr: number | null }) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
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
  return (
    <span className="text-xs font-semibold text-white/70">
      {FDR_LABELS[fdr] ?? fdr}
    </span>
  )
}

function VerdictPill({ player }: { player: CaptainHubPlayer }) {
  const isDoubt = player.chance < 75 && player.chance > 0
  const isOut   = player.chance === 0
  if (isOut)   return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/50 border border-white/10">Ruled out</span>
  if (isDoubt) return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">{player.chance}% fit</span>
  return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30" style={{ color: GREEN }}>Available</span>
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, rank }: { player: CaptainHubPlayer; rank: number }) {
  const stats = [
    { label: "xPts",      value: player.ep_next.toFixed(1) },
    { label: "Form",      value: player.form },
    { label: "Owned",     value: `${player.ownership}%` },
    { label: "Price",     value: player.price },
  ]

  return (
    <div style={{
      background: "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
    }}>
      <div className="flex flex-row">

        {/* Left — photo strip */}
        <div className="relative shrink-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ width: 160, minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 0" }}
        >
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center justify-center rounded"
            style={{ width: 24, height: 24, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.25)" }}
          >
            <span className="text-[11px] font-bold tabular-nums text-white">{rank}</span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
              alt={player.displayName}
              width={100} height={126}
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <div style={{
              width: "80%", height: 1, marginTop: 2,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Right — data */}
        <div className="flex-1 flex flex-col justify-between p-4 gap-3">

          {/* Row 1: name + verdict + price */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-white font-semibold truncate" style={{ fontSize: 18 }}>{player.displayName}</h2>
              <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>{player.club}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VerdictPill player={player} />
              <span className="font-bold text-white" style={{ fontSize: 20 }}>{player.price}</span>
            </div>
          </div>

          {/* Row 2: stats */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "8px 10px" }}>
                <p className="font-bold tabular-nums" style={{ fontSize: 16, color: GREEN }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#A0A0A0", marginTop: 1 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Row 3: FDR + news + CTA */}
          <div className="flex items-center justify-between gap-3" style={{
            padding: "8px 12px", background: "#1A1A1A", borderRadius: 4,
          }}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, color: "#A0A0A0" }}>FDR:</span>
                <FdrDots fdr={player.fdrNext} />
                <FdrLabel fdr={player.fdrNext} />
              </div>
              {player.news && (
                <span className="text-white/50 text-xs truncate max-w-xs">{player.news}</span>
              )}
            </div>
            <Link
              href={`/fpl/${player.slug}`}
              className="shrink-0 font-semibold transition-opacity hover:opacity-80 text-xs"
              style={{
                background: GREEN, color: "#000000",
                borderRadius: 4, padding: "7px 16px", fontWeight: 600,
              }}
            >
              Full analysis →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DevCaptainsPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== ALLOWED_EMAIL) redirect("/login")

  const data = await getCaptainHub()
  const gw      = data?.gw ?? "?"
  const players = data?.players ?? []

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      {/* Background glow — matches live page */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
      }} />

      {/* Hero — identical to live captains page */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(26px, 5vw, 52px)", maxWidth: 820 }}
        >
          <span className="text-white">The Best FPL Captain Picks for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
          >
            Gameweek {gw}
          </span>
        </h1>
        <p className="text-white/60 text-base max-w-xl">
          Ranked by expected points. Click any player for the full captaincy verdict, fixture analysis, and AI chat.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            Dev preview
          </span>
          <Link href="/fpl/captains" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            View live page →
          </Link>
        </div>
      </section>

      {/* Cards */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {players.map((player, i) => (
            <PlayerCard key={player.slug} player={player} rank={i + 1} />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/fpl/captains"
            className="transition-colors hover:text-white text-sm font-medium"
            style={{ border: `1px solid ${GREEN}`, color: GREEN, borderRadius: 4, padding: "10px 28px", background: "transparent" }}
          >
            View live Captains Hub
          </Link>
        </div>
      </main>
    </div>
  )
}
