"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Image from "next/image"

// ─── Player photo with fallback ───────────────────────────────────────────────

function PlayerPhoto({ code, name, width, height, className }: {
  code: number; name: string; width: number; height: number; className?: string
}) {
  const [errored, setErrored] = useState(false)
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  if (errored) {
    return (
      <div
        className={className}
        style={{
          width, height, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(0,255,135,0.04)",
          border: "1px solid rgba(0,255,135,0.12)",
          borderRadius: 8,
        }}
      >
        {/* Silhouette */}
        <svg width={width * 0.45} height={height * 0.55} viewBox="0 0 44 56" fill="none" aria-hidden>
          <circle cx="22" cy="14" r="10" fill="rgba(255,255,255,0.12)" />
          <path d="M2 54c0-11 9-20 20-20s20 9 20 20" fill="rgba(255,255,255,0.08)" />
        </svg>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: 600 }}>
          {initials}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`}
      alt={name} width={width} height={height}
      className={className}
      style={{ objectFit: "contain" }}
      unoptimized
      onError={() => setErrored(true)}
    />
  )
}
import Link from "next/link"
import type { InjuryPlayer } from "@/lib/fpl-injury"

const GREEN = "#00FF87"
const CYAN  = "#00FFFF"

// ─── Status helpers ───────────────────────────────────────────────────────────

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

// ─── Custom dropdown ──────────────────────────────────────────────────────────

interface DropdownOption {
  value: string
  label: string
  teamCode?: number
}

function CustomDropdown({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value) ?? options[0]

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: `1px solid ${open ? GREEN : "rgba(0,255,135,0.3)"}`,
          backdropFilter: "blur(8px)",
          boxShadow: open ? `0 0 12px rgba(0,255,135,0.2)` : "none",
        }}
      >
        {selected.teamCode && (
          <Image
            src={`https://resources.premierleague.com/premierleague/badges/70/t${selected.teamCode}.png`}
            alt={selected.label} width={14} height={14}
            style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
          />
        )}
        <span className="flex-1 text-left truncate">{selected.label}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M1 1l4 4 4-4" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl overflow-hidden py-1"
          style={{
            background: "rgba(10,14,20,0.97)",
            border: `1px solid rgba(0,255,135,0.25)`,
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          }}
        >
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition-colors"
              style={{
                color: o.value === value ? GREEN : "white",
                background: o.value === value ? "rgba(0,255,135,0.08)" : "transparent",
                fontWeight: o.value === value ? 700 : 400,
              }}
              onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,135,0.05)" }}
              onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
            >
              {o.teamCode && (
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/70/t${o.teamCode}.png`}
                  alt={o.label} width={14} height={14}
                  style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
                />
              )}
              {o.value === value && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 3l2 2 4-4" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
            <PlayerPhoto
              code={player.code} name={player.displayName}
              width={160} height={204} className="w-14 sm:w-[160px]"
            />
            <div className="w-14 sm:w-[160px]" style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">
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

          <div className="flex items-center justify-between gap-2"
            style={{ padding: "7px 10px", background: "#1A1A1A", borderRadius: 4 }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="shrink-0 rounded-full" style={{
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

// ─── Main export ──────────────────────────────────────────────────────────────

export function InjuryHubFilters({ players }: { players: InjuryPlayer[] }) {
  const [position, setPosition] = useState("all")
  const [team, setTeam]         = useState("all")
  const [status, setStatus]     = useState("all")

  const teams = useMemo(() => {
    const map = new Map<string, { name: string; code: number }>()
    players.forEach(p => { if (!map.has(p.club)) map.set(p.club, { name: p.club, code: p.teamCode }) })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [players])

  const filtered = useMemo(() => players.filter(p => {
    if (position !== "all" && p.position !== position) return false
    if (team !== "all" && p.club !== team) return false
    if (status === "injured"   && p.status !== "i") return false
    if (status === "doubtful"  && p.status !== "d") return false
    if (status === "suspended" && p.status !== "s") return false
    return true
  }), [players, position, team, status])

  const teamOptions: DropdownOption[] = [
    { value: "all", label: "All Teams" },
    ...teams.map(t => ({ value: t.name, label: t.name, teamCode: t.code })),
  ]

  return (
    <>
      <div className="w-full max-w-3xl mb-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <CustomDropdown
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
        <CustomDropdown value={team} onChange={setTeam} options={teamOptions} />
        <CustomDropdown
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
