"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"
import type { TransferTrendPlayer } from "@/lib/fpl-transfer-trends"

const GREEN = "#00FF87"
const CYAN  = "#00FFFF"
const CARD_W = 220
const CARD_H = 310

function photoUrl(code: number) {
  return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`
}
function badgeUrl(teamCode: number) {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`
}

function PlayerCard({ player, label, labelColor }: {
  player: TransferTrendPlayer
  label: "SELLING" | "BUYING"
  labelColor: string
}) {
  return (
    <div style={{ position: "relative", width: CARD_W, height: CARD_H }}>
      {/* Floating shadow */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 148, width: 130, zIndex: 10 }}>
        <motion.div
          className="mx-auto rounded-full"
          style={{
            width: 70, height: 12,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 80%)",
            filter: "blur(4px)", marginBottom: -6,
          }}
          animate={{ scaleX: [1, 0.82, 1], opacity: [0.55, 0.35, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(player.code)}
            alt={player.webName}
            draggable={false}
            style={{
              width: 130, height: "auto", objectFit: "contain",
              filter: "drop-shadow(0 8px 20px rgba(0,255,133,0.25))",
            }}
          />
          <div style={{
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          }} />
        </motion.div>
      </div>

      {/* Card body */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(145deg, rgba(0,20,16,0.95) 0%, rgba(0,10,20,0.98) 100%)",
        boxShadow: "0 0 40px rgba(0,255,133,0.15), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        <div style={{ height: 3, background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }} />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: labelColor, background: `${labelColor}18`, border: `1px solid ${labelColor}40` }}
            >{label}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl(player.teamCode)} alt={player.club} draggable={false}
              style={{ width: 26, height: 26, objectFit: "contain", opacity: 0.9 }} />
          </div>
          <p className="text-[16px] font-bold leading-[1.1] text-white tracking-tight">{player.webName}</p>
          <p className="text-[11px] text-white/70 font-medium mt-0.5">{player.club}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-center">
              <p className="text-[14px] font-bold leading-none" style={{ color: GREEN }}>{player.price}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/70">Price</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-[14px] font-bold leading-none text-white/90">{player.form}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/70">Form</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-[14px] font-bold leading-none text-white/90">{player.ownership}%</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/70">Owned</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,133,0.06) 0%, transparent 65%)" }}
        />
      </div>

      {/* Animated glow border */}
      <div className="glow-border-mask pointer-events-none absolute inset-0" style={{
        borderRadius: 20, padding: "1px",
        background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
        backgroundSize: "220% 220%",
        animation: "glow_scroll 6s linear infinite",
        zIndex: 6,
      }} />
    </div>
  )
}

export interface TransferHeroProps {
  playerOut: TransferTrendPlayer
  playerIn:  TransferTrendPlayer
  gw:        number
}

export function TransferHero({ playerOut, playerIn, gw }: TransferHeroProps) {
  const { data: session } = useSession()
  const ctaHref = session?.user ? "/chat" : "/signup"

  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-28 pb-12">
      <DevHeroVideoBg />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.72) 100%)" }}
      />
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-8 text-center">

        {/* Animated pill badge */}
        <div className="relative inline-flex rounded-full">
          <div className="glow-border-mask pointer-events-none absolute inset-0 rounded-full" style={{
            padding: "1px",
            background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
            backgroundSize: "220% 220%",
            animation: "glow_scroll 5s linear infinite",
          }} />
          <span className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}
          >
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-black"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >FPL</span>
            Transfer Analysis
          </span>
        </div>

        {/* H1 */}
        <h1 className="font-bold leading-[1.1] tracking-tighter"
          style={{ fontSize: "clamp(20px, 3.5vw, 46px)", maxWidth: 900 }}
        >
          <span className="text-white">Should I sell {playerOut.displayName} for </span>
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
          >{playerIn.displayName}?</span>
          <span className="text-white"> FPL Transfer Analysis Gameweek {gw}</span>
        </h1>

        <p className="text-white/70 text-base">
          {playerOut.position} - Gameweek {gw} Fantasy Premier League Transfer Decision
        </p>

        {/* Player cards */}
        <div className="comp-hero-cards flex items-end justify-center gap-4 sm:gap-8 w-full select-none"
          style={{ paddingTop: 20, overflow: "visible" }}
        >
          <div style={{ position: "relative", width: CARD_W, height: CARD_H, flexShrink: 0, overflow: "visible" }}>
            <PlayerCard player={playerOut} label="SELLING" labelColor={GREEN} />
          </div>

          <div className="flex flex-col items-center gap-2 pb-8 flex-shrink-0">
            <svg width="20" height="36" viewBox="0 0 20 36" fill="none">
              <path d="M10 2v28M4 24l6 8 6-8" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/70">GW{gw}</p>
          </div>

          <div style={{ position: "relative", width: CARD_W, height: CARD_H, flexShrink: 0, overflow: "visible" }}>
            <PlayerCard player={playerIn} label="BUYING" labelColor={CYAN} />
          </div>
        </div>

        {/* CTA */}
        <div className="inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105" style={{
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}>
          <Link href={ctaHref}
            className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-black"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full" style={{
              background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s linear infinite",
            }} />
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
