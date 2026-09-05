import Image from "next/image"
import Link from "next/link"

export type TeamRow = {
  teamSlug: string
  teamName: string
  teamShort: string
  teamCode: number
}

const GREEN = "#00FF87"
const CYAN = "#00FFFF"

function groupByLetter(teams: TeamRow[]) {
  const groups = new Map<string, TeamRow[]>()
  for (const team of teams) {
    const letter = team.teamName.charAt(0).toUpperCase()
    const bucket = groups.get(letter) ?? []
    bucket.push(team)
    groups.set(letter, bucket)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function TeamsList({ teams }: { teams: TeamRow[] }) {
  const grouped = groupByLetter(teams)

  return (
    <div className="w-full max-w-5xl mx-auto">
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
              {letterTeams.map((team) => (
                <li key={team.teamSlug}>
                  <Link
                    href={`/fpl/team/${team.teamSlug}`}
                    className="group flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(0,255,135,0.55)]"
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
                      <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/70">
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
    </div>
  )
}
