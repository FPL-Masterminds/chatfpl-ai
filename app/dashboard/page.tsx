"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { DevHeader } from "@/components/dev-header"
import { Footer } from "@/components/footer"
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, Bar, Line,
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

const DIFF_COLORS: Record<number, string> = {
  1: "#00FF87", 2: "#86efac", 3: "#fde68a", 4: "#fb923c", 5: "#ef4444",
}

const POS_STYLE: Record<string, { border: string; glow: string; label: string }> = {
  GKP: { border: "#f59e0b", glow: "rgba(245,158,11,0.18)", label: "#fcd34d" },
  DEF: { border: "#3b82f6", glow: "rgba(59,130,246,0.18)", label: "#93c5fd" },
  MID: { border: "#00FF87", glow: "rgba(0,255,135,0.18)", label: "#00FF87" },
  FWD: { border: "#f97316", glow: "rgba(249,115,22,0.18)", label: "#fdba74" },
}

const TABS = [
  { id: "squad",       label: "Your Squad",    desc: "Starting XI, bench & next fixtures",          dot: "#00FF87" },
  { id: "performance", label: "Performance",   desc: "GW chart, rank journey & season heatmap",     dot: "#00FFFF" },
  { id: "transfers",   label: "Transfer Log",  desc: "Every move you've made this season",          dot: "#00FF87" },
  { id: "league",      label: "Mini-League",   desc: "Live standings & chip status",                dot: "#00FFFF" },
]

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
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://resources.premierleague.com/premierleague/badges/70/t${code}.png`}
      alt={name} className="h-4 w-4 object-contain shrink-0" onError={() => setOk(false)} />
  )
}

function RankArrow({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (!lastRank || rank === lastRank) return <span className="text-white/20 text-[10px]">–</span>
  if (rank < lastRank) return <span className="text-emerald-400 text-[10px]">▲</span>
  return <span className="text-red-400 text-[10px]">▼</span>
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, delay = 0, loaded, raw }: {
  label: string; value: number; sub?: string
  delay?: number; loaded: boolean; raw?: string
}) {
  const displayed = useCountUp(value, loaded, 1400)
  return (
    <div
      className="rounded-2xl hover:scale-[1.02] transition-transform duration-300"
      style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
        padding: "1px",
        background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
        backgroundSize: "220% 220%",
        animation: "glow_scroll 5s linear infinite",
      }}
    >
      <div className="rounded-2xl bg-[#080808] p-5 flex flex-col gap-1 h-full">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white">{label}</p>
        <p className="text-3xl font-bold text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
          {raw ?? fmt(displayed)}
        </p>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Chart Tooltips ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-[#0a0a0a] px-3 py-2 text-xs shadow-xl">
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
    <div className="rounded-xl border border-emerald-400/20 bg-[#0a0a0a] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/40">GW{label}</p>
      <p className="font-semibold" style={{ color: "#00FF87" }}>Rank: {fmt(payload[0]?.value ?? 0)}</p>
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

// ─── Squad Stats Grid ─────────────────────────────────────────────────────────

type SortKey = "name" | "pos" | "price" | "form" | "ep_next" | "points" | "transfers_in_gw"
type SortDir = "asc" | "desc"

const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }

