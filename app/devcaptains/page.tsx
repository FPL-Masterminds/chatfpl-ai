import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getCaptainHub, type CaptainHubPlayer } from "@/lib/fpl-player-page"
import { DevHeader } from "@/components/dev-header"

export const dynamic = "force-dynamic"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"
const GREEN = "#00FF87"

// ─── FDR label ────────────────────────────────────────────────────────────────

function FdrBar({ fdr }: { fdr: number | null }) {
  if (fdr === null) return <span className="text-white/30 text-sm">-</span>
  const labels = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]
  const colours = ["", "#00FF87", "#a3e635", "#facc15", "#f97316", "#ef4444"]
  return (
    <span className="text-sm font-semibold" style={{ color: colours[fdr] ?? GREEN }}>
      {labels[fdr] ?? fdr}
    </span>
  )
}

// ─── Difficulty stars ──────────────────────────────────────────────────────────

function FdrDots({ fdr }: { fdr: number | null }) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className="block rounded-full" style={{
          width: 7, height: 7,
          background: i <= fdr ? (fdr <= 2 ? GREEN : fdr === 3 ? "#facc15" : "#ef4444") : "rgba(255,255,255,0.12)"
        }} />
      ))}
    </span>
  )
}

// ─── Verdict pill ─────────────────────────────────────────────────────────────

function VerdictPill({ player }: { player: CaptainHubPlayer }) {
  const isDoubt = player.chance < 75 && player.chance > 0
  const isOut   = player.chance === 0
  if (isOut)   return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">Ruled out</span>
  if (isDoubt) return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">{player.chance}% fit</span>
  return <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30" style={{ color: GREEN }}>Available</span>
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, rank }: { player: CaptainHubPlayer; rank: number }) {
  const stats = [
    { label: "xPts GW",   value: player.ep_next.toFixed(1) },
    { label: "Form",      value: player.form },
    { label: "Ownership", value: `${player.ownership}%` },
    { label: "Price",     value: player.price },
  ]

  return (
    <div style={{
      background: "#111111",
      border: "1px solid #222222",
      borderRadius: 8,
    }}>
      <div className="flex flex-row">

        {/* Left — photo */}
        <div className="relative shrink-0 flex flex-col items-center justify-end overflow-hidden"
          style={{ width: 180, minHeight: 180, background: "#0a0a0a", borderRadius: "8px 0 0 8px" }}
        >
          {/* Rank badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center justify-center rounded"
            style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "1px solid #333" }}
          >
            <span className="text-xs font-bold tabular-nums text-white">{rank}</span>
          </div>

          {/* Position badge */}
          <div className="absolute top-3 right-3 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>

          <Image
            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
            alt={player.displayName}
            width={110} height={140}
            style={{ objectFit: "contain", maxHeight: 160 }}
            unoptimized
          />
          {/* Glow line */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          }} />
        </div>

        {/* Right — data */}
        <div className="flex-1 flex flex-col p-6 gap-4">

          {/* Top row: name + price + verdict */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-white font-semibold" style={{ fontSize: 22 }}>{player.displayName}</h2>
              <p className="text-sm mt-0.5" style={{ color: "#A0A0A0" }}>{player.club}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="font-bold" style={{ fontSize: 26, color: "#ffffff" }}>{player.price}</span>
              <VerdictPill player={player} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3" style={{ marginTop: 4 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                background: "#1A1A1A", borderRadius: 4, padding: "10px 12px"
              }}>
                <p className="font-bold tabular-nums" style={{ fontSize: 18, color: GREEN }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "#A0A0A0", marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Details bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2" style={{
            marginTop: 4, padding: "12px 16px",
            background: "#1A1A1A", borderRadius: 4,
          }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: "#A0A0A0" }}>Next fixture difficulty:</span>
              <FdrDots fdr={player.fdrNext} />
              <FdrBar fdr={player.fdrNext} />
            </div>
            {player.news && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, color: "#A0A0A0" }}>News:</span>
                <span className="text-amber-400 text-sm">{player.news}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-end" style={{ marginTop: 4 }}>
            <Link
              href={`/fpl/${player.slug}`}
              className="font-semibold transition-opacity hover:opacity-80"
              style={{
                background: GREEN,
                color: "#000000",
                borderRadius: 4,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Full captain analysis →
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
  const gw   = data?.gw ?? "?"
  const players = data?.players ?? []

  return (
    <div style={{ minHeight: "100vh", background: "#000000" }}>
      <DevHeader />

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 40px 80px" }}>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-semibold text-white" style={{ fontSize: 28 }}>
              GW{gw} Captain Picks
            </h1>
            <p style={{ color: "#A0A0A0", fontSize: 14, marginTop: 4 }}>
              Top {players.length} options ranked by expected points. Live FPL data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
            >
              Dev preview
            </div>
            <Link href="/fpl/captains" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              View live page →
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-6">
          {players.map((player, i) => (
            <PlayerCard key={player.slug} player={player} rank={i + 1} />
          ))}
        </div>

        {/* Load more style footer note */}
        <div className="flex justify-center mt-10">
          <Link
            href="/fpl/captains"
            className="transition-colors hover:text-white text-sm font-medium"
            style={{
              border: `1px solid ${GREEN}`,
              color: GREEN,
              borderRadius: 4,
              padding: "10px 28px",
              background: "transparent",
            }}
          >
            View live Captains Hub
          </Link>
        </div>

      </div>
    </div>
  )
}
