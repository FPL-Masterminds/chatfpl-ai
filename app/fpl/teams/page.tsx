import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { TeamsList } from "@/components/teams-list"
import { SeasonEnded } from "@/components/season-ended"
import { getCaptainHub, getTeamSlugs, isSeasonOver } from "@/lib/fpl-player-page"
import { buildPageMetadata } from "@/lib/seo/metadata"

export const revalidate = 43200
export const dynamic = "force-dynamic"

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

  const [teams, captainHub] = await Promise.all([getTeamSlugs(), getCaptainHub()])
  const gw = captainHub?.gw ?? "?"

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="FPL Players "
        headingGradient="by Club"
        subtitle={`Pick a Premier League team to see every eligible player ranked by expected points, form, and fixture difficulty for Gameweek ${gw}.`}
        ctaHref="/chat"
        ctaLabel="Start Chatting for Free"
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <TeamsList teams={teams} />
      </main>
    </div>
  )
}
