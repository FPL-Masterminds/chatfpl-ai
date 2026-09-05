import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { getTeamSlugs, isSeasonOver } from "@/lib/fpl-player-page"
import { buildPageMetadata } from "@/lib/seo/metadata"

export const revalidate = 43200
export const dynamic = "force-dynamic"

const GREEN = "#00FF87"

export async function generateMetadata(): Promise<Metadata> {
  if (await isSeasonOver()) {
    return buildPageMetadata({
      title: "FPL Players by Club",
      description: "Browse Fantasy Premier League players by Premier League club on ChatFPL AI.",
      path: "/fpl/teams",
    })
  }
  return buildPageMetadata({
    title: "FPL Players by Club",
    description:
      "Browse every Premier League club on ChatFPL AI. Jump to team-specific expected points, form, fixtures, and transfer analysis for Gameweek planning.",
    path: "/fpl/teams",
  })
}

export default async function TeamsHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />

  const teams = await getTeamSlugs()

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Players "
        headingGradient="by Club"
        subtitle="Pick a Premier League team to see every eligible FPL player ranked by expected points, form, and fixture difficulty."
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-4xl">
          <Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {teams.map(({ teamSlug, teamName }) => (
                <Link
                  key={teamSlug}
                  href={`/fpl/team/${teamSlug}`}
                  className="rounded-2xl px-4 py-4 text-center text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    border: "1px solid rgba(0,255,135,0.2)",
                    background: "rgba(0,255,135,0.04)",
                    color: GREEN,
                  }}
                >
                  {teamName}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  )
}
