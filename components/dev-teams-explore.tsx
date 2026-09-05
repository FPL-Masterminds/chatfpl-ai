"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export type DevTeamRow = {
  teamSlug: string
  teamName: string
  teamShort: string
  teamCode: number
}

const GREEN = "#00FF87"
const CYAN = "#00FFFF"

function groupByLetter(teams: DevTeamRow[]) {
  const groups = new Map<string, DevTeamRow[]>()
  for (const team of teams) {
    const letter = team.teamName.charAt(0).toUpperCase()
    const bucket = groups.get(letter) ?? []
    bucket.push(team)
    groups.set(letter, bucket)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function DevTeamsExplore({ teams, gw }: { teams: DevTeamRow[]; gw: number | string }) {
  const [query, setQuery] = useState("")
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter((t) => {
      if (activeLetter && t.teamName.charAt(0).toUpperCase() !== activeLetter) return false
      if (!q) return true
      return (
        t.teamName.toLowerCase().includes(q) ||
        t.teamShort.toLowerCase().includes(q) ||
        t.teamSlug.includes(q)
      )
    })
  }, [teams, query, activeLetter])

  const letters = useMemo(
    () => [...new Set(teams.map((t) => t.teamName.charAt(0).toUpperCase()))].sort(),
    [teams],
  )

  const grouped = useMemo(() => groupByLetter(filtered), [filtered])

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-white/55 mb-3">
            Gameweek {gw} · {teams.length} Premier League squads
          </p>
          <label htmlFor="dev-teams-search" className="sr-only">
            Search clubs
          </label>
          <input
            id="dev-teams-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by club name or code"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[rgba(0,255,135,0.45)] focus:bg-white/[0.06]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveLetter(null)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              border: `1px solid ${activeLetter === null ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.12)"}`,
              background: activeLetter === null ? "rgba(0,255,135,0.12)" : "transparent",
              color: activeLetter === null ? GREEN : "rgba(255,255,255,0.65)",
            }}
          >
            All
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setActiveLetter(letter)}
              className="rounded-full px-3 py-1.5 text-xs font-medium tabular-nums transition-colors"
              style={{
                border: `1px solid ${activeLetter === letter ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.12)"}`,
                background: activeLetter === letter ? "rgba(0,255,135,0.12)" : "transparent",
                color: activeLetter === letter ? GREEN : "rgba(255,255,255,0.65)",
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/50">
          No clubs match that search. Try a different name or clear the filters.
        </p>
      ) : (
        <div className="space-y-12">
          {grouped.map(([letter, letterTeams]) => (
            <section key={letter} aria-labelledby={`club-letter-${letter}`}>
              <h2
                id={`club-letter-${letter}`}
                className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-white/40"
              >
                {letter}
              </h2>
              <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] overflow-hidden">
                {letterTeams.map((team, index) => (
                  <li key={team.teamSlug}>
                    <Link
                      href={`/fpl/team/${team.teamSlug}`}
                      className="dev-team-row group flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(0,255,135,0.55)]"
                      style={{
                        animationDelay: `${Math.min(index * 35, 420)}ms`,
                      }}
                    >
                      <span
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 transition-transform group-hover:scale-[1.03]"
                        style={{ boxShadow: "inset 0 0 0 1px rgba(0,255,135,0.08)" }}
                      >
                        <Image
                          src={`https://resources.premierleague.com/premierleague/badges/70/t${team.teamCode}.png`}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 object-contain"
                          unoptimized
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-base sm:text-lg font-semibold text-white group-hover:text-[#00FF87] transition-colors">
                          {team.teamName}
                        </span>
                        <span className="mt-1 block text-sm text-white/45">
                          Expected points, form, and fixtures for every eligible player
                        </span>
                      </span>

                      <span className="hidden sm:flex items-center gap-3 shrink-0">
                        <span
                          className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/70"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {team.teamShort}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{
                            background: `linear-gradient(to right, ${GREEN}, ${CYAN})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Open squad
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <style>{`
        .dev-team-row {
          animation: devTeamRowIn 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes devTeamRowIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dev-team-row { animation: none; }
        }
      `}</style>
    </div>
  )
}
