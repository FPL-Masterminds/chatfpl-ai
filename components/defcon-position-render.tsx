import Link from "next/link"
import { HubHero } from "@/components/hub-hero"
import { UpgradeCTAPanel } from "@/components/upgrade-cta-panel"
import { Reveal } from "@/components/scroll-reveal"
import { DevHeader } from "@/components/dev-header"
import { DefconPlayerCard } from "@/components/defcon-player-card"
import type { DefconPositionHubData, DefconPriceHubData } from "@/lib/fpl-defcon"
import { DEFCON_PRICE_META } from "@/lib/fpl-defcon"

const GREEN = "#00FF87"

interface Props {
  data: DefconPositionHubData | DefconPriceHubData
  priceSlug?: string
}

export function DefconPositionRender({ data, priceSlug }: Props) {
  const isPriceView = priceSlug !== undefined
  const priceLabel  = (data as DefconPriceHubData).priceLabel
  const priceCap    = (data as DefconPriceHubData).priceCap

  const heading = isPriceView
    ? `Best DEFCON ${data.positionLabel} Under ${priceLabel}`
    : `Best DEFCON ${data.positionLabel}`

  const gradientTail = `Gameweek ${data.gw}`

  const subtitle = isPriceView
    ? `${data.positionLabel} priced at or below ${priceLabel} ranked by DEFCON returns per 90 minutes. Bonus earned at ${data.cbitThreshold}+ clearances, blocks, interceptions${data.positionSlug === "midfielders" ? ", tackles and ball recoveries" : " and tackles"} in a match.`
    : `Every eligible ${data.positionSingular.toLowerCase()} in Fantasy Premier League ranked by DEFCON returns per 90 minutes. Bonus earned at ${data.cbitThreshold}+ clearances, blocks, interceptions${data.positionSlug === "midfielders" ? ", tackles and ball recoveries" : " and tackles"} in a match.`

  const relatedPrices = Object.entries(DEFCON_PRICE_META).filter(([slug]) => slug !== priceSlug)

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite={`${heading}: `}
        headingGradient={gradientTail}
        subtitle={subtitle}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">

          {data.early && (
            <Reveal>
              <div
                className="rounded-2xl px-5 py-4 text-center mb-2"
                style={{
                  border: "1px solid rgba(0,255,135,0.2)",
                  background: "rgba(0,255,135,0.03)",
                }}
              >
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Season is early - the sample size is small and cards flagged Small sample should be treated as directional. Rates will settle from Gameweek 7 or 8 onwards.
                </p>
              </div>
            </Reveal>
          )}

          {data.players.length === 0 ? (
            <p className="text-center text-white/50 py-16">
              No eligible {data.positionLabel.toLowerCase()}{isPriceView ? ` under ${priceLabel}` : ""} for Gameweek {data.gw}. This will populate as the season progresses.
            </p>
          ) : (
            data.players.map((player, i) => (
              <Reveal key={player.slug} delay={i * 0.04}>
                <DefconPlayerCard
                  player={player}
                  even={(i + 1) % 2 === 0}
                  cbitThreshold={data.cbitThreshold}
                />
              </Reveal>
            ))
          )}

          <p className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
            {isPriceView
              ? `Ranked by DEFCON returns per 90 minutes for Gameweek ${data.gw}. All eligible ${data.positionLabel.toLowerCase()} at or below ${priceLabel} (${priceCap / 10}m). Updated hourly.`
              : `Ranked by DEFCON returns per 90 minutes for Gameweek ${data.gw}. All eligible ${data.positionLabel.toLowerCase()}. Updated hourly.`
            }
          </p>

          {/* Related price brackets */}
          <div className="mt-10">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 text-center">
              {isPriceView ? "Other DEFCON price brackets" : `${data.positionLabel} by price`}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {relatedPrices.map(([slug, meta]) => (
                <Link
                  key={slug}
                  href={`/fpl/defcon/${data.positionSlug}/${slug}`}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    border: "1px solid rgba(0,255,135,0.25)",
                    background: "rgba(0,255,135,0.06)",
                    color: GREEN,
                  }}
                >
                  Under {meta.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Back to hub */}
          <div className="mt-10 text-center">
            <div
              className="inline-block"
              style={{
                padding: "1.5px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
                backgroundSize: "200% 200%",
                animation: "glow_scroll 3.5s linear infinite",
              }}
            >
              <Link
                href="/fpl/defcon"
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: "rgba(0,0,0,0.9)" }}
              >
                <span style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Back to the DEFCON Hub →
                </span>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div className="text-center">
            <UpgradeCTAPanel
              heading={`Which ${data.positionSingular.toLowerCase()} fits your squad on DEFCON grounds?`}
              subline="ChatFPL AI factors in your existing players, chip strategy and remaining budget."
              chatQuery={`Recommend a DEFCON ${data.positionSingular.toLowerCase()}${isPriceView ? ` under ${priceLabel}` : ""} for my squad in Gameweek ${data.gw}.`}
            />
          </div>

        </div>
      </main>
    </div>
  )
}
