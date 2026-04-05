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

interface TransferTarget {
  id: number; name: string; code: number; team_id: number; team_short: string; team_code: number
  pos: string; price: number; ep_next: number; form: number
  transfers_in_gw: number; selected_by: number
}

interface LeagueRow {
  rank: number; last_rank: number; manager: string; team: string
  entry_id: number; gw_pts: number; total: number; is_user: boolean
  chips_remaining: string[]; chip_bonus: number
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
  transfer_targets: Record<string, TransferTarget[]>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHIP_ICONS: Record<string, string> = { wildcard: "♻", freehit: "🎯", "3xc": "3×", bboost: "🚀" }
const CHIP_LABELS: Record<string, string> = { "3xc": "TC", bboost: "BB", freehit: "FH", wildcard: "WC" }

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
  { id: "transfers",   label: "Transfer Planner", desc: "Suggested swaps based on expected points",    dot: "#00FF87" },
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
  if (!code || !ok) return <span className="text-[9px] text-white/70">{name.slice(0, 3)}</span>
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
        {sub && <p className="text-xs text-white/70">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Chart Tooltips ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-[#0a0a0a] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/70">GW{label}</p>
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
      <p className="mb-1 text-white/70">GW{label}</p>
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
          <span className="text-xs text-white/70">{p.team_short}</span>
        </div>
      </td>

      {/* Price */}
      <td className="py-2 px-2 w-20 tabular-nums">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${bench ? "text-white/70" : "text-white/80"}`}>£{p.price.toFixed(1)}m</span>
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
        <span className={`text-sm font-bold ${bench ? "text-white/70" : "text-white"}`}>{p.points}</span>
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
          <Link href="/chat" className="text-sm text-white/70 hover:text-white transition-colors">Back to chat</Link>
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
          <p className="text-xs text-white/70 mt-0.5">
            Fixtures: <span style={{ color: DIFF_COLORS[1] }}>easy</span> → <span style={{ color: DIFF_COLORS[5] }}>hard</span>
            &nbsp;·&nbsp;Click column headers to sort
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          <span className="text-white/70">Bench: <span className="text-white">{data.points_on_bench}pts</span></span>
          {data.gw_transfers > 0 && (
            <span className={data.gw_transfer_cost > 0 ? "text-red-400" : "text-white/70"}>
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
            <p className="text-xs text-white/70">Your score vs overall average each week</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded" style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }} />You</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-px w-3 bg-white/70" />Avg</span>
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
            <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="pts" name="Your pts" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={18} animationBegin={200} animationDuration={1000} />
            <Line dataKey="avg" name="GW avg" stroke="rgba(255,255,255,0.7)" dot={false} strokeWidth={1.5} animationBegin={500} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rank Journey */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Overall Rank Journey</p>
          <p className="text-xs text-white/70">Week-by-week rank — lower is better</p>
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
            <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis reversed tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} tickLine={false} axisLine={false}
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
          <p className="text-xs text-white/70">GW scores colour-coded vs average</p>
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
              <span className="text-[9px] text-white/70">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TransfersPanel({ data }: { data: DashboardData }) {
  const targets = data.transfer_targets ?? {}
  const bank = data.bank

  // Starters sorted by ep_next ascending — weakest first
  const starters = data.squad
    .filter(p => p.slot <= 11)
    .sort((a, b) => a.ep_next - b.ep_next)

  // Build suggestions: for each weak starter find the best available swap
  type Suggestion = { out: typeof starters[0]; in: TransferTarget; epGain: number; costDelta: number }
  const suggestions: Suggestion[] = []
  const usedInIds = new Set<number>()

  for (const weak of starters) {
    if (suggestions.length >= 3) break
    const budget = parseFloat((weak.price + bank).toFixed(1))
    // Count clubs already in squad (for 3-per-club rule)
    const clubCounts: Record<number, number> = {}
    data.squad.forEach(p => { clubCounts[p.team_id] = (clubCounts[p.team_id] ?? 0) + 1 })

    const candidates = (targets[weak.pos] ?? []).filter(t => {
      if (usedInIds.has(t.id)) return false
      if (t.price > budget) return false
      // If this club is at 3, skip (unless it replaces someone from that club)
      const existingCount = clubCounts[t.team_id] ?? 0
      const replacingOwnClub = weak.team_id === t.team_id
      if (existingCount >= 3 && !replacingOwnClub) return false
      if (t.ep_next <= weak.ep_next + 0.3) return false // not a meaningful upgrade
      return true
    })

    if (!candidates.length) continue
    const best = candidates[0]
    usedInIds.add(best.id)
    suggestions.push({
      out: weak,
      in: best,
      epGain: parseFloat((best.ep_next - weak.ep_next).toFixed(1)),
      costDelta: parseFloat((best.price - weak.price).toFixed(1)),
    })
  }

  const gradStyle = { backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }
  const freeTransfers = data.gw_transfers === 0 ? 1 : 0 // simplified — 1 FT if none used

  if (!suggestions.length) return (
    <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
      <p className="text-white text-sm font-medium">No obvious upgrades found.</p>
      <p className="text-white/70 text-xs">Your squad looks well-balanced for the next gameweek.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Transfer Planner</p>
          <p className="text-xs text-white/70 mt-0.5">Suggested swaps based on GW{data.current_gw + 1} expected points</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-white/70">Budget</p>
          <p className="text-sm font-bold text-transparent bg-clip-text" style={gradStyle}>
            £{bank.toFixed(1)}m
          </p>
        </div>
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const outPhotoUrl = s.out.photo_url
          const inPhotoUrl = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${s.in.code}.png`
          return (
          <div key={i} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] overflow-hidden">
            {/* Banner */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-400/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white">
                {i === 0 ? "Priority swap" : i === 1 ? "Secondary option" : "Worth considering"}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-white/70">xPts gain</span>
                <span className="text-sm font-bold text-transparent bg-clip-text" style={gradStyle}>+{s.epGain}</span>
              </div>
            </div>

            {/* OUT row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative shrink-0 w-12" style={{ height: 56 }}>
                <Image src={outPhotoUrl} alt={s.out.name} fill className="object-contain object-bottom" unoptimized />
                <div className="absolute bottom-0 left-0 right-0" style={{
                  height: 1,
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 70%, transparent)",
                  boxShadow: "0 0 6px 2px rgba(255,255,255,0.2)",
                }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/50 mb-0.5">Transfer out</p>
                <p className="text-sm font-semibold text-white truncate">{s.out.name}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.out.pos} · £{s.out.price.toFixed(1)}m · {s.out.ep_next} xPts</p>
              </div>
            </div>

            {/* Arrow divider */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-12 shrink-0 flex justify-center">
                <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="url(#pGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs><linearGradient id="pGrad" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#00FF87" /><stop offset="1" stopColor="#00FFFF" /></linearGradient></defs>
                </svg>
              </div>
              <div className="flex-1 border-t border-emerald-400/10" />
            </div>

            {/* IN row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative shrink-0 w-12" style={{ height: 56 }}>
                <Image src={inPhotoUrl} alt={s.in.name} fill className="object-contain object-bottom" unoptimized />
                <div className="absolute bottom-0 left-0 right-0" style={{
                  height: 1,
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 70%, transparent)",
                  boxShadow: "0 0 6px 2px rgba(255,255,255,0.2)",
                }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">Transfer in</p>
                  {s.costDelta !== 0 && (
                    <span className="text-[9px] font-semibold text-white/70 shrink-0">
                      {s.costDelta > 0 ? `costs £${s.costDelta.toFixed(1)}m` : `saves £${Math.abs(s.costDelta).toFixed(1)}m`}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-transparent bg-clip-text truncate" style={gradStyle}>{s.in.name}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.in.pos} · £{s.in.price.toFixed(1)}m · {s.in.ep_next} xPts</p>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      <p className="text-[10px] text-white/70">
        Based on FPL expected points (ep_next) for GW{data.current_gw + 1}. Does not account for multi-GW planning or chip strategy.
      </p>
    </div>
  )
}

function simulateWinProb(standings: LeagueRow[], remainingGws: number): Record<number, number> {
  if (!standings.length || remainingGws <= 0) return {}
  const SIMS = 5000
  const AVG = 50
  const STD = 13
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
      let proj = s.total + (s.chip_bonus ?? 0)
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
          <div key={label} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-white mb-1">{label}</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text leading-none"
              style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
              {value}
            </p>
            <p className="text-xs text-white mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main two-column (50/50) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── League standings ── */}
        {standings.length > 0 && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white font-semibold">{data.league_name ?? "Mini-League"}</p>
              <p className="text-xs text-white">{standings.length} managers</p>
            </div>
            <div className="space-y-1.5">
              {standings.map((row) => (
                <div key={row.entry_id}
                  className={`rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all ${row.is_user ? "border border-emerald-400/30 bg-emerald-400/[0.06]" : "border border-transparent hover:bg-white/[0.02]"}`}>
                  <span className="w-5 text-white text-xs font-mono shrink-0 text-center">{row.rank}</span>
                  <RankArrow rank={row.rank} lastRank={row.last_rank} />
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-semibold text-sm ${row.is_user ? "text-emerald-300" : "text-white"}`}>{row.team}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-white/70 truncate">{row.manager}</span>
                      {(row.chips_remaining ?? []).map(chip => (
                        <span key={chip} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 leading-none shrink-0">
                          {CHIP_LABELS[chip] ?? chip.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Win prob bar */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 w-20 shrink-0">
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(((winProbs[row.entry_id] ?? 0) / maxProb) * 100)}%`, background: "linear-gradient(to right,#00FF87,#00FFFF)" }} />
                    </div>
                    <p className="text-[10px] text-white">{winProbs[row.entry_id] ?? 0}% win</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${row.is_user ? "text-transparent bg-clip-text" : "text-white"}`}
                      style={row.is_user ? { backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" } : {}}>
                      {fmt(row.total)}
                    </p>
                    <p className="text-xs text-white/70">GW {row.gw_pts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Chip Status */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white font-semibold">Chip Status</p>
              <span className="text-xs text-white">{chipsAvailable} available</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.chips.map((chip) => (
                <div key={chip.key} className={`rounded-xl border px-3 py-3 flex items-center gap-3 ${chip.available ? "border-emerald-400/30 bg-emerald-400/[0.08]" : "border-white/5 bg-white/[0.02] opacity-40"}`}>
                  <span className="text-xl leading-none shrink-0">{CHIP_ICONS[chip.key] ?? "●"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">{chip.name}</p>
                    <p className="text-xs text-white leading-tight mt-0.5">{chip.available ? "Available" : `Used GW${chip.event}`}</p>
                  </div>
                  {chip.available && <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-pulse ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          {/* Chip Watch callout */}
          {standings.length > 0 && (() => {
            const user = standings.find(s => s.is_user)
            if (!user) return null
            const threats = standings
              .filter(s => !s.is_user && s.total >= user.total - 100 && s.chip_bonus > (user.chip_bonus ?? 0))
              .sort((a, b) => b.total - a.total)
              .slice(0, 1)
            if (!threats.length) return null
            const t = threats[0]
            const chipAdv = t.chip_bonus - (user.chip_bonus ?? 0)
            const chipNames = t.chips_remaining.map(c => CHIP_LABELS[c] ?? c.toUpperCase()).join(" + ")
            return (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white font-semibold mb-2">Chip Watch</p>
                <p className="text-sm text-white font-medium leading-snug">
                  {t.manager} has {chipNames}: {chipAdv}pts of firepower you don&apos;t have.
                </p>
                <p className="text-xs font-semibold mt-2 text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
                  Only {t.total >= user.total ? "level with" : `${user.total - t.total}pts behind`} you. Factor this in.
                </p>
              </div>
            )
          })()}

          {/* Closest Rivals */}
          {standings.length > 0 && (() => {
            if (!user) return null

            // Person directly above the user in the table (the one they're chasing)
            const directTarget = user.rank > 1
              ? standings.find(s => s.rank === user.rank - 1) ?? null
              : null

            type RivalTemplate = { main: string; sub: string }
            const makeTemplate = (idx: number, m: string, gap: number, isAbove: boolean, chips: string[]): RivalTemplate => {
              const chipStr = chips.length > 0 ? chips.map(c => CHIP_LABELS[c] ?? c.toUpperCase()).join(" + ") : null
              const chipLines = [
                chipStr ? `Still holding ${chipStr}.` : `All chips played — no boosts left.`,
                chipStr ? `${chipStr} still unplayed.` : `No chips left to deploy.`,
                chipStr ? `They've got ${chipStr} in reserve.` : `Nothing left in the locker.`,
              ]
              const cl = chipLines[idx % 3]
              switch (idx % 10) {
                case 0: return { main: isAbove ? `${m} has ${gap}pts on you. Reachable, but they're not stood still.` : `${m} is ${gap}pts back. Don't assume that gap holds all season.`, sub: cl }
                case 1: return { main: isAbove ? `You're ${gap}pts off ${m}. One blank GW for them and you're right back in it.` : `Only ${gap}pts between you and ${m}. One banker captain call away from trouble.`, sub: cl }
                case 2: return { main: isAbove ? `${m} leads you by ${gap}pts. A differential captain could close that quickly.` : `${m} is ${gap}pts behind — close enough to make your next transfer matter.`, sub: cl }
                case 3: return { main: isAbove ? `${gap}pts is what stands between you and ${m}. That's one big GW.` : `${m} is just ${gap}pts adrift. That's well within striking distance over the remaining weeks.`, sub: cl }
                case 4: return { main: isAbove ? `${m} is ${gap}pts clear. Stay consistent and that gap is bridgeable.` : `Keep an eye on ${m}. ${gap}pts isn't a buffer — it's barely breathing room.`, sub: cl }
                case 5: return { main: isAbove ? `You're chasing ${m} by ${gap}pts. Stay consistent and they're catchable.` : `${m} is lurking ${gap}pts behind. One differential and they're on your shoulder.`, sub: cl }
                case 6: return { main: isAbove ? `${m} sits ${gap}pts ahead. Small enough to close, if you can string together a couple of consistent weeks.` : `${m} is ${gap}pts back. That margin is small enough to disappear in a single gameweek.`, sub: cl }
                case 7: return { main: isAbove ? `${gap}pts separates you from ${m}. A captain swap could wipe that out overnight.` : `${m} is only ${gap}pts off the pace. One bad week hands them your spot.`, sub: cl }
                case 8: return { main: isAbove ? `${m} has a ${gap}pt cushion on you. Consistent weeks and you'll pull them back.` : `${m} needs just ${gap}pts to take your position. Stay sharp.`, sub: cl }
                case 9: return { main: isAbove ? `You're ${gap}pts behind ${m}. One big haul changes the whole picture.` : `${m} is ${gap}pts behind you. A good week from them is all it takes to change the picture.`, sub: cl }
                default: return { main: "", sub: "" }
              }
            }

            // Build "How to catch" content for the direct target
            const targetPanel = directTarget ? (() => {
              const gap = directTarget.total - user.total
              const ptsPerGw = remainingGws > 0 ? Math.ceil(gap / remainingGws) : gap
              const chipStr = (directTarget.chips_remaining ?? []).map(c => CHIP_LABELS[c] ?? c.toUpperCase()).join(" + ")
              const chipNote = chipStr
                ? `They still have ${chipStr} to play — factor that into how much ground you need to make up.`
                : `They have no chips left, so what you see in the table is a true reflection of where they stand.`
              return { gap, ptsPerGw, chipNote }
            })() : null

            // Remaining rivals (closest 2, excluding the direct target)
            const otherRivals = standings
              .filter(s => !s.is_user && (!directTarget || s.entry_id !== directTarget.entry_id))
              .map(s => ({ ...s, gap: Math.abs(s.total - user.total), isAbove: s.total > user.total }))
              .sort((a, b) => a.gap - b.gap)
              .slice(0, 2)

            const usedIdx = new Set<number>()
            const assigned = otherRivals.map(rival => {
              let idx = rival.entry_id % 10
              while (usedIdx.has(idx)) idx = (idx + 1) % 10
              usedIdx.add(idx)
              return idx
            })

            const gradStyle = { backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }

            return (
              <>
                {/* Direct target "how to catch" panel */}
                {directTarget && targetPanel && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70 truncate pr-2">
                        {directTarget.team} · {directTarget.manager}
                      </p>
                      <span className="text-xs font-semibold shrink-0 text-transparent bg-clip-text" style={gradStyle}>
                        {winProbs[directTarget.entry_id] ?? 0}% win
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium leading-snug">
                      You need to out-score {directTarget.manager} by {targetPanel.ptsPerGw}pt{targetPanel.ptsPerGw !== 1 ? "s" : ""} per gameweek on average to close the {targetPanel.gap}pt gap over the remaining {remainingGws} weeks.
                    </p>
                    <p className="text-xs font-semibold mt-2 text-transparent bg-clip-text" style={gradStyle}>
                      {targetPanel.chipNote}
                    </p>
                  </div>
                )}

                {/* 2 closest other rivals */}
                {otherRivals.map((rival, i) => {
                  const t = makeTemplate(assigned[i], rival.manager, rival.gap, rival.isAbove, rival.chips_remaining ?? [])
                  if (!t.main) return null
                  return (
                    <div key={rival.entry_id} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/70 truncate pr-2">
                          {rival.team} · {rival.manager}
                        </p>
                        <span className="text-xs font-semibold shrink-0 text-transparent bg-clip-text" style={gradStyle}>
                          {winProbs[rival.entry_id] ?? 0}% win
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium leading-snug">{t.main}</p>
                      <p className="text-xs font-semibold mt-2 text-transparent bg-clip-text" style={gradStyle}>
                        {t.sub}
                      </p>
                    </div>
                  )
                })}
              </>
            )
          })()}

