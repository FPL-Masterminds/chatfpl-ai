import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { TeamsList } from "@/components/teams-list"
import { SeasonEnded } from "@/components/season-ended"
import { getCaptainHub, getTeamSlugs, isSeasonOver } from "@/lib/fpl-player-page"

export const dynamic = "force-dynamic"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"

export const metadata: Metadata = {
  title: "Dev Teams",
  robots: { index: false, follow: false },
}

export default async function DevTeamsPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== ALLOWED_EMAIL) redirect("/login")

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
