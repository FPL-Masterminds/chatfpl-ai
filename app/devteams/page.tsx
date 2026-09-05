import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { DevHeader } from "@/components/dev-header"
import { DevTeamsExplore } from "@/components/dev-teams-explore"
import { getCaptainHub, getTeamSlugs, isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"

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
    <div className="dev-teams-root flex min-h-screen flex-col bg-[#050505] text-white overflow-x-hidden">
      <style>{`
        .dev-teams-root ::-webkit-scrollbar { width: 4px; }
        .dev-teams-root ::-webkit-scrollbar-thumb { background: rgba(0,255,135,0.22); border-radius: 99px; }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(0,255,135,0.035) 79px, rgba(0,255,135,0.035) 80px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 12% -10%, rgba(0,255,135,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0,207,255,0.08) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <DevHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-20 sm:px-6">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" />
            Dev sandbox · not indexed
          </p>
          <h1 className="text-balance text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
            Pick a club. Read the squad like a matchday sheet.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base sm:text-lg leading-relaxed text-white/60">
            Every Premier League team in one directory. Jump straight into live expected points,
            form, and fixture context for Gameweek {gw}.
          </p>
          <p className="mt-6 text-sm text-white/40">
            Production page:{" "}
            <Link href="/fpl/teams" className="text-[#00FF87] hover:underline">
              https://www.chatfpl.ai/fpl/teams
            </Link>
          </p>
        </div>

        <DevTeamsExplore teams={teams} gw={gw} />
      </main>
    </div>
  )
}
