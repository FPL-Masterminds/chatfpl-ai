import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { DevTeamsList } from "@/components/dev-teams-list"
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
    <div className="dev-teams-root flex min-h-screen flex-col bg-black overflow-x-hidden">
      <style>{`
        .dev-teams-root {
          scrollbar-color: rgba(0,255,135,0.28) rgba(255,255,255,0.04);
        }
        .dev-teams-root ::-webkit-scrollbar { width: 6px; height: 6px; }
        .dev-teams-root ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
        .dev-teams-root ::-webkit-scrollbar-thumb {
          background: rgba(0,255,135,0.28);
          border-radius: 99px;
        }
        .dev-teams-root ::selection {
          background: rgba(0,255,135,0.28);
          color: #fff;
        }
      `}</style>

      <DevHeader />

      <HubHero
        headingWhite="FPL Players "
        headingGradient="by Club"
        subtitle={`Pick a Premier League team to see every eligible player ranked by expected points, form, and fixture difficulty for Gameweek ${gw}.`}
        ctaHref="/chat"
        ctaLabel="Start Chatting for Free"
      />

      <main className="relative z-10 -mt-6 flex flex-col items-center px-4 pb-20 sm:-mt-8">
        <DevTeamsList teams={teams} gw={gw} />
      </main>
    </div>
  )
}