          {/* Win Probability */}
          {standings.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white font-semibold mb-1">{data.league_name ? `${data.league_name} Mini-League Win Probability` : "Mini-League Win Probability"}</p>
              <p className="text-xs font-semibold mb-4 text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
                Based on {remainingGws} remaining GWs
              </p>
              <div className="space-y-3">
                {[...standings]
                  .map(s => ({ ...s, prob: winProbs[s.entry_id] ?? 0 }))
                  .sort((a, b) => b.prob - a.prob)
                  .slice(0, 6)
                  .map(row => (
                    <div key={row.entry_id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-xs truncate max-w-[70%] ${row.is_user ? "text-emerald-300 font-semibold" : "text-white"}`}>{row.team}</p>
                        <p className="text-xs text-white shrink-0 font-medium">{row.prob}%</p>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${row.prob}%`, background: row.is_user ? "linear-gradient(to right,#00FF87,#00FFFF)" : "rgba(255,255,255,0.15)" }} />
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-[10px] font-semibold mt-4 text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}>
                5,000 simulations · chip bonuses included · for entertainment.
              </p>
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
            <span className="text-white">ChatFPL AI </span>
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
              Dashboard
            </span>
          </h1>
          <p className="text-white/70 text-base mt-3 max-w-xl mx-auto">
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
