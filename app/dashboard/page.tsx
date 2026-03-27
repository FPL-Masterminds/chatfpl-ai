"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, LineChart,
} from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Fixture { opponent: string; home: boolean; difficulty: number; event: number }

interface SquadPlayer {
  slot: number; is_captain: boolean; is_vice_captain: boolean; multiplier: number
  name: string; team_short: string; team_code: number; team_id: number; pos: string
  price: number; cost_change_event: number; cost_change_start: number
  transfers_in_gw: number; transfers_out_gw: number
  form: number; points: number; ep_next: number
  chance: number; news: string; photo_url: string
  next_fixtures: Fixture[]
}

interface Transfer {
  event: number
  in_name: string; in_pos: string; in_price: number; in_team_code: number; in_team_short: string
  out_name: string; out_pos: string; out_price: number; out_team_code: number; out_team_short: string
}

interface LeagueRow {
  rank: number; last_rank: number; manager: string; team: string
  entry_id: number; gw_pts: number; total: number; is_user: boolean
}

interface GWPoint { gw: number; pts: number; avg: number; rank: number; total_pts: number }
interface ChipStatus { name: string; key: string; available: boolean; event: number | null }

interface DashboardData {
  team_name: string; manager_name: string; overall_points: number; overall_rank: number
  gw_points: number; gw_rank: number | null; team_value: number; bank: number
  total_transfers: number; gw_transfers: number; gw_transfer_cost: number; points_on_bench: number
  current_gw: number; current_gw_name: string; active_chip: string | null
  chips: ChipStatus[]; squad: SquadPlayer[]; gw_history: GWPoint[]
  recent_transfers: Transfer[]
  league_name: string | null; league_standings: LeagueRow[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHIP_ICONS: Record<string, string> = { wildcard: "♻", freehit: "🎯", "3xc": "3×", bboost: "🚀" }
const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }

const DIFF_COLORS: Record<number, string> = {
  1: "#00FF87", 2: "#86efac", 3: "#fde68a", 4: "#fb923c", 5: "#ef4444",
}

const POS_STYLE: Record<string, { border: string; glow: string; label: string }> = {
  GKP: { border: "#f59e0b", glow: "rgba(245,158,11,0.18)", label: "#fcd34d" },
  DEF: { border: "#3b82f6", glow: "rgba(59,130,246,0.18)", label: "#93c5fd" },
  MID: { border: "#00FF87", glow: "rgba(0,255,135,0.18)", label: "#00FF87" },
  FWD: { border: "#f97316", glow: "rgba(249,115,22,0.18)", label: "#fdba74" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("en-GB") }

function useCountUp(target: number, trigger: boolean, duration = 1400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger || !target) return
    let cur = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      cur += step
      if (cur >= target) { setVal(target); clearInterval(id) }
      else setVal(Math.floor(cur))
    }, 16)
    return () => clearInterval(id)
  }, [target, trigger, duration])
  return val
}

function BadgeImg({ code, name }: { code: number; name: string }) {
  const [ok, setOk] = useState(true)
  if (!code || !ok) return <span className="text-[9px] text-white/40">{name.slice(0, 3)}</span>
  return (
    <img src={`https://resources.premierleague.com/premierleague/badges/70/t${code}.png`}
      alt={name} className="h-4 w-4 object-contain shrink-0" onError={() => setOk(false)} />
  )
}

