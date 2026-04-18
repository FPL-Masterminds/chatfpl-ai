"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import type { InjuryPlayer } from "@/lib/fpl-injury"

const GREEN = "#00FF87"
const CYAN  = "#00FFFF"

// ─── Status pill ──────────────────────────────────────────────────────────────

function statusLabel(status: string, chance: number): string {
  if (status === "i") return "Injured"
  if (status === "s") return "Suspended"
  if (status === "d") return "Doubtful"
  if (chance === 0)   return "Ruled Out"
  if (chance < 100)   return `${chance}%`
  return "Available"
}

function StatusPill({ status, chance }: { status: string; chance: number }) {
  return (
    <span
      className="shrink-0 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black whitespace-nowrap"
      style={{ background: `linear-gradient(to right,${GREEN},${CYAN})` }}
    >
      {statusLabel(status, chance)}
    </span>
  )
}

// ─── Injury card ──────────────────────────────────────────────────────────────

function InjuryCard({ player, rank }: { player: InjuryPlayer; rank: number }) {
  const isAvailable = player.status === "a" && player.chance >= 100
  const stats = [
    { label: "Play Chance", value: isAvailable ? "100%" : `${player.chance}%` },
    { label: "Position",    value: player.position },
    { label: "Price",       value: player.price },
    { label: "Minutes",     value: `${player.minutes}` },
  ]

  return (
    <div style={{ background: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.18)", borderRadius: 12 }}>
      <div className="flex flex-row">
        {/* Photo strip */}
        <div
          className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
          style={{ minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div className="absolute top-2 left-2 z-10 flex items-center justify-center rounded"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.25)" }}
          >
            <span className="text-[10px] font-bold text-white">{rank}</span>
          </div>
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
              alt={player.displayName} width={160} height={204}
              className="w-14 sm:w-[160px]" style={{ objectFit: "contain" }} unoptimized
            />
            <div className="w-14 sm:w-[160px]" style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">
          {/* Name + badge + status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-semibold truncate text-sm sm:text-lg">{player.displayName}</h2>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                alt={player.club} width={20} height={20} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
            </div>
            <StatusPill status={player.status} chance={player.chance} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base text-transparent bg-clip-text"
                  style={{ backgroundImage: `linear-gradient(to right,${GREEN},${CYAN})`, WebkitBackgroundClip: "text" }}
                >{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* News + CTA */}
          <div className="flex items-center justify-between gap-2"
            style={{ padding: "7px 10px", background: "#1A1A1A", borderRadius: 4 }}
          >
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <span className="mt-[3px] shrink-0 rounded-full" style={{
                width: 7, height: 7, display: "inline-block",
                background: GREEN, boxShadow: `0 0 6px 2px ${GREEN}80`,
              }} />
              <p className="text-[11px] text-white leading-relaxed line-clamp-2">{player.news}</p>
            </div>
            <Link
              href={`/fpl/injury/${player.slug}`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              style={{ background: `linear-gradient(to right,${GREEN},${CYAN})`, color: "#1A0E24", padding: "6px 14px" }}
            >
              Full update
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; img?: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none cursor-pointer rounded-full pl-4 pr-8 py-2.5 text-xs font-semibold text-white outline-none transition-all"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(0,255,135,0.3)",
          backdropFilter: "blur(8px)",
          color: "white",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "#0d1117", color: "white" }}>
            {o.label}
          </option>
        ))}
      </select>
      {/* Chevron */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* Crest overlay for team filter — shows next to selected value */}
      {options.find(o => o.value === value)?.img && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {/* handled via option label */}
        </div>
      )}
    </div>
  )
}

// ─── Main filter component ────────────────────────────────────────────────────

export function InjuryHubFilters({ players }: { players: InjuryPlayer[] }) {
  const [position, setPosition] = useState("all")
  const [team, setTeam]         = useState("all")
  const [status, setStatus]     = useState("all")

  // Unique sorted teams
  const teams = useMemo(() => {
    const map = new Map<string, { name: string; code: number }>()
    players.forEach(p => { if (!map.has(p.club)) map.set(p.club, { name: p.club, code: p.teamCode }) })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [players])

  const filtered = useMemo(() => players.filter(p => {
    if (position !== "all" && p.position !== position) return false
    if (team !== "all" && p.club !== team) return false
    if (status !== "all") {
      if (status === "injured"   && p.status !== "i") return false
      if (status === "doubtful"  && p.status !== "d") return false
      if (status === "suspended" && p.status !== "s") return false
    }
    return true
  }), [players, position, team, status])

  const selectedTeamCode = teams.find(t => t.name === team)?.code

  return (
    <>
      {/* Filter bar */}
      <div className="w-full max-w-3xl mb-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Position */}
        <Dropdown
          value={position}
          onChange={setPosition}
          options={[
            { value: "all", label: "All Positions" },
            { value: "GKP", label: "Goalkeepers" },
            { value: "DEF", label: "Defenders" },
            { value: "MID", label: "Midfielders" },
            { value: "FWD", label: "Forwards" },
          ]}
        />

        {/* Team */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full pl-3 pr-8 py-2.5 cursor-pointer relative"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.3)", backdropFilter: "blur(8px)" }}
          >
            {selectedTeamCode && (
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${selectedTeamCode}.png`}
                alt={team} width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
            )}
            <select
              value={team}
              onChange={e => setTeam(e.target.value)}
              className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent text-xs font-semibold text-white outline-none"
              style={{ paddingLeft: selectedTeamCode ? "2.2rem" : "0.75rem", paddingRight: "2rem", color: "white" }}
            >
              <option value="all" style={{ background: "#0d1117", color: "white" }}>All Teams</option>
              {teams.map(t => (
                <option key={t.name} value={t.name} style={{ background: "#0d1117", color: "white" }}>{t.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status */}
        <Dropdown
          value={status}
          onChange={setStatus}
          options={[
            { value: "all",       label: "All Statuses" },
            { value: "injured",   label: "Injured" },
            { value: "doubtful",  label: "Doubtful" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </div>

      {/* Result count */}
      <p className="w-full max-w-3xl text-xs text-white/40 mb-3">
        {filtered.length} player{filtered.length !== 1 ? "s" : ""} shown
      </p>

      {/* Cards */}
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-white/40 py-12 text-sm">No players match these filters.</p>
        ) : (
          filtered.map((player, i) => (
            <InjuryCard key={player.slug} player={player} rank={i + 1} />
          ))
        )}
      </div>
    </>
  )
}
