"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import type { InjuryPlayer } from "@/lib/fpl-injury"

const POSITIONS = [
  { x: -420, z: -220, rotY: 28,  scale: 0.60, opacity: 0.35, zIdx: 1 },
  { x: -210, z: -90,  rotY: 14,  scale: 0.80, opacity: 0.70, zIdx: 3 },
  { x:    0, z:   0,  rotY:  0,  scale: 1.08, opacity: 1.00, zIdx: 5 },
  { x:  210, z: -90,  rotY: -14, scale: 0.80, opacity: 0.70, zIdx: 3 },
  { x:  420, z: -220, rotY: -28, scale: 0.60, opacity: 0.35, zIdx: 1 },
]

export function AltCarousel({ players }: { players: InjuryPlayer[] }) {
  const [center, setCenter]         = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number>(0)
  const total = players.length

  useEffect(() => {
    const t = setTimeout(() => setCenter(c => (c + 1) % total), 5000)
    return () => clearTimeout(t)
  }, [center, total])

  const advance = useCallback((dir: 1 | -1) => {
    setCenter(c => (c + dir + total) % total)
  }, [total])

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    setIsDragging(false)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const diff = e.clientX - dragStartX.current
    if (Math.abs(diff) > 40) advance(diff < 0 ? 1 : -1)
    setIsDragging(false)
  }

  const slotIndices = [
    (center - 2 + total) % total,
    (center - 1 + total) % total,
    center,
    (center + 1) % total,
    (center + 2) % total,
  ]

  return (
    <div className="relative w-full" style={{ userSelect: "none" }}>
      {/* Stage */}
      <div
        className="relative mx-auto"
        style={{ width: "100%", maxWidth: 900, height: 300, perspective: "1200px" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {slotIndices.map((playerIdx, slotIdx) => {
          const player   = players[playerIdx]
          const pos      = POSITIONS[slotIdx]
          const isCenter = slotIdx === 2

          return (
            <motion.div
              key={playerIdx}
              onClick={() => !isDragging && setCenter(playerIdx)}
              className="absolute top-0 left-1/2 cursor-pointer"
              style={{ transformStyle: "preserve-3d", zIndex: pos.zIdx }}
              animate={{ x: pos.x, z: pos.z, rotateY: pos.rotY, scale: pos.scale, opacity: pos.opacity }}
              transition={{ type: "spring", stiffness: 155, damping: 30 }}
            >
              <div style={{ position: "relative", width: 180, height: 260, marginLeft: -90 }}>

                {/* Floating photo */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ bottom: 118, width: 110, zIndex: 10 }}
                >
                  <motion.div
                    className="mx-auto rounded-full"
                    style={{
                      width: 60, height: 10,
                      background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 80%)",
                      filter: "blur(4px)", marginBottom: -6,
                    }}
                    animate={isCenter ? { scaleX: [1, 0.82, 1], opacity: [0.55, 0.35, 0.55] } : { scaleX: 1, opacity: 0.4 }}
                    transition={isCenter ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : {}}
                  />
                  <motion.div
                    animate={isCenter ? { y: [0, -14, 0] } : { y: 0 }}
                    transition={isCenter ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : {}}
                  >
                    <Image
                      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                      alt={player.displayName} width={110} height={140}
                      style={{ objectFit: "contain", display: "block", filter: isCenter ? "drop-shadow(0 8px 20px rgba(0,255,133,0.25))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}
                      unoptimized
                    />
                    <div style={{
                      height: 1,
                      background: isCenter
                        ? "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)"
                        : "linear-gradient(to right, transparent, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, transparent)",
                      boxShadow: isCenter ? "0 0 8px 2px rgba(255,255,255,0.35)" : "0 0 4px 1px rgba(255,255,255,0.10)",
                    }} />
                  </motion.div>
                </div>

                {/* Card face */}
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 16, overflow: "hidden",
                  background: isCenter
                    ? "linear-gradient(145deg, rgba(0,20,16,0.95) 0%, rgba(0,10,20,0.98) 100%)"
                    : "linear-gradient(145deg, rgba(8,12,18,0.92) 0%, rgba(4,8,14,0.95) 100%)",
                  border: isCenter ? "none" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isCenter
                    ? "0 0 40px rgba(0,255,133,0.15), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 12px 32px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ height: 3, background: isCenter ? "linear-gradient(to right,#00FF87,#00FFFF)" : "transparent" }} />

                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 px-3 pb-4 pt-16"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 60%, transparent)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-bold text-[13px] text-center leading-tight">{player.displayName}</p>
                      <Image
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`}
                        alt={player.club} width={16} height={16}
                        style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
                      />
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide">{player.price} · {player.position}</p>
                    {isCenter && (
                      <Link
                        href={`/fpl/${player.slug}`}
                        className="whitespace-nowrap text-[11px] font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                        style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "5px 14px" }}
                        onClick={e => e.stopPropagation()}
                      >
                        Full analysis
                      </Link>
                    )}
                  </div>
                </div>

                {/* Glow border — centre card only */}
                {isCenter && (
                  <div
                    className="glow-border-mask pointer-events-none absolute inset-0"
                    style={{
                      borderRadius: 16, padding: "1px",
                      background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
                      backgroundSize: "220% 220%",
                      animation: "glow_scroll 6s linear infinite",
                      zIndex: 6,
                    }}
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Dot nav */}
      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {players.map((_, i) => (
            <button
              key={i}
              onClick={() => setCenter(i)}
              aria-label={`Go to player ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === center ? 20 : 6, height: 6,
                background: i === center ? "linear-gradient(to right,#00ff85,#02efff)" : "rgba(255,255,255,0.20)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Arrow buttons */}
      <button onClick={() => advance(-1)} aria-label="Previous"
        className="absolute left-0 top-[130px] z-20 -translate-y-1/2 rounded-full p-2 text-white/50 transition-all hover:text-white/90"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={() => advance(1)} aria-label="Next"
        className="absolute right-0 top-[130px] z-20 -translate-y-1/2 rounded-full p-2 text-white/50 transition-all hover:text-white/90"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