function RankArrow({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (!lastRank || rank === lastRank) return <span className="text-white/20 text-[10px]">–</span>
  if (rank < lastRank) return <span className="text-emerald-400 text-[10px]">▲</span>
  return <span className="text-red-400 text-[10px]">▼</span>
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/40">GW{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function RankTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/40">GW{label}</p>
      <p className="text-purple-300 font-semibold">Rank: {fmt(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = "#00FF87", delay = 0, loaded, raw }: {
  label: string; value: number; sub?: string; accent?: string
  delay?: number; loaded: boolean; raw?: string
}) {
  const displayed = useCountUp(value, loaded, 1400)
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 flex flex-col gap-1 hover:scale-[1.02] transition-all duration-300 hover:border-white/15"
      style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms` }}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="text-3xl font-bold" style={{ color: accent }}>{raw ?? fmt(displayed)}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  )
}

// ─── Season Heatmap ───────────────────────────────────────────────────────────

function HeatmapCell({ pts, avg }: { pts: number; avg: number }) {
  const ratio = avg > 0 ? pts / avg : 0
  let bg = "#1a1a2e"
  if (pts === 0) bg = "#1a1a1a"
  else if (ratio >= 1.5) bg = "#00FF87"
  else if (ratio >= 1.15) bg = "#34d399"
  else if (ratio >= 0.85) bg = "#fbbf24"
  else if (ratio >= 0.5) bg = "#f97316"
  else bg = "#ef4444"
  return (
    <div className="relative group flex items-center justify-center rounded text-[9px] font-bold text-black/70 h-7 w-7 cursor-default"
      style={{ backgroundColor: bg, boxShadow: ratio >= 1.5 ? "0 0 8px rgba(0,255,135,0.4)" : "none" }}>
      {pts}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap z-10 border border-white/10">
        Avg: {avg}
      </span>
    </div>
  )
}

// ─── Player Card ─────────────────────────────────────────────────────────────

function PlayerCard({ p, bench }: { p: SquadPlayer; bench: boolean }) {
  const [photoOk, setPhotoOk] = useState(true)
  const pos = POS_STYLE[p.pos] ?? POS_STYLE.MID
  const injured = p.chance < 75
  const priceUp = p.cost_change_event > 0
  const priceDown = p.cost_change_event < 0
  const isCap = p.is_captain
  const isVC = p.is_vice_captain

  return (
    <div className="flex flex-col gap-1">
      {/* ── Card ── */}
      <div
        className="relative rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:scale-[1.05] hover:z-10 cursor-default"
        style={{
          background: bench
            ? "rgba(255,255,255,0.025)"
            : `linear-gradient(160deg, ${pos.glow} 0%, rgba(10,10,15,0.95) 60%)`,
          border: injured
            ? "1px solid rgba(239,68,68,0.5)"
            : isCap
              ? `1px solid rgba(0,255,135,0.5)`
              : `1px solid ${pos.border}22`,
          boxShadow: isCap
            ? "0 0 20px rgba(0,255,135,0.15), inset 0 0 20px rgba(0,255,135,0.03)"
            : bench ? "none" : `0 4px 20px ${pos.glow}`,
        }}
      >
        {/* Position stripe at top */}
        <div className="h-[3px] w-full shrink-0" style={{ background: bench ? "rgba(255,255,255,0.08)" : pos.border, opacity: bench ? 1 : 0.8 }} />

        {/* Badges row */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between z-20 pointer-events-none">
          {/* Team badge */}
          <BadgeImg code={p.team_code} name={p.team_short} />
          {/* Captain / VC / Injured */}
          {isCap && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-black shadow-[0_0_8px_rgba(0,255,135,0.6)]">C</span>
          )}
          {isVC && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-black">V</span>
          )}
          {injured && !isCap && !isVC && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">!</span>
          )}
        </div>

        {/* Photo area */}
        <div className="relative w-full" style={{ height: "88px" }}>
          {photoOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo_url}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: bench ? "brightness(0.65) saturate(0.6)" : "brightness(0.92) saturate(1.05)" }}
              onError={() => setPhotoOk(false)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-white/20">{p.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          {/* Bottom gradient fade into card */}
          <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(6,6,10,0.98))" }} />
        </div>

        {/* Info */}
        <div className="px-1.5 pb-1.5 -mt-1">
          <p className="text-[10px] font-bold text-white truncate leading-tight">{p.name}</p>
          <div className="flex items-center justify-between mt-0.5 gap-0.5">
            <span className="text-[8px] font-semibold" style={{ color: bench ? "rgba(255,255,255,0.3)" : pos.label }}>{p.pos}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] text-white/50">£{p.price.toFixed(1)}m</span>
              {priceUp && <span className="text-[7px] font-bold text-emerald-400">▲</span>}
              {priceDown && <span className="text-[7px] font-bold text-red-400">▼</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] font-semibold text-white/70">{p.points}<span className="text-white/30 font-normal">pts</span></span>
            {p.ep_next > 0 && (
              <span className="text-[7px] text-emerald-400/80">xP {p.ep_next.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Fixture pills — sit below the card */}
      {p.next_fixtures.length > 0 && (
        <div className="flex gap-0.5 justify-center flex-wrap">
          {p.next_fixtures.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none"
              style={{ color: "#000", backgroundColor: DIFF_COLORS[f.difficulty] ?? "#888" }}
            >
              {f.opponent}{!f.home ? "(A)" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Gate Screen ─────────────────────────────────────────────────────────────

function GateScreen({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,200,0.10),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(122,92,255,0.10),transparent_40%)]" />
      <div className="relative max-w-sm text-center space-y-5">
        <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL" width={120} height={34} className="mx-auto h-8 w-auto opacity-70" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-white/50 leading-relaxed">{body}</p>
        <div className="flex flex-col gap-3">
          <Link href={href} className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110 transition-all">{cta}</Link>
          <Link href="/devchat" className="text-sm text-white/40 hover:text-white transition-colors">Back to chat</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<"loading" | "upgrade" | "no_team" | "error" | "ready">("loading")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const accountRes = await fetch("/api/account")
        if (!accountRes.ok) { router.replace("/login"); return }
        const res = await fetch("/api/dashboard")
        if (res.status === 403) { setStatus("upgrade"); return }
        if (res.status === 400) { setStatus("no_team"); return }
        if (!res.ok) { setStatus("error"); return }
        setData(await res.json())
        setStatus("ready")
        setTimeout(() => setLoaded(true), 120)
      } catch { setStatus("error") }
    }
    load()
  }, [router])

  if (status === "loading") return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400" />
        </div>
        <p className="text-white/40 text-sm">Loading your FPL dashboard...</p>
      </div>
    </div>
  )

  if (status === "upgrade") return <GateScreen title="Premium Feature" body="The FPL Dashboard is available on Premium and above. Upgrade to unlock live squad analytics, rank tracking, and mini-league standings." cta="View Plans" href="/pricing" />
  if (status === "no_team") return <GateScreen title="Link Your FPL Team" body="To use the dashboard, save your public FPL Team ID in account settings. It takes 10 seconds." cta="Go to Settings" href="/admin" />
  if (status === "error" || !data) return <GateScreen title="Something went wrong" body="We couldn't load your FPL data. The FPL API may be temporarily unavailable — try again in a moment." cta="Retry" href="/dashboard" />

  const starters = data.squad.filter((p) => p.slot <= 11).sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos])
  const bench = data.squad.filter((p) => p.slot > 11).sort((a, b) => a.slot - b.slot)

  // Group transfers by GW
  const transfersByGW: Record<number, Transfer[]> = {}
  data.recent_transfers.forEach((t) => {
    if (!transfersByGW[t.event]) transfersByGW[t.event] = []
    transfersByGW[t.event].push(t)
  })
  const transferGWs = Object.keys(transfersByGW).map(Number).sort((a, b) => b - a)

  // Rank chart data — invert so higher on chart = better rank
  const rankData = data.gw_history.filter((g) => g.rank > 0)

  const fade = (delay: number) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,200,0.09),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(122,92,255,0.09),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between" style={fade(0)}>
          <div className="flex items-center gap-4">
            <Link href="/devchat" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Chat
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL" width={100} height={28} className="h-6 w-auto" />
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-white">{data.team_name}</p>
            <p className="text-xs text-white/40">{data.manager_name} · {data.current_gw_name}</p>
          </div>
        </div>

        {/* ── 4 Stat Tiles ── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="GW Points" value={data.gw_points} sub={data.gw_rank ? `Rank: ${fmt(data.gw_rank)}` : undefined} accent="#00FF87" delay={0} loaded={loaded} />
          <StatCard label="Overall Points" value={data.overall_points} sub={data.active_chip ? `${data.active_chip} active` : undefined} accent="#22d3ee" delay={80} loaded={loaded} />
          <StatCard label="Overall Rank" value={data.overall_rank} accent="#a78bfa" delay={160} loaded={loaded} />
          <StatCard label="Team Value" value={0} raw={`£${data.team_value.toFixed(1)}m`} sub={`Bank: £${data.bank.toFixed(1)}m`} accent="#fbbf24" delay={240} loaded={loaded} />
        </div>

        {/* ── GW Chart + Chips + League ── */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* GW Points chart */}
          <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/[0.03] p-5" style={fade(300)}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Gameweek Points</p>
                <p className="text-xs text-white/40">Your score vs overall average each week</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-emerald-400/70" />You</span>
                <span className="flex items-center gap-1"><span className="inline-block h-px w-3 bg-white/30" />Avg</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data.gw_history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pts" name="Your pts" fill="rgba(0,255,135,0.55)" radius={[3, 3, 0, 0]} animationBegin={400} animationDuration={1200} />
                <Line dataKey="avg" name="GW avg" stroke="rgba(255,255,255,0.3)" dot={false} strokeWidth={1.5} animationBegin={700} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Chips + League */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Chips */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4" style={fade(350)}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-3">Chips</p>
              <div className="grid grid-cols-2 gap-2">
                {data.chips.map((chip) => (
                  <div key={chip.key} className={`rounded-xl border px-3 py-2 flex items-center gap-2 transition-all ${chip.available ? "border-emerald-400/30 bg-emerald-400/[0.08] shadow-[0_0_12px_rgba(0,255,135,0.10)]" : "border-white/5 bg-white/[0.02] opacity-40"}`}>
                    <span className="text-base leading-none">{CHIP_ICONS[chip.key] ?? "●"}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${chip.available ? "text-white" : "text-white/50"}`}>{chip.name}</p>
                      <p className="text-[9px] text-white/30">{chip.available ? "Available" : `GW${chip.event}`}</p>
                    </div>
                    {chip.available && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini-league */}
            {data.league_standings.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex-1" style={fade(400)}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">Mini-League</p>
                {data.league_name && <p className="text-xs text-white/50 mb-2 truncate">{data.league_name}</p>}
                <div className="space-y-0.5 overflow-y-auto max-h-[240px] pr-0.5">
                  {data.league_standings.map((row) => (
                    <div key={row.entry_id} className={`rounded-lg px-2 py-1.5 flex items-center gap-1.5 text-xs transition-all ${row.is_user ? "border border-emerald-400/30 bg-emerald-400/[0.08]" : "border border-transparent"}`}>
                      <span className="w-4 text-white/30 text-[10px] font-mono shrink-0">{row.rank}</span>
                      <RankArrow rank={row.rank} lastRank={row.last_rank} />
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium text-[11px] ${row.is_user ? "text-emerald-300" : "text-white/80"}`}>{row.team}</p>
                        <p className="text-[9px] text-white/25 truncate">{row.manager}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-[11px] text-white">{fmt(row.total)}</p>
                        <p className="text-[9px] text-white/35">GW:{row.gw_pts}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Rank Journey + Season Heatmap ── */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Rank chart */}
          <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/[0.03] p-5" style={fade(450)}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Overall Rank Journey</p>
              <p className="text-xs text-white/40">Week-by-week rank — lower is better</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rankData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis reversed tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<RankTooltip />} />
                <Line dataKey="rank" name="Rank" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 2 }} activeDot={{ r: 4 }} animationBegin={200} animationDuration={1400} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Season heatmap */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/[0.03] p-5" style={fade(500)}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Season Heatmap</p>
              <p className="text-xs text-white/40">GW scores colour-coded vs average</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.gw_history.map((g) => (
                <HeatmapCell key={g.gw} pts={g.pts} avg={g.avg} />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {[
                { color: "#00FF87", label: "1.5× avg" },
                { color: "#34d399", label: "Above avg" },
                { color: "#fbbf24", label: "Near avg" },
                { color: "#f97316", label: "Below avg" },
                { color: "#ef4444", label: "Low" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-[9px] text-white/40">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Transfer History ── */}
        {transferGWs.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5" style={fade(550)}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Transfer History</p>
              <p className="text-xs text-white/40">{data.total_transfers} total transfers this season</p>
            </div>
            <div className="space-y-4">
              {transferGWs.slice(0, 6).map((gw) => (
                <div key={gw}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-2">GW{gw}</p>
                  <div className="space-y-1.5">
                    {transfersByGW[gw].map((t, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                        {/* Out */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <BadgeImg code={t.out_team_code} name={t.out_team_short} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-red-400 truncate">{t.out_name}</p>
                            <p className="text-[9px] text-white/30">{t.out_pos} · £{t.out_price.toFixed(1)}m</p>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="flex flex-col items-center shrink-0">
                          <svg className="h-4 w-4 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                        {/* In */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end text-right">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-emerald-400 truncate">{t.in_name}</p>
                            <p className="text-[9px] text-white/30">{t.in_pos} · £{t.in_price.toFixed(1)}m</p>
                          </div>
                          <BadgeImg code={t.in_team_code} name={t.in_team_short} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Squad ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5" style={fade(600)}>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-white">Your Squad — {data.current_gw_name}</p>
              <p className="text-xs text-white/40 mt-0.5">Fixtures colour: <span style={{ color: DIFF_COLORS[1] }}>easy</span> → <span style={{ color: DIFF_COLORS[5] }}>hard</span></p>
            </div>
            <div className="flex gap-4 text-xs text-white/40 flex-wrap">
              <span>Bench: {data.points_on_bench}pts</span>
              {data.gw_transfers > 0 && (
                <span className={data.gw_transfer_cost > 0 ? "text-red-400" : "text-white/40"}>
                  {data.gw_transfers} transfer{data.gw_transfers !== 1 ? "s" : ""}
                  {data.gw_transfer_cost > 0 ? ` (-${data.gw_transfer_cost}pts)` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Starters */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-11 mb-5">
            {starters.map((p) => <PlayerCard key={p.slot} p={p} bench={false} />)}
          </div>

          {/* Bench divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">Bench</p>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
            {bench.map((p) => <PlayerCard key={p.slot} p={p} bench={true} />)}
          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 pb-4">
          Live data via the FPL public API · Refreshes each page load
        </p>
      </div>
    </div>
  )
}
