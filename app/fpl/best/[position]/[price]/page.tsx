import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { HubHero } from "@/components/hub-hero"
import { HubCardExpand } from "@/components/hub-card-expand"
import { Reveal } from "@/components/scroll-reveal"
import { SeasonEnded } from "@/components/season-ended"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import {
  getBestValueHub,
  isSeasonOver,
  BEST_VALUE_COMBOS,
  POSITION_META,
  PRICE_META,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page"

export const revalidate = 43200
export const dynamic = "force-dynamic"

const GREEN = "#00FF87"
const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return BEST_VALUE_COMBOS
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ position: string; price: string }>
}): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "Best FPL Players | ChatFPL AI" }
  const { position, price } = await params
  const posMeta   = POSITION_META[position]
  const priceMeta = PRICE_META[price]
  if (!posMeta || !priceMeta) return { title: "Best FPL Players | ChatFPL AI" }

  const data = await getBestValueHub(position, price)
  const gw   = data?.gw ?? "?"

  const title = `Best FPL ${posMeta.label} Under ${priceMeta.label} Gameweek ${gw} | ChatFPL AI`
  const description = `The best FPL ${posMeta.label.toLowerCase()} under ${priceMeta.label} for Gameweek ${gw}, ranked by expected points. Form, fixture difficulty and ownership data for every pick.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.chatfpl.ai/fpl/best/${position}/${price}`,
    },
  }
}

// ─── Analysis text - 3 rotating templates ─────────────────────────────────────

function buildValueText(
  player: CaptainHubPlayer,
  gw: number | string,
  rank: number,
  priceLabel: string,
  positionSingular: string,
  randomBase: number,
): string {
  const name      = player.displayName
  const ep        = player.ep_next.toFixed(1)
  const formNum   = parseFloat(player.form)
  const form      = player.form
  const price     = player.price
  const ownership = player.ownership
  const fdrLabel  = FDR_LABELS[player.fdrNext ?? 3] ?? "Medium"
  const fixture   = player.opponentName
    ? `${player.opponentName} (${player.isHome ? "H" : "A"})`
    : "their next opponent"
  const formLine  = formNum > 0
    ? `Form of ${form} points per game over the last six gameweeks backs the projection.`
    : `Recent form returns have been limited, making the fixture the primary case.`

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `${name} is the number ${rank} ranked ${positionSingular.toLowerCase()} under ${priceLabel} heading into Gameweek ${gw}, ` +
      `with the model projecting ${ep} expected points. ` +
      `At ${price}, that is one of the stronger expected-points-per-pound returns in this bracket. ` +
      `${formLine} ` +
      `A ${fdrLabel} rated fixture against ${fixture} provides a clear pathway to a return. ` +
      `Owned by ${ownership}% of managers, ${name} sits in a useful ownership bracket.`
  }

  if (variant === 1) {
    return `At ${price}, ${name} faces ${fixture} in Gameweek ${gw}, a fixture rated ${fdrLabel} for difficulty. ` +
      `The model projects ${ep} expected points. ` +
      `${formLine} ` +
      `Within the under-${priceLabel} ${positionSingular.toLowerCase()} bracket, ` +
      `${ep} xPts places ${name} near the top of what this price range currently offers. ` +
      `At ${ownership}% ownership the rank impact of a return is real but manageable.`
  }

  return `The case for ${name} in the under-${priceLabel} ${positionSingular.toLowerCase()} bracket comes down to three things: ` +
    `a ${fdrLabel} fixture against ${fixture} in Gameweek ${gw}, ` +
    `${formNum > 0 ? `form of ${form} points per game over the last six gameweeks,` : `limited recent form returns,`} ` +
    `and ${ep} expected points from the model. ` +
    `At ${price}, ${name} does not require you to sacrifice depth elsewhere in the squad ` +
    `to the same degree as premium options. ` +
    `Owned by ${ownership}% of managers, the data makes a clear case at this price point.`
}

// ─── FDR dots + label ─────────────────────────────────────────────────────────

function FdrDots({ fdr }: { fdr: number | null }) {
  if (fdr === null) return null
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="block rounded-full" style={{
          width: 7, height: 7,
          background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
        }} />
      ))}
    </span>
  )
}

