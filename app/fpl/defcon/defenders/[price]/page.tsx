import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SeasonEnded } from "@/components/season-ended"
import { DevHeader } from "@/components/dev-header"
import { DefconPositionRender } from "@/components/defcon-position-render"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { getDefconPriceHub, DEFCON_PRICE_META, DEFCON_PRICE_SLUGS } from "@/lib/fpl-defcon"

export const revalidate = 43200
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  return DEFCON_PRICE_SLUGS.map(price => ({ price }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ price: string }>
}): Promise<Metadata> {
  const { price } = await params
  const priceMeta = DEFCON_PRICE_META[price]
  if (!priceMeta) return { title: "Best FPL DEFCON Defenders | ChatFPL AI" }
  const data = await getDefconPriceHub("defenders", price)
  const gw = data?.gw ?? "?"
  const title = `Best FPL DEFCON Defenders Under ${priceMeta.label} for Gameweek ${gw} | ChatFPL AI`
  const description = `Fantasy Premier League defenders priced at or below ${priceMeta.label} ranked by DEFCON returns per 90 minutes for Gameweek ${gw}. Full data, fixture context and analysis.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/defcon/defenders/${price}`,
    },
  }
}

export default async function DefconDefenderPricePage({
  params,
}: {
  params: Promise<{ price: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />
  const { price } = await params
  if (!DEFCON_PRICE_META[price]) notFound()
  const data = await getDefconPriceHub("defenders", price)
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <DevHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-white/60 text-center">DEFCON data is not available right now.</p>
        </main>
      </div>
    )
  }
  return <DefconPositionRender data={data} priceSlug={price} />
}
