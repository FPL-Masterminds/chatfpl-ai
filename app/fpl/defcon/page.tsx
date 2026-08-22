import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { UpgradeCTAPanel } from "@/components/upgrade-cta-panel"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { DefconPlayerCard } from "@/components/defcon-player-card"
import { DefconComingSoon } from "@/components/defcon-coming-soon"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { getDefconHub, DEFCON_PRICE_META } from "@/lib/fpl-defcon"

export const revalidate = 43200
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const data = await getDefconHub()
  const gw = data?.gw ?? "?"
  const ready = data?.ready ?? false
  const title = ready
    ? `Fantasy Premier League DEFCON: Best Defensive Contribution Picks for Gameweek ${gw} | ChatFPL AI`
    : `Fantasy Premier League DEFCON: The 2025/26 Defensive Contribution Guide | ChatFPL AI`
  const description = ready
    ? `The most reliable DEFCON defenders and midfielders in Fantasy Premier League for Gameweek ${gw}, ranked by defensive contributions per 90 minutes. Full data, fixture context and price-banded breakdowns.`
    : `DEFCON is the 2025/26 Fantasy Premier League bonus for defenders and midfielders hitting the CBIT threshold. Full rankings launch once the season has enough data to publish reliable per-90 rates.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://www.chatfpl.ai/fpl/defcon",
    },
  }
}

const GREEN = "#00FF87"

function PriceBandGrid({ position }: { position: "defenders" | "midfielders" }) {
  const label = position === "defenders" ? "Defenders" : "Midfielders"
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 text-center">
        {label} by price
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(DEFCON_PRICE_META).map(([slug, meta]) => (
          <Link
            key={slug}
            href={`/fpl/defcon/${position}/${slug}`}
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
  )
}

export default async function DefconHubPage() {
  if (await isSeasonOver()) return <SeasonEnded />
  const data = await getDefconHub()
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <DevHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-white/60 text-center">DEFCON data is not available right now. Please check back shortly.</p>
        </main>
      </div>
    )
  }

  if (!data.ready) return <DefconComingSoon gw={data.gw} maxMinutes={data.maxMinutes} />

  const { gw, defenders, midfielders, early } = data

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite="Fantasy Premier League DEFCON: "
        headingGradient={`Best Defensive Contribution Picks for Gameweek ${gw}`}
        subtitle={`The most reliable defenders and midfielders in Fantasy Premier League for Gameweek ${gw}, ranked by the new Defensive Contribution scoring rule. Data refreshes hourly.`}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* What is DEFCON explainer */}
          <Reveal>
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                border: "1px solid rgba(0,255,135,0.2)",
                background: "rgba(0,255,135,0.03)",
                borderLeft: "4px solid #00FF87",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: GREEN }}>
                What is DEFCON?
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                DEFCON is a scoring rule introduced for the 2025/26 Fantasy Premier League season. Defenders earn a +2 point bonus whenever their combined clearances, blocks, interceptions and tackles reach 10 or more in a single match. Midfielders earn the same +2 bonus when their combined clearances, blocks, interceptions, tackles and ball recoveries reach 12 or more. Goalkeepers and forwards do not qualify.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mt-3">
                The pages below rank every eligible defender and midfielder by DEFCON returns per 90 minutes - the fairest measure of who is genuinely reliable versus who has racked up counting stats through minutes alone.
              </p>
            </div>
          </Reveal>

          {early && (
            <Reveal>
              <div
                className="rounded-2xl px-5 py-4 text-center"
                style={{
                  border: "1px solid rgba(0,255,135,0.2)",
                  background: "rgba(0,255,135,0.03)",
                }}
              >
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Season is early - rates below reflect a small sample and will settle from Gameweek 7 or 8 onwards. Cards flagged Small sample should be treated as directional rather than definitive.
                </p>
              </div>
            </Reveal>
          )}

          {/* Top defenders */}
          <section>
            <Reveal>
              <h2 className="text-lg font-bold text-center mb-1">
                <span className="text-white">Top 10 </span>
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  DEFCON Defenders
                </span>
              </h2>
              <p className="text-center text-white/50 text-xs mb-6">
                Ranked by DEFCON returns per 90 minutes. Bonus at 10+ clearances, blocks, interceptions and tackles.
              </p>
            </Reveal>
            <div className="flex flex-col gap-3">
              {defenders.length === 0 ? (
                <p className="text-center text-white/40 py-6">No eligible defenders yet - check back later in the season.</p>
              ) : defenders.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.04}>
                  <DefconPlayerCard player={p} even={i % 2 === 0} cbitThreshold={10} />
                </Reveal>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/fpl/defcon/defenders"
                className="inline-block rounded-full px-5 py-2 text-xs font-semibold transition-all hover:scale-105"
                style={{
                  border: "1px solid rgba(0,255,135,0.35)",
                  background: "rgba(0,255,135,0.08)",
                  color: GREEN,
                }}
              >
                See the full DEFCON defenders ranking →
              </Link>
            </div>
          </section>

          <div className="my-4 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* Top midfielders */}
          <section>
            <Reveal>
              <h2 className="text-lg font-bold text-center mb-1">
                <span className="text-white">Top 10 </span>
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  DEFCON Midfielders
                </span>
              </h2>
              <p className="text-center text-white/50 text-xs mb-6">
                Ranked by DEFCON returns per 90 minutes. Bonus at 12+ clearances, blocks, interceptions, tackles and ball recoveries.
              </p>
            </Reveal>
            <div className="flex flex-col gap-3">
              {midfielders.length === 0 ? (
                <p className="text-center text-white/40 py-6">No eligible midfielders yet - check back later in the season.</p>
              ) : midfielders.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.04}>
                  <DefconPlayerCard player={p} even={i % 2 === 0} cbitThreshold={12} />
                </Reveal>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/fpl/defcon/midfielders"
                className="inline-block rounded-full px-5 py-2 text-xs font-semibold transition-all hover:scale-105"
                style={{
                  border: "1px solid rgba(0,255,135,0.35)",
                  background: "rgba(0,255,135,0.08)",
                  color: GREEN,
                }}
              >
                See the full DEFCON midfielders ranking →
              </Link>
            </div>
          </section>

          <div className="my-4 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* Price band nav */}
          <Reveal>
            <PriceBandGrid position="defenders" />
          </Reveal>
          <Reveal>
            <PriceBandGrid position="midfielders" />
          </Reveal>

          <div className="my-4 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div className="text-center">
            <UpgradeCTAPanel
              heading="Which DEFCON asset fits your specific squad and budget?"
              subline="Get a tailored recommendation from ChatFPL AI factoring in your existing players, chip strategy and remaining budget."
              chatQuery={`Recommend the best DEFCON defender and midfielder for my squad in Gameweek ${gw}.`}
            />
          </div>

        </div>
      </main>
    </div>
  )
}