function PhotoThumb({ src, name }: { src: string; name: string }) {
  const [ok, setOk] = useState(true)
  if (!ok || !src) return (
    <div style={{ height: 52, width: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", margin: "0 auto" }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} onError={() => setOk(false)}
      style={{ height: 52, width: 44, objectFit: "contain", objectPosition: "center", display: "block", margin: "0 auto" }} />
  )
}

const COL_HEADERS: { key: SortKey | null; label: string; title?: string }[] = [
  { key: null,              label: ""        },
  { key: "pos",             label: "POS"     },
  { key: "name",            label: "PLAYER"  },
  { key: null,              label: "TEAM"    },
  { key: "price",           label: "PRICE"   },
  { key: "form",            label: "FORM",   title: "Rolling form score" },
  { key: "ep_next",         label: "xP",     title: "Expected points next GW" },
  { key: "points",          label: "POINTS", title: "Points scored this gameweek" },
  { key: "transfers_in_gw", label: "TRANSFERS", title: "GW transfers in / out" },
  { key: null,              label: "FIXTURES",title: "Next 3 fixtures (colour = difficulty)" },
]

function SquadRow({ p, bench, sortKey }: { p: SquadPlayer; bench: boolean; sortKey: SortKey | null }) {
  const ps = POS_STYLE[p.pos] ?? POS_STYLE.MID
  const injured = p.chance < 75
  const rowOpacity = bench ? "opacity-50 hover:opacity-80" : ""

  return (
    <tr className={`border-b border-white/[0.04] transition-all duration-150 group ${rowOpacity}`}>
      {/* Photo — sticky so it stays visible when scrolling horizontally */}
      <td style={{ position: "sticky", left: 0, zIndex: 5, background: "rgb(8,8,8)", width: 64, minWidth: 64, padding: "6px 4px", textAlign: "center", verticalAlign: "middle" }}>
        <PhotoThumb src={p.photo_url} name={p.name} />
      </td>

      {/* Position */}
      <td className="py-2 px-2 w-16">
        <span className="text-xs font-bold text-white">{p.pos}</span>
      </td>

      {/* Player name + badges */}
      <td className="py-2 px-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold truncate max-w-[120px] ${bench ? "text-white/50" : "text-white"}`}>{p.name}</span>
          {p.is_captain && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-black text-black shrink-0">C</span>
          )}
          {p.is_vice_captain && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-black shrink-0">V</span>
          )}
          {injured && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shrink-0" title={p.news}>!</span>
          )}
        </div>
      </td>

      {/* Team */}
      <td className="py-2 px-2 w-20">
        <div className="flex items-center gap-1.5">
          <BadgeImg code={p.team_code} name={p.team_short} />
          <span className="text-xs text-white/40">{p.team_short}</span>
        </div>
      </td>

      {/* Price */}
      <td className="py-2 px-2 w-20 tabular-nums">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${bench ? "text-white/40" : "text-white/80"}`}>£{p.price.toFixed(1)}m</span>
          {p.cost_change_event > 0 && <span className="text-[9px] font-bold text-emerald-400">▲</span>}
          {p.cost_change_event < 0 && <span className="text-[9px] font-bold text-red-400">▼</span>}
        </div>
      </td>

      {/* Form */}
      <td className="py-2 px-2 w-16 tabular-nums text-center">
        <span className={`text-xs font-semibold ${Number(p.form) >= 7 ? "text-emerald-400" : Number(p.form) >= 4 ? "text-white/70" : "text-white/40"}`}>
          {p.form}
        </span>
      </td>

      {/* xP */}
      <td className="py-2 px-2 w-16 tabular-nums text-center">
        <span className="text-xs font-semibold text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
          {p.ep_next > 0 ? p.ep_next.toFixed(1) : "–"}
        </span>
      </td>

      {/* GW Points */}
      <td className="py-2 px-2 w-20 tabular-nums text-center">
        <span className={`text-sm font-bold ${bench ? "text-white/30" : "text-white"}`}>{p.points}</span>
      </td>

      {/* Transfers in/out */}
      <td className="py-2 px-2 w-24 tabular-nums">
        <div className="flex items-center gap-1 justify-center">
          <span className="text-[10px] text-emerald-400/70">+{p.transfers_in_gw.toLocaleString()}</span>
          <span className="text-white/20 text-[9px]">/</span>
          <span className="text-[10px] text-red-400/70">-{p.transfers_out_gw.toLocaleString()}</span>
        </div>
      </td>

      {/* Next fixtures */}
      <td className="py-2 pl-2 pr-3">
        <div className="flex gap-1 flex-wrap">
          {p.next_fixtures.slice(0, 3).map((f, i) => (
            <span key={i} className="rounded px-1.5 py-0.5 text-[8px] font-bold leading-none whitespace-nowrap"
              style={{ color: "#000", backgroundColor: DIFF_COLORS[f.difficulty] ?? "#888" }}>
              {f.opponent}{!f.home ? "(A)" : ""}
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

// ─── Gate Screen ─────────────────────────────────────────────────────────────

function GateScreen({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,255,135,0.13), transparent)" }} />
      <div className="relative max-w-sm text-center space-y-5">
        <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL" width={120} height={34} className="mx-auto h-8 w-auto opacity-70" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-white/50 leading-relaxed">{body}</p>
        <div className="flex flex-col gap-3">
          <Link href={href} className="rounded-xl bg-gradient-to-r from-[#00FF87] to-[#00FFFF] px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110 transition-all">{cta}</Link>
          <Link href="/chat" className="text-sm text-white/40 hover:text-white transition-colors">Back to chat</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Content Panels ───────────────────────────────────────────────────────

function SquadPanel({ data }: { data: DashboardData }) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const starters = data.squad.filter((p) => p.slot <= 11)
  const bench    = data.squad.filter((p) => p.slot > 11).sort((a, b) => a.slot - b.slot)

  function sorted(list: SquadPlayer[]) {
    if (!sortKey) return [...list].sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos] || a.slot - b.slot)
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === "desc" ? bv - av : av - bv
    })
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const sortedStarters = sorted(starters)
  const sortedBench    = sorted(bench)

  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-white">Your Squad - {data.current_gw_name}</p>
          <p className="text-xs text-white/40 mt-0.5">
            Fixtures: <span style={{ color: DIFF_COLORS[1] }}>easy</span> → <span style={{ color: DIFF_COLORS[5] }}>hard</span>
            &nbsp;·&nbsp;Click column headers to sort
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          <span className="text-white/40">Bench: <span className="text-white">{data.points_on_bench}pts</span></span>
          {data.gw_transfers > 0 && (
            <span className={data.gw_transfer_cost > 0 ? "text-red-400" : "text-white/40"}>
              {data.gw_transfers} transfer{data.gw_transfers !== 1 ? "s" : ""}
              {data.gw_transfer_cost > 0 ? ` (-${data.gw_transfer_cost}pts)` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {COL_HEADERS.map((col, i) => (
                <th key={i}
                  className={`py-4 px-3 text-[10px] uppercase tracking-[0.18em] font-semibold select-none ${i === 0 ? "pl-3" : ""} ${col.key ? "cursor-pointer hover:text-emerald-400 transition-colors" : "text-white"} ${sortKey === col.key ? "text-emerald-400" : "text-white"}`}
                  title={col.title}
                  onClick={() => col.key && toggleSort(col.key)}
                  style={i === 0 ? { position: "sticky", left: 0, zIndex: 10, background: "rgb(8,8,8)", width: 64, minWidth: 64 } : undefined}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedStarters.map((p) => (
              <SquadRow key={p.slot} p={p} bench={false} sortKey={sortKey} />
            ))}

            {/* Bench divider */}
            <tr>
              <td colSpan={10} className="py-1.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">Bench</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
              </td>
            </tr>

            {sortedBench.map((p) => (
              <SquadRow key={p.slot} p={p} bench={true} sortKey={sortKey} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PerformancePanel({ data }: { data: DashboardData }) {
  const rankData = data.gw_history.filter((g) => g.rank > 0)
  return (
    <div className="space-y-6">
      {/* GW Points area chart */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Gameweek Points</p>
            <p className="text-xs text-white/40">Your score vs overall average each week</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }} />You</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-px w-3 bg-white/30" />Avg</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data.gw_history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF87" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#00FFFF" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="pts" name="Your pts" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={18} animationBegin={200} animationDuration={1000} />
            <Line dataKey="avg" name="GW avg" stroke="rgba(255,255,255,0.25)" dot={false} strokeWidth={1.5} animationBegin={500} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rank Journey */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Overall Rank Journey</p>
          <p className="text-xs text-white/40">Week-by-week rank — lower is better</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={rankData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF87" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis reversed tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip content={<RankTooltip />} />
            <Area dataKey="rank" name="Rank" stroke="#00FF87" strokeWidth={2} fill="url(#rankGrad)"
              dot={{ fill: "#00FF87", r: 2, strokeWidth: 0 }} activeDot={{ r: 4, fill: "#00FFFF" }}
              animationBegin={200} animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Season Heatmap</p>
          <p className="text-xs text-white/40">GW scores colour-coded vs average</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.gw_history.map((g) => <HeatmapCell key={g.gw} pts={g.pts} avg={g.avg} />)}
        </div>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {[
            { color: "#00FF87", label: "1.5× avg" }, { color: "#34d399", label: "Above avg" },
            { color: "#fbbf24", label: "Near avg" }, { color: "#f97316", label: "Below avg" },
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
  )
}

function TransfersPanel({ data }: { data: DashboardData }) {
  const transfersByGW: Record<number, Transfer[]> = {}
  data.recent_transfers.forEach((t) => {
    if (!transfersByGW[t.event]) transfersByGW[t.event] = []
    transfersByGW[t.event].push(t)
  })
  const transferGWs = Object.keys(transfersByGW).map(Number).sort((a, b) => b - a)

  if (!transferGWs.length) return (
    <div className="flex items-center justify-center h-48 text-white/30 text-sm">No transfers recorded yet.</div>
  )

  // Summary stats
  const allTransfers = data.recent_transfers
  const netSpend = allTransfers.reduce((acc, t) => acc + (t.in_price - t.out_price), 0)
  const posCounts: Record<string, number> = {}
  allTransfers.forEach((t) => { posCounts[t.in_pos] = (posCounts[t.in_pos] ?? 0) + 1 })
  const mostBought = Object.entries(posCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "–"

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-white">Transfer History</p>
        <p className="text-xs text-white/40 mt-0.5">{data.total_transfers} total transfers this season</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Transfers", value: String(data.total_transfers) },
          { label: "Net Spend", value: netSpend >= 0 ? `+£${netSpend.toFixed(1)}m` : `-£${Math.abs(netSpend).toFixed(1)}m`, color: netSpend > 0 ? "#ef4444" : "#00FF87" },
          { label: "Most Bought", value: mostBought },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400/60 mb-1">{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color ?? "#fff" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transfer cards — 2 per row */}
      {transferGWs.map((gw) => (
        <div key={gw}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/60 mb-2">Gameweek {gw}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {transfersByGW[gw].map((t, i) => {
              const delta = t.in_price - t.out_price
              return (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[1fr_56px_1fr]">
                    {/* OUT */}
                    <div className="px-4 py-3.5 bg-red-500/[0.04]">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-red-400/60 mb-1.5">Out</p>
                      <div className="flex items-center gap-2">
                        <BadgeImg code={t.out_team_code} name={t.out_team_short} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-red-300 truncate leading-tight">{t.out_name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{t.out_pos} · £{t.out_price.toFixed(1)}m</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow + delta */}
                    <div className="flex flex-col items-center justify-center gap-1 border-x border-white/[0.05] bg-white/[0.01]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="url(#tGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs><linearGradient id="tGrad" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#00FF87" /><stop offset="1" stopColor="#00FFFF" /></linearGradient></defs>
                      </svg>
                      {delta !== 0 && (
                        <span className={`text-[9px] font-bold ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {delta > 0 ? `+£${delta.toFixed(1)}m` : `-£${Math.abs(delta).toFixed(1)}m`}
                        </span>
                      )}
                    </div>

                    {/* IN */}
                    <div className="px-4 py-3.5 bg-emerald-500/[0.04]">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-emerald-400/60 mb-1.5 text-right">In</p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="min-w-0 text-right">
                          <p className="text-sm font-bold text-emerald-300 truncate leading-tight">{t.in_name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{t.in_pos} · £{t.in_price.toFixed(1)}m</p>
                        </div>
                        <BadgeImg code={t.in_team_code} name={t.in_team_short} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function simulateWinProb(standings: LeagueRow[], remainingGws: number): Record<number, number> {
  if (!standings.length || remainingGws <= 0) return {}
  const SIMS = 4000
  const AVG = 50
  const STD = 18
  const randn = () => {
    let u = 0, v = 0
    while (!u) u = Math.random()
    while (!v) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const wins: Record<number, number> = {}
  standings.forEach(s => { wins[s.entry_id] = 0 })
  for (let i = 0; i < SIMS; i++) {
    let best = -1, bestId = -1
    standings.forEach(s => {
      let proj = s.total
      for (let g = 0; g < remainingGws; g++) proj += Math.max(1, Math.round(AVG + randn() * STD))
      if (proj > best) { best = proj; bestId = s.entry_id }
    })
    if (bestId !== -1) wins[bestId]++
  }
  const result: Record<number, number> = {}
  standings.forEach(s => { result[s.entry_id] = Math.round((wins[s.entry_id] / SIMS) * 100) })
  return result
}

function LeaguePanel({ data }: { data: DashboardData }) {
  const standings = data.league_standings
  const user = standings.find(s => s.is_user)
  const leader = standings[0]
  const gapToFirst = user && leader && !user.is_user || (user && leader && user.entry_id !== leader.entry_id)
    ? leader.total - (user?.total ?? 0) : 0
  const remainingGws = Math.max(0, 38 - data.current_gw)
  const winProbs = simulateWinProb(standings, remainingGws)
  const maxProb = Math.max(...Object.values(winProbs), 1)
  const chipsAvailable = data.chips.filter(c => c.available).length

  return (
    <div className="space-y-4">

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Your Rank", value: user ? `${user.rank}${user.rank === 1 ? "st" : user.rank === 2 ? "nd" : user.rank === 3 ? "rd" : "th"}` : "—", sub: `of ${standings.length}` },
          { label: "Gap to 1st", value: user?.rank === 1 ? "Leading" : `−${fmt(gapToFirst)}`, sub: "points behind" },
          { label: "GW Points", value: user ? fmt(user.gw_pts) : "—", sub: `GW ${data.current_gw}` },
          { label: "GWs Left", value: remainingGws.toString(), sub: "remaining this season" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-white mb-1">{label}</p>
            <p className="text-xl font-bold text-transparent bg-clip-text leading-none"
              style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
              {value}
            </p>
            <p className="text-[9px] text-white mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main two-column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* League standings */}
        {standings.length > 0 && (
          <div className="lg:col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white">{data.league_name ?? "Mini-League"}</p>
              <p className="text-[9px] text-white">{standings.length} managers</p>
            </div>
            <div className="space-y-1">
              {standings.map((row) => (
                <div key={row.entry_id}
                  className={`rounded-xl px-3 py-2 flex items-center gap-2 text-xs transition-all ${row.is_user ? "border border-emerald-400/30 bg-emerald-400/[0.06]" : "border border-transparent hover:bg-white/[0.02]"}`}>
                  <span className="w-4 text-white text-[10px] font-mono shrink-0">{row.rank}</span>
                  <RankArrow rank={row.rank} lastRank={row.last_rank} />
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-medium text-[11px] ${row.is_user ? "text-emerald-300" : "text-white"}`}>{row.team}</p>
                    <p className="text-[9px] text-white truncate">{row.manager}</p>
                  </div>
                  {/* Win prob bar */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 w-16 shrink-0">
                    <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(((winProbs[row.entry_id] ?? 0) / maxProb) * 100)}%`, background: "linear-gradient(to right,#00FF87,#00FFFF)" }} />
                    </div>
                    <p className="text-[8px] text-white">{winProbs[row.entry_id] ?? 0}% win</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`font-bold text-[12px] ${row.is_user ? "text-transparent bg-clip-text" : "text-white"}`}
                      style={row.is_user ? { backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" } : {}}>
                      {fmt(row.total)}
                    </p>
                    <p className="text-[9px] text-white">GW {row.gw_pts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right column: chips + win prob chart */}
        <div className="space-y-4">

          {/* Chip Status */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white">Chip Status</p>
              <span className="text-[9px] text-white">{chipsAvailable} available</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.chips.map((chip) => (
                <div key={chip.key} className={`rounded-xl border px-2.5 py-2 flex items-center gap-2 ${chip.available ? "border-emerald-400/30 bg-emerald-400/[0.08]" : "border-white/5 bg-white/[0.02] opacity-40"}`}>
                  <span className="text-sm leading-none shrink-0">{CHIP_ICONS[chip.key] ?? "●"}</span>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold truncate leading-tight ${chip.available ? "text-white" : "text-white"}`}>{chip.name}</p>
                    <p className="text-[8px] text-white leading-tight">{chip.available ? "Available" : `GW${chip.event}`}</p>
                  </div>
                  {chip.available && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          {/* Win Probability chart */}
          {standings.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white mb-1">Win Probability</p>
              <p className="text-[9px] text-white mb-3">Based on {remainingGws} remaining GWs</p>
              <div className="space-y-2">
                {[...standings]
                  .map(s => ({ ...s, prob: winProbs[s.entry_id] ?? 0 }))
                  .sort((a, b) => b.prob - a.prob)
                  .slice(0, 6)
                  .map(row => (
                    <div key={row.entry_id}>
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-[9px] truncate max-w-[70%] ${row.is_user ? "text-emerald-300 font-semibold" : "text-white"}`}>{row.team}</p>
                        <p className="text-[9px] text-white shrink-0">{row.prob}%</p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${row.prob}%`, background: row.is_user ? "linear-gradient(to right,#00FF87,#00FFFF)" : "rgba(255,255,255,0.15)" }} />
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-[7px] text-white mt-3">Simulated based on average FPL scoring patterns. For entertainment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<"loading" | "no_team" | "error" | "ready">("loading")
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("squad")

  useEffect(() => {
    const load = async () => {
      try {
        const accountRes = await fetch("/api/account")
        if (!accountRes.ok) { router.replace("/login"); return }
        const res = await fetch("/api/dashboard")
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
      <div className="flex gap-1">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400" />
      </div>
    </div>
  )

  if (status === "no_team") return <GateScreen title="Link Your FPL Team" body="To use the dashboard, save your public FPL Team ID in account settings. It takes 10 seconds." cta="Go to Settings" href="/admin" />
  if (status === "error" || !data) return <GateScreen title="Something went wrong" body="We couldn't load your FPL data. The FPL API may be temporarily unavailable — try again in a moment." cta="Retry" href="/dashboard" />

  const fade = (delay: number) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Green glow */}
      <div className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,255,135,0.10), transparent)" }} />

      <DevHeader />

      <div className="relative mx-auto max-w-7xl w-full px-4 pt-28 pb-10 space-y-6 flex-1">

        {/* Page heading */}
        <div className="text-center" style={fade(0)}>
          <h1 className="text-[36px] lg:text-6xl font-bold leading-[1.1] tracking-tighter">
            <span className="text-white">ChatFPL </span>
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
              Dashboard
            </span>
          </h1>
          <p className="text-white text-base mt-3 max-w-xl mx-auto">
            {data.team_name} · {data.manager_name} · {data.current_gw_name}
          </p>
        </div>

        {/* 4 Stat tiles — always visible */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" style={fade(80)}>
          <StatCard label="GW Points"      value={data.gw_points}       sub={data.gw_rank ? `Rank: ${fmt(data.gw_rank)}` : undefined}          delay={0}   loaded={loaded} />
          <StatCard label="Overall Points" value={data.overall_points}   sub={data.active_chip ? `${data.active_chip} active` : undefined}      delay={60}  loaded={loaded} />
          <StatCard label="Overall Rank"   value={data.overall_rank}                                                                             delay={120} loaded={loaded} />
          <StatCard label="Team Value"     value={0} raw={`£${data.team_value.toFixed(1)}m`} sub={`Bank: £${data.bank.toFixed(1)}m`}           delay={180} loaded={loaded} />
        </div>

        {/* Vertical tab command center */}
        <div className="rounded-3xl" style={{ ...fade(200), padding: "1px", background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)", backgroundSize: "220% 220%", animation: "glow_scroll 7s linear infinite" }}>
        <div className="rounded-3xl bg-[#080808] overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            {/* ── Left sidebar ── */}
            <div className="relative lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-emerald-400/10 p-3 lg:p-4">
              {/* Mobile: 2-col grid. Desktop: vertical list */}
              <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1 lg:gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative text-left p-3 lg:p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] group"
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="tab-bg"
                        className="absolute inset-0 rounded-2xl border border-emerald-400/25"
                        style={{ background: "rgba(0,255,135,0.07)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <div className="relative flex items-start gap-2.5">
                      <span
                        className="h-2 w-2 rounded-full mt-1 shrink-0 transition-all duration-300"
                        style={{
                          background: activeTab === tab.id ? tab.dot : "rgba(255,255,255,0.15)",
                          boxShadow: activeTab === tab.id ? `0 0 8px ${tab.dot}` : "none",
                        }}
                      />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm transition-colors leading-tight ${activeTab === tab.id ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                          {tab.label}
                        </p>
                        <p className="text-[11px] text-white mt-0.5 leading-tight hidden lg:block">{tab.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Right content area ── */}
            <div className="flex-1 p-5 lg:p-7 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "squad"       && <SquadPanel       data={data} />}
                  {activeTab === "performance" && <PerformancePanel  data={data} />}
                  {activeTab === "transfers"   && <TransfersPanel    data={data} />}
                  {activeTab === "league"      && <LeaguePanel       data={data} />}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
        </div>

        <p className="text-center text-[10px] text-white pb-2">
          Live data via the FPL public API · Refreshes each page load
        </p>
      </div>

      <Footer />
    </div>
  )
}
