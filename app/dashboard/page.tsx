"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChipStatus { name: string; key: string; available: boolean; event: number | null }

interface SquadPlayer {
  slot: number; is_captain: boolean; is_vice_captain: boolean; multiplier: number
  name: string; team_short: string; team_code: number; pos: string
  price: number; form: number; points: number; ep_next: number
  chance: number; news: string; photo_url: string
}

interface LeagueRow {
  rank: number; last_rank: number; manager: string; team: string
  entry_id: number; gw_pts: number; total: number; is_user: boolean
}

interface GWPoint { gw: number; pts: number; avg: number; rank: number }

interface DashboardData {
  team_name: string; manager_name: string; overall_points: number; overall_rank: number
  gw_points: number; gw_rank: number | null; team_value: number; bank: number
  total_transfers: number; gw_transfers: number; gw_transfer_cost: number; points_on_bench: number
  current_gw: number; current_gw_name: string; active_chip: string | null
  chips: ChipStatus[]; squad: SquadPlayer[]; gw_history: GWPoint[]
  league_name: string | null; league_standings: LeagueRow[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function fmt(n: number) { return n.toLocaleString("en-GB") }

function RankArrow({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (!lastRank || rank === lastRank) return <span className="text-white/30 text-xs">-</span>
  if (rank < lastRank) return <span className="text-emerald-400 text-xs">▲</span>
  return <span className="text-red-400 text-xs">▼</span>
}

function BadgeImg({ code, name }: { code: number; name: string }) {
  const [ok, setOk] = useState(true)
  if (!code || !ok) return <span className="text-xs text-white/40">{name.slice(0, 3)}</span>
  return (
    <img
      src={`https://resources.premierleague.com/premierleague/badges/70/t${code}.png`}
      alt={name}
      className="h-5 w-5 object-contain shrink-0"
      onError={() => setOk(false)}
    />
  )
}

const CHIP_ICONS: Record<string, string> = {
  wildcard: "♻",
  freehit: "🎯",
  "3xc": "3×",
  bboost: "🚀",
}

const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm shadow-xl">
      <p className="mb-1 text-white/50 text-xs">GW{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = "#00FF87", delay = 0, loaded
}: {
  label: string; value: number; sub?: string; accent?: string; delay?: number; loaded: boolean
}) {
  const displayed = useCountUp(value, loaded, 1400 + delay)
  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5 flex flex-col gap-1 hover:scale-[1.02] transition-transform duration-300"
      style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms` }}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="text-3xl font-bold text-white" style={{ color: accent }}>{fmt(displayed)}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  )
}

// ─── Player Card ─────────────────────────────────────────────────────────────

function PlayerCard({ p, bench }: { p: SquadPlayer; bench: boolean }) {
  const injured = p.chance < 75
  return (
    <div className={`relative rounded-xl border flex flex-col items-center gap-1 px-2 pt-2 pb-1.5 text-center transition-all hover:scale-[1.03] ${
      bench
        ? "border-white/5 bg-white/[0.02]"
        : p.is_captain
          ? "border-emerald-400/40 bg-emerald-400/[0.07] shadow-[0_0_18px_rgba(0,255,135,0.12)]"
          : "border-white/8 bg-white/[0.04]"
    }`}>
      {/* Captain / VC badges */}
      {p.is_captain && (
        <span className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-black">C</span>
      )}
      {p.is_vice_captain && (
        <span className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-black">V</span>
      )}
      {/* Injury dot */}
      {injured && (
        <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-black" title={p.news} />
      )}
      <BadgeImg code={p.team_code} name={p.team_short} />
      <p className="text-[11px] font-semibold text-white leading-tight truncate w-full">{p.name}</p>
      <p className="text-[9px] text-white/40">{p.pos} · £{p.price.toFixed(1)}m</p>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] text-white/60">{p.points}pts</span>
        {p.ep_next > 0 && <span className="text-[9px] text-emerald-400">xP:{p.ep_next.toFixed(1)}</span>}
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
        // Auth check first
        const accountRes = await fetch("/api/account")
        if (!accountRes.ok) { router.replace("/login"); return }

        const res = await fetch("/api/dashboard")

        if (res.status === 403) { setStatus("upgrade"); return }
        if (res.status === 400) { setStatus("no_team"); return }
        if (!res.ok) { setStatus("error"); return }

        const json = await res.json()
        setData(json)
        setStatus("ready")
        // Trigger count-up after a short paint delay
        setTimeout(() => setLoaded(true), 100)
      } catch {
        setStatus("error")
      }
    }
    load()
  }, [router])

  // ── Loading ──
  if (status === "loading") {
    return (
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
  }

  // ── Upgrade gate ──
  if (status === "upgrade") {
    return (
      <GateScreen
        title="Premium Feature"
        body="The FPL Dashboard is available on Premium and above. Upgrade to unlock live squad analytics, rank tracking, and mini-league standings."
        cta="View Plans"
        href="/pricing"
      />
    )
  }

  // ── No team ID ──
  if (status === "no_team") {
    return (
      <GateScreen
        title="Link Your FPL Team"
        body="To use the dashboard, save your public FPL Team ID in account settings. It takes 10 seconds."
        cta="Go to Settings"
        href="/admin"
      />
    )
  }

  // ── Error ──
  if (status === "error" || !data) {
    return (
      <GateScreen
        title="Something went wrong"
        body="We couldn't load your FPL data. The FPL API may be temporarily unavailable. Try again in a moment."
        cta="Retry"
        href="/dashboard"
      />
    )
  }

  const starters = data.squad.filter((p) => p.slot <= 11).sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos])
  const bench = data.squad.filter((p) => p.slot > 11).sort((a, b) => a.slot - b.slot)
  const lastGWAvg = data.gw_history.length > 0 ? data.gw_history[data.gw_history.length - 1].avg : 0

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient overlays */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,200,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(122,92,255,0.10),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}
        >
          <div className="flex items-center gap-4">
            <Link href="/devchat" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
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
          <StatCard label="Team Value" value={Math.round(data.team_value * 10)} sub={`Bank: £${data.bank.toFixed(1)}m`} accent="#fbbf24" delay={240} loaded={loaded} />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Chart — 3 cols */}
          <div
            className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Gameweek Performance</p>
                <p className="text-xs text-white/40">Your GW points vs overall average</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-emerald-400/70" /> You</span>
                <span className="flex items-center gap-1"><span className="inline-block h-px w-3 bg-white/30" /> Avg</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={data.gw_history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="gw" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pts" name="Your pts" fill="rgba(0,255,135,0.55)" radius={[3, 3, 0, 0]} animationBegin={300} animationDuration={1200} />
                <Line dataKey="avg" name="GW avg" stroke="rgba(255,255,255,0.3)" dot={false} strokeWidth={1.5} animationBegin={600} animationDuration={1200} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Right column — chips + league */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Chip status */}
            <div
              className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-4"
              style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s" }}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/40 mb-3">Chips</p>
              <div className="grid grid-cols-2 gap-2">
                {data.chips.map((chip) => (
                  <div
                    key={chip.key}
                    className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 transition-all ${
                      chip.available
                        ? "border-emerald-400/30 bg-emerald-400/[0.08] shadow-[0_0_14px_rgba(0,255,135,0.10)]"
                        : "border-white/5 bg-white/[0.02] opacity-40"
                    }`}
                  >
                    <span className="text-base leading-none">{CHIP_ICONS[chip.key] ?? "●"}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${chip.available ? "text-white" : "text-white/50"}`}>{chip.name}</p>
                      <p className="text-[9px] text-white/30">{chip.available ? "Available" : `GW${chip.event}`}</p>
                    </div>
                    {chip.available && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {data.active_chip && (
                <p className="mt-2 text-center text-[10px] text-emerald-400">
                  {data.active_chip} active this gameweek
                </p>
              )}
            </div>

            {/* Mini-league */}
            {data.league_standings.length > 0 && (
              <div
                className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-4 flex-1 overflow-hidden"
                style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s" }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/40 mb-1">Mini-League</p>
                {data.league_name && <p className="text-xs text-white/60 mb-3 truncate">{data.league_name}</p>}
                <div className="space-y-1 overflow-y-auto max-h-[280px] pr-1">
                  {data.league_standings.map((row) => (
                    <div
                      key={row.entry_id}
                      className={`rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs transition-all ${
                        row.is_user
                          ? "border border-emerald-400/30 bg-emerald-400/[0.08] shadow-[0_0_10px_rgba(0,255,135,0.08)]"
                          : "border border-transparent hover:border-white/5"
                      }`}
                    >
                      <span className="w-4 text-white/30 shrink-0 font-mono">{row.rank}</span>
                      <RankArrow rank={row.rank} lastRank={row.last_rank} />
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium ${row.is_user ? "text-emerald-300" : "text-white/80"}`}>{row.team}</p>
                        <p className="truncate text-[9px] text-white/30">{row.manager}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-white">{fmt(row.total)}</p>
                        <p className="text-[9px] text-white/40">GW: {row.gw_pts}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Squad ── */}
        <div
          className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Your Squad — {data.current_gw_name}</p>
            <div className="flex gap-3 text-xs text-white/40">
              <span>Bench: {data.points_on_bench}pts</span>
              {data.gw_transfers > 0 && (
                <span className={data.gw_transfer_cost > 0 ? "text-red-400" : ""}>
                  {data.gw_transfers} transfer{data.gw_transfers > 1 ? "s" : ""}
                  {data.gw_transfer_cost > 0 ? ` (-${data.gw_transfer_cost}pts)` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Starters */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-11 mb-4">
            {starters.map((p) => (
              <PlayerCard key={p.slot} p={p} bench={false} />
            ))}
          </div>

          {/* Bench divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">Bench</p>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Bench players */}
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto sm:max-w-sm">
            {bench.map((p) => (
              <PlayerCard key={p.slot} p={p} bench={true} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/20 pb-4">
          Live data via the FPL public API · Refreshes each page load
        </p>
      </div>
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
          <Link
            href={href}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110 transition-all"
          >
            {cta}
          </Link>
          <Link href="/devchat" className="text-sm text-white/40 hover:text-white transition-colors">
            Back to chat
          </Link>
        </div>
      </div>
    </div>
  )
}
