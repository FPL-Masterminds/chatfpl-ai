import type { Metadata } from "next"
import { SeasonEnded } from "@/components/season-ended"
import { DevHeader } from "@/components/dev-header"
import { DefconPositionRender } from "@/components/defcon-position-render"
import { DefconComingSoon } from "@/components/defcon-coming-soon"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { getDefconPositionHub } from "@/lib/fpl-defcon"

export const revalidate = 43200
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const data = await getDefconPositionHub("defenders")
  const gw = data?.gw ?? "?"
  const title = `Best FPL DEFCON Defenders for Gameweek ${gw} | ChatFPL AI`
  const description = `Every eligible Fantasy Premier League defender ranked by DEFCON returns per 90 minutes for Gameweek ${gw}. The +2pt bonus triggers at 10+ clearances, blocks, interceptions and tackles per match.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://www.chatfpl.ai/fpl/defcon/defenders",
    },
  }
}

export default async function DefconDefendersPage() {
  if (await isSeasonOver()) return <SeasonEnded />
  const data = await getDefconPositionHub("defenders")
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <DevHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-white/60 text-center">DEFCON defenders data is not available right now.</p>
        </main>
      </div>
    )
  }
  if (!data.ready) return <DefconComingSoon gw={data.gw} maxMinutes={data.maxMinutes} positionLabel="Defenders" />
  return <DefconPositionRender data={data} />
}