function FdrLabel({ fdr }: { fdr: number | null }) {
  if (fdr === null) return <span className="text-white/30 text-xs">-</span>
  return (
    <span className="text-xs font-semibold text-white">
      {FDR_LABELS[fdr] ?? fdr}
    </span>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  player, rank, even, gw, text,
}: {
  player: CaptainHubPlayer
  rank: number
  even: boolean
  gw: number | string
  text: string
}) {
  const transfersLabel = player.transfersIn >= 1000
    ? `${(player.transfersIn / 1000).toFixed(1)}k`
    : `${player.transfersIn}`

  const stats = [
    { label: "xPts",         value: player.ep_next.toFixed(1) },
    { label: "Form",         value: player.form },
    { label: "Owned",        value: `${player.ownership}%` },
    { label: "Transfers In", value: transfersLabel },
  ]

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 65% 50%, rgba(0,255,135,0.18) 0%, rgba(0,255,135,0.07) 45%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ height: 2, background: "linear-gradient(to right,#00FF87,#00FFFF)", opacity: 0.6 }} />
      <div className="flex flex-row">

        {/* Left - photo strip */}
        <div
          className="relative shrink-0 w-20 sm:w-52 flex flex-col items-center justify-center"
          style={{ minHeight: 168, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div
            className="absolute top-2 left-2 z-10 flex items-center justify-center rounded"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.25)" }}
          >
            <span className="text-[10px] font-bold tabular-nums text-white">{rank}</span>
          </div>
          <div
            className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-[160px]">
              <HubPlayerPhoto code={player.code} name={player.displayName} />
            </div>
            <div className="w-14 sm:w-[160px]" style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Right - data */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 gap-2.5">

          {/* Row 1: name + badge + price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-semibold truncate text-sm sm:text-lg">{player.displayName}</h2>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                alt={player.club}
                width={20} height={20}
                style={{ objectFit: "contain", flexShrink: 0 }}
                unoptimized
              />
            </div>
            <span className="font-bold text-white text-base sm:text-xl shrink-0">{player.price}</span>
          </div>

          {/* Row 2: stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {stats.map(s => (
              <div key={s.label} style={{ background: "#1A1A1A", borderRadius: 4, padding: "7px 8px" }}>
                <p className="font-bold tabular-nums text-sm sm:text-base" style={{ color: GREEN }}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 text-white">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Row 3: FDR + opponent + CTA */}
          <div className="flex items-center justify-between gap-2" style={{
            padding: "7px 10px", background: "#1A1A1A", borderRadius: 4,
          }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-white">FDR:</span>
                <FdrDots fdr={player.fdrNext} />
                <FdrLabel fdr={player.fdrNext} />
              </div>
              {player.opponentName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/20 text-[10px]">|</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white">
                    {player.opponentName} ({player.isHome ? "H" : "A"})
                  </span>
                  {player.opponentCode && (
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/70/t${player.opponentCode}.png`}
                      alt={player.opponentName}
                      width={16} height={16}
                      style={{ objectFit: "contain", flexShrink: 0 }}
                      unoptimized
                    />
                  )}
                </div>
              )}
            </div>
            <Link
              href={`/fpl/${player.slug}/transfer`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
            >
              Transfer analysis
            </Link>
          </div>

        </div>
      </div>

      {/* Expandable analysis */}
      <div className="border-t px-4 py-3" style={{ borderColor: "rgba(0,255,135,0.18)" }}>
        <HubCardExpand
          slug={player.slug}
          gw={gw}
          text={text}
          promptLabel={`Is ${player.displayName} worth signing in GW${gw}?`}
        />
      </div>
    </div>
  )
}

// ─── Related price brackets nav ───────────────────────────────────────────────

function RelatedBrackets({
  currentPosition,
  currentPrice,
}: {
  currentPosition: string
  currentPrice: string
}) {
  const related = BEST_VALUE_COMBOS.filter(
    (c) => c.position === currentPosition && c.price !== currentPrice
  )
  if (related.length === 0) return null

  return (
    <div className="mt-10">
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 text-center">
        Other price brackets
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {related.map((c) => {
          const pm = PRICE_META[c.price]
          return (
            <Link
              key={c.price}
              href={`/fpl/best/${c.position}/${c.price}`}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105"
              style={{
                border: "1px solid rgba(0,255,135,0.25)",
                background: "rgba(0,255,135,0.06)",
                color: GREEN,
              }}
            >
              Under {pm?.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BestValueHubPage({
  params,
}: {
  params: Promise<{ position: string; price: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />

  const { position, price } = await params
  const data = await getBestValueHub(position, price)
  if (!data) notFound()

  const { gw, players, positionLabel, positionSingular, priceLabel } = data
  const randomBase = Math.floor(Math.random() * 3)

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <HubHero
        headingWhite={`Best FPL ${positionLabel} Under `}
        headingGradient={`${priceLabel}: Gameweek ${gw}`}
        subtitle={`All fit FPL ${positionLabel.toLowerCase()} under ${priceLabel} ranked by expected points for Gameweek ${gw}. Form, fixture difficulty and ownership updated hourly.`}
      />

      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">

          {players.length === 0 ? (
            <p className="text-center text-white/50 py-16">
              No eligible {positionLabel.toLowerCase()} found under {priceLabel} for Gameweek {gw}.
            </p>
          ) : (
            players.map((player, i) => (
              <Reveal key={player.slug} delay={i * 0.05}>
                <PlayerCard
                  player={player}
                  rank={i + 1}
                  even={(i + 1) % 2 === 0}
                  gw={gw}
                  text={buildValueText(player, gw, i + 1, priceLabel, positionSingular, randomBase)}
                />
              </Reveal>
            ))
          )}

          <p className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
            Ranked by expected points for Gameweek {gw}. Includes all fit {positionLabel.toLowerCase()} priced at or below {priceLabel}. Updated hourly.
          </p>

          {/* Related price brackets */}
          <RelatedBrackets currentPosition={position} currentPrice={price} />

          {/* Divider */}
          <div className="my-10 h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(0,255,135,0.2), transparent)" }} />

          {/* CTA */}
          <div
            className="rounded-2xl px-8 py-10 text-center"
            style={{ border: "1px solid rgba(0,255,135,0.18)", borderLeft: "4px solid #00FF87", background: "rgba(0,255,135,0.04)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">ChatFPL AI</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-tight">
              Not sure which {positionSingular.toLowerCase()} fits your squad?
            </h2>
            <p className="text-sm text-white/60 mb-7">
              ChatFPL AI analyses your actual squad, budget, and rivals to recommend the best {positionSingular.toLowerCase()} under {priceLabel} for your specific team. Try it free. No credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
              Try ChatFPL AI for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
