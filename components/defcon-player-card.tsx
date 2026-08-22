import Image from "next/image"
import Link from "next/link"
import { HubPlayerPhoto } from "@/components/hub-player-photo"
import type { DefconPlayer } from "@/lib/fpl-defcon"

const GREEN = "#00FF87"

const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

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

export interface DefconPlayerCardProps {
  player: DefconPlayer
  even?: boolean
  cbitThreshold: number
}

export function DefconPlayerCard({ player, even = false, cbitThreshold }: DefconPlayerCardProps) {
  const dc90 = player.dc90.toFixed(2)

  const stats = [
    { label: "DC/90",  value: dc90 },
    { label: "DC",     value: String(player.dc) },
    { label: "CBIT",   value: String(player.cbit) },
    { label: "Mins",   value: player.minutes.toLocaleString("en-GB") },
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
          style={{ minHeight: 172, background: "rgba(0,0,0,0.4)", borderRadius: "11px 0 0 11px", padding: "16px 8px" }}
        >
          <div
            className="absolute top-2 right-2 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            {player.position}
          </div>
          {player.smallSample && (
            <div
              className="absolute top-2 left-2 z-10 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
              style={{
                background: "linear-gradient(90deg, rgba(0,255,135,0.18), rgba(0,255,255,0.18))",
                color: GREEN,
                border: "1px solid rgba(0,255,135,0.35)",
              }}
              title={`Small sample: ${player.minutes} minutes played so far`}
            >
              Small sample
            </div>
          )}
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
              <Link
                href={`/fpl/defcon/${player.slug}`}
                className="text-white font-semibold truncate text-sm sm:text-lg hover:underline"
              >
                {player.displayName}
              </Link>
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

          {/* Row 2: DEFCON stats */}
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
              <span className="text-white/20 text-[10px]">|</span>
              <span className="text-[10px] sm:text-[11px] text-white/70">
                Bonus at {cbitThreshold}+ CBIT
              </span>
            </div>
            <Link
              href={`/fpl/defcon/${player.slug}`}
              className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
            >
              DEFCON analysis
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
