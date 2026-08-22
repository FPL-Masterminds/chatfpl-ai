import Link from "next/link"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { UpgradeCTAPanel } from "@/components/upgrade-cta-panel"
import { Reveal } from "@/components/scroll-reveal"
import { DEFCON_READY_MINUTES } from "@/lib/fpl-defcon"

const GREEN = "#00FF87"

interface DefconComingSoonProps {
  gw: number | string
  maxMinutes: number
  /** Optional context so the page reads correctly on a specific route */
  positionLabel?: string
  priceLabel?: string
  playerName?: string
  compareOf?: { a: string; b: string }
}

/**
 * Shared placeholder page rendered by every /fpl/defcon/* route while there
 * is not yet enough live-season data to publish DEFCON stats. Static content
 * only - no per-90 numbers, no rankings, no compare tables - so nothing on
 * the page can be misleading. Explains what DEFCON is and links out to hubs
 * that DO have live data right now.
 */
export function DefconComingSoon({
  gw,
  maxMinutes,
  positionLabel,
  priceLabel,
  playerName,
  compareOf,
}: DefconComingSoonProps) {

  const minutesGap = Math.max(0, DEFCON_READY_MINUTES - maxMinutes)
  const matchesGap = Math.max(1, Math.ceil(minutesGap / 90))
  const readyFromGw = typeof gw === "number" ? gw + matchesGap : "shortly"

  const heading = (() => {
    if (compareOf) return `${compareOf.a} vs ${compareOf.b} DEFCON: `
    if (playerName)   return `${playerName} DEFCON Analysis: `
    if (priceLabel && positionLabel) return `Best DEFCON ${positionLabel} Under ${priceLabel}: `
    if (positionLabel) return `Best DEFCON ${positionLabel}: `
    return "Fantasy Premier League DEFCON: "
  })()

  const subtitle = compareOf
    ? `Head-to-head DEFCON comparison launches once the season has enough sample size to publish reliable per-90 rates.`
    : playerName
    ? `${playerName}'s DEFCON deep dive launches once the season has enough sample size to publish reliable per-90 rates.`
    : `The full DEFCON rankings for Fantasy Premier League launch once the season has enough sample size to publish reliable per-90 rates. Currently no player in the league has passed ${DEFCON_READY_MINUTES} minutes - the minimum needed for the per-90 metric to be meaningful.`

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite={heading}
        headingGradient={`Launching around Gameweek ${readyFromGw}`}
        subtitle={subtitle}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-6">

          {/* Why the wait */}
          <Reveal>
            <div
              className="rounded-2xl px-6 py-6"
              style={{
                border: "1px solid rgba(0,255,135,0.25)",
                background: "rgba(0,255,135,0.03)",
                borderLeft: "4px solid #00FF87",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: GREEN }}>
                Why we are waiting
              </p>
              <p className="text-sm text-white/85 leading-relaxed">
                DEFCON is measured in matches per 90 minutes - the +2 point bonus awarded to defenders reaching 10+ clearances, blocks, interceptions and tackles, and to midfielders reaching 12+ including ball recoveries. Ranking players before they have played roughly four full matches would divide too small a sample by too small a denominator, producing rates that swing wildly from week to week and mislead anyone trying to plan transfers.
              </p>
              <p className="text-sm text-white/85 leading-relaxed mt-3">
                We would rather show you nothing than show you rankings that fall apart the moment the next Gameweek finishes. Once the top-minutes player in the league passes {DEFCON_READY_MINUTES} minutes (roughly four full matches), every DEFCON page on ChatFPL will populate automatically. Based on current data that is expected around Gameweek {readyFromGw}.
              </p>
            </div>
          </Reveal>

          {/* What DEFCON is */}
          <Reveal>
            <div
              className="rounded-2xl px-6 py-6"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: GREEN }}>
                What is DEFCON?
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                DEFCON is a scoring rule introduced for the 2025/26 Fantasy Premier League season. Defenders earn a +2 point bonus whenever their combined clearances, blocks, interceptions and tackles reach 10 or more in a single match. Midfielders earn the same +2 bonus when their combined clearances, blocks, interceptions, tackles and ball recoveries reach 12 or more. Goalkeepers and forwards do not qualify.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mt-3">
                Once the DEFCON hub launches, ChatFPL will rank every eligible defender and midfielder by DEFCON returns per 90 minutes - the fairest measure of who is genuinely reliable versus who has racked up counting stats through minutes alone.
              </p>
            </div>
          </Reveal>

          {/* Related hubs that DO have live data */}
          <Reveal>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-3 text-center">
                In the meantime, live now
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { href: "/fpl/captains",         label: "Captain Hub" },
                  { href: "/fpl/differentials",    label: "Differentials Hub" },
                  { href: "/fpl/comparisons",      label: "Head-to-Head Hub" },
                  { href: "/fpl/injuries",         label: "Injuries Hub" },
                  { href: "/fpl/transfer-trends",  label: "Transfer Market Trends" },
                  { href: "/fpl/fixtures",         label: "Fixture Difficulty" },
                  { href: "/fpl/gameweeks",        label: "DGW/BGW Planner" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                    style={{
                      border: "1px solid rgba(0,255,135,0.25)",
                      background: "rgba(0,255,135,0.06)",
                      color: GREEN,
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* CTA */}
          <div className="mt-6 text-center">
            <UpgradeCTAPanel
              heading="Have a DEFCON question you cannot wait to ask?"
              subline="ChatFPL AI can already answer questions about defensive contributions and how they might shape your Gameweek plans."
              chatQuery="Explain the DEFCON scoring rule and which defenders and midfielders looked strong for defensive contributions last season."
            />
          </div>

        </div>
      </main>
    </div>
  )
}
