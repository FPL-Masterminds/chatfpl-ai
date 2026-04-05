"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"

const POS_COLOR: Record<string, string> = {
  FWD: "#ef4444",
  MID: "#22d3ee",
  DEF: "#4ade80",
  GKP: "#facc15",
}

function badgeUrl(teamCode: number) {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`
}

function photoUrl(code: number) {
  return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`
}

interface CardPlayer {
  code: number
  name: string
  team: string
  teamCode: number
  pos: string
  price: string
  form: string
  total_points: number
}

// [far-left, near-left, center, near-right, far-right]
const CARD_SIZES = [
  { cardW: 148, cardH: 216, photoW: 88,  photoBottom: 104, opacity: 0.38 },
  { cardW: 178, cardH: 258, photoW: 108, photoBottom: 124, opacity: 0.68 },
  { cardW: 218, cardH: 308, photoW: 130, photoBottom: 146, opacity: 1.00 },
  { cardW: 178, cardH: 258, photoW: 108, photoBottom: 124, opacity: 0.68 },
  { cardW: 148, cardH: 216, photoW: 88,  photoBottom: 104, opacity: 0.38 },
]

function PlayerCard({ player, cfg, isCenter }: { player: CardPlayer; cfg: typeof CARD_SIZES[0]; isCenter: boolean }) {
  const pillColor = POS_COLOR[player.pos] ?? "#fff"

  return (
    <div
      style={{
        position: "relative",
        width: cfg.cardW,
        height: cfg.cardH,
        opacity: cfg.opacity,
        flexShrink: 0,
      }}
    >
      {/* Floating photo */}
      <div
        style={{
          position: "absolute",
          bottom: cfg.photoBottom,
          left: "50%",
          transform: "translateX(-50%)",
          width: cfg.photoW,
          zIndex: 10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl(player.code)}
          alt={player.name}
          draggable={false}
          style={{
            width: cfg.photoW,
            height: "auto",
            objectFit: "contain",
            filter: isCenter
              ? "drop-shadow(0 8px 24px rgba(0,255,133,0.3))"
              : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
          }}
        />
        {/* Glow line at foot */}
        <div
          style={{
            height: 1,
            background: isCenter
              ? "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)"
              : "linear-gradient(to right, transparent, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.3) 70%, transparent)",
            boxShadow: isCenter
              ? "0 0 8px 2px rgba(255,255,255,0.35)"
              : "0 0 4px 1px rgba(255,255,255,0.12)",
          }}
        />
      </div>

      {/* Card face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          overflow: "hidden",
          background: isCenter
            ? "linear-gradient(145deg, rgba(0,20,16,0.96) 0%, rgba(0,10,20,0.98) 100%)"
            : "linear-gradient(145deg, rgba(8,12,18,0.92) 0%, rgba(4,8,14,0.95) 100%)",
          border: isCenter ? "none" : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isCenter
            ? "0 0 40px rgba(0,255,133,0.15), 0 24px 48px rgba(0,0,0,0.6)"
            : "0 12px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Gradient top strip */}
        <div
          style={{
            height: 3,
            background: isCenter
              ? "linear-gradient(to right, #00ff85, #02efff)"
              : "transparent",
          }}
        />

        {/* Stats block at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 60%, transparent)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: pillColor,
                background: `${pillColor}1a`,
                border: `1px solid ${pillColor}35`,
              }}
            >
              {player.pos}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl(player.teamCode)}
              alt={player.team}
              width={20}
              height={20}
              style={{ objectFit: "contain" }}
            />
          </div>

          <p className="text-white font-bold text-sm leading-tight">{player.name}</p>
          <p className="text-white/60 text-[10px] mb-2">{player.team}</p>

          <div
            className="grid grid-cols-3 gap-0 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div>
              <p className="text-white font-bold" style={{ fontSize: isCenter ? 13 : 11 }}>{player.total_points}</p>
              <p className="text-white/50 uppercase tracking-wider" style={{ fontSize: 8 }}>PTS</p>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="font-bold" style={{ fontSize: isCenter ? 13 : 11, color: "#00FF87" }}>{player.form}</p>
              <p className="text-white/50 uppercase tracking-wider" style={{ fontSize: 8 }}>FORM</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold" style={{ fontSize: isCenter ? 13 : 11 }}>£{player.price}m</p>
              <p className="text-white/50 uppercase tracking-wider" style={{ fontSize: 8 }}>PRICE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated glow border — center card only */}
      {isCenter && (
        <div
          className="glow-border-mask pointer-events-none absolute inset-0"
          style={{
            borderRadius: 18,
            padding: "1px",
            background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
            backgroundSize: "220% 220%",
            animation: "glow_scroll 5.5s linear infinite",
            zIndex: 5,
          }}
        />
      )}
    </div>
  )
}

interface FplPlayerHeroProps {
  h1: string
  subtitle: string
  players: CardPlayer[]
}

export function FplPlayerHero({ h1, subtitle, players }: FplPlayerHeroProps) {
  const { data: session } = useSession()
  const ctaHref = session?.user ? "/chat" : "/signup"

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-24">
      {/* Video background */}
      <DevHeroVideoBg />

      {/* Dark overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.65) 100%)" }}
      />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Rotating glow border */}
      <div
        className="glow-border-mask pointer-events-none absolute inset-0"
        style={{
          padding: "1px",
          background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.04),#00FFFF,rgba(255,255,255,0.04),#00FF87)",
          backgroundSize: "220% 220%",
          animation: "glow_scroll 8s linear infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-10 text-center">

        {/* FPL Analysis pill */}
        <div className="relative inline-flex rounded-full">
          <div
            className="glow-border-mask pointer-events-none absolute inset-0 rounded-full"
            style={{
              padding: "1px",
              background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
              backgroundSize: "220% 220%",
              animation: "glow_scroll 5s linear infinite",
            }}
          />
          <span
            className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}
          >
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold text-black"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              FPL
            </span>
            Captain Analysis
          </span>
        </div>

        {/* H1 */}
        <h1
          className="font-bold leading-[1.1] tracking-tighter text-white"
          style={{ fontSize: "clamp(24px, 4vw, 52px)", maxWidth: 820 }}
        >
          {h1}
        </h1>

        {/* Subtitle */}
        <p className="text-white/70 text-base">{subtitle}</p>

        {/* Player cards */}
        <div
          className="flex items-end justify-center gap-3 w-full"
          style={{ overflow: "visible", paddingTop: 80 }}
        >
          {players.map((player, i) => (
            <div
              key={player.code}
              className={i === 0 || i === 4 ? "hidden lg:block" : i === 1 || i === 3 ? "hidden sm:block" : ""}
            >
              <PlayerCard
                player={player}
                cfg={CARD_SIZES[i]}
                isCenter={i === 2}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          <Link
            href={ctaHref}
            className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-black"
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
            Ask ChatFPL AI for free
          </Link>
        </div>

        <div className="flex items-center gap-6 text-sm">
          {["No credit card required", "Instant access"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="#00FF87" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white/70">{t}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
