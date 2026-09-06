"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Reveal } from "@/components/scroll-reveal"

export type DevTeamRow = {
  teamSlug: string
  teamName: string
  teamShort: string
  teamCode: number
}

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

function scrollToLetter(letter: string) {
  const target = document.getElementById(`club-letter-${letter}`)
  if (!target) return
  target.scrollIntoView({ behavior: "smooth", block: "start" })
  if (history.replaceState) {
    history.replaceState(null, "", `#club-letter-${letter}`)
  }
}

export function DevTeamsList({
  teams,
  gw,
}: {
  teams: DevTeamRow[]
  gw: number | string
}) {
  const grouped = groupByLetter(teams)
  const letters = grouped.map(([letter]) => letter)
  let rowIndex = 0

  if (teams.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-base font-semibold text-white">No clubs available right now</p>
        <p className="mt-2 text-sm text-white/50">Check back shortly. FPL squad data refreshes hourly.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Reveal>
        <div
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.25rem" }}
        >
          <div>
            <p className="text-sm font-medium text-white/70">
              {teams.length} Premier League clubs
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/45">
              Jump to a squad for expected points, form, and fixture difficulty in Gameweek {gw}.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35 sm:text-right">
            GW{gw}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <nav aria-label="Jump to club by letter" className="mb-8">
          <ul className="flex flex-wrap gap-2">
            {letters.map((letter) => (
              <li key={letter}>
                <button
                  type="button"
                  onClick={() => scrollToLetter(letter)}
                  className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm font-semibold text-white/70 transition-colors hover:border-[rgba(0,255,135,0.35)] hover:bg-[rgba(0,255,135,0.06)] hover:text-[#00FF87] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,255,135,0.55)]"
                >
                  {letter}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </Reveal>

      <ul className="overflow-hidden rounded-2xl border border-white/[0.08]">
        {grouped.map(([letter, letterTeams]) => (
          <li key={letter}>
            <h2
              id={`club-letter-${letter}`}
              className="scroll-mt-28 bg-white/[0.02] px-4 py-3 text-[11px] font-semibold tracking-[0.22em] text-white/40 sm:px-5"
            >
              {letter}
            </h2>
            <ul className="divide-y divide-white/[0.06]">
              {letterTeams.map((team) => {
                const delay = rowIndex * 0.04
                rowIndex += 1
                return (
                  <li key={team.teamSlug}>
                    <Reveal delay={delay}>
                      <Link
                        href={`/fpl/team/${team.teamSlug}`}
                        className="group flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(0,255,135,0.55)] sm:gap-5 sm:px-5 sm:py-5"
                      >
                        <span
                          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/50 transition-[transform,box-shadow] duration-200 group-hover:scale-[1.03] group-hover:shadow-[0_8px_28px_rgba(0,255,135,0.12)]"
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
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-base font-semibold text-white transition-colors group-hover:text-[#00FF87] sm:text-lg">
                              {team.teamName}
                            </span>
                            <span className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white/55">
                              {team.teamShort}
                            </span>
                          </span>
                          <span className="mt-1 block text-sm text-white/45 sm:hidden">
                            View squad for GW{gw}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-white/45 transition-colors group-hover:text-[#00FF87]">
                          <span className="hidden sm:inline">Open squad</span>
                          <ChevronRight
                            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      <Reveal delay={0.1}>
        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/40">
          Squad pages rank eligible FPL players by expected points for GW{gw}. Updated hourly.
        </p>
        <div
          className="mx-auto mt-10 h-px w-full max-w-md"
          style={{ background: `linear-gradient(to right, transparent, rgba(0,255,135,0.22), transparent)` }}
          aria-hidden
        />
      </Reveal>
    </div>
  )
}
