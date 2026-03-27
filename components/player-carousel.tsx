"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { ShowcasePlayer } from "@/app/api/showcase-players/route"

// ── Card position configs for 5 visible slots ────────────────────────────────
const POSITIONS = [
  { x: -520, z: -220, rotY: 28,  scale: 0.60, opacity: 0.35, zIdx: 1 }, // far-left
  { x: -255, z: -90,  rotY: 14,  scale: 0.80, opacity: 0.70, zIdx: 3 }, // left
  { x:    0, z:   0,  rotY:  0,  scale: 1.08, opacity: 1.00, zIdx: 5 }, // center
  { x:  255, z: -90,  rotY: -14, scale: 0.80, opacity: 0.70, zIdx: 3 }, // right
  { x:  520, z: -220, rotY: -28, scale: 0.60, opacity: 0.35, zIdx: 1 }, // far-right
]

// ── Position label tags ───────────────────────────────────────────────────────
const POS_COLORS: Record<string, string> = {
  GKP: "#F5C518",
  DEF: "#00BFFF",
  MID: "#00FF85",
  FWD: "#FF6B35",
}

// ── Fallback cards if API not yet loaded ──────────────────────────────────────
const FALLBACK: ShowcasePlayer[] = [
  { name: "Salah",   club: "LIV", position: "MID", price: "£13.2m", totalPts: 210, form: "9.8",  photoUrl: "" },
  { name: "Haaland", club: "MCI", position: "FWD", price: "£14.5m", totalPts: 180, form: "7.4",  photoUrl: "" },
  { name: "Palmer",  club: "CHE", position: "MID", price: "£11.4m", totalPts: 195, form: "8.1",  photoUrl: "" },
  { name: "Saka",    club: "ARS", position: "MID", price: "£10.5m", totalPts: 165, form: "7.2",  photoUrl: "" },
  { name: "Isak",    club: "NEW", position: "FWD", price: "£9.2m",  totalPts: 148, form: "8.6",  photoUrl: "" },
  { name: "Mbeumo",  club: "BRE", position: "FWD", price: "£8.9m",  totalPts: 172, form: "8.3",  photoUrl: "" },
  { name: "Trent",   club: "LIV", position: "DEF", price: "£7.8m",  totalPts: 139, form: "6.4",  photoUrl: "" },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlayerCarousel() {
  const [players, setPlayers]     = useState<ShowcasePlayer[]>(FALLBACK)
  const [center, setCenter]       = useState(0) // index of center card
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number>(0)
  const autoTimer  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch live players (combine topPts + topForm for variety)
  useEffect(() => {
    fetch("/api/showcase-players")
      .then(r => r.json())
      .then(d => {
        const combined: ShowcasePlayer[] = []
        const seen = new Set<string>()
        for (const p of [...(d.topPts ?? []), ...(d.topForm ?? []), ...(d.differentials ?? [])]) {
          if (!seen.has(p.name)) { seen.add(p.name); combined.push(p) }
          if (combined.length >= 7) break
        }
        if (combined.length >= 3) setPlayers(combined)
      })
      .catch(() => {/* keep fallback */})
  }, [])

  const total = players.length

  const advance = useCallback((dir: 1 | -1) => {
    setCenter(c => (c + dir + total) % total)
  }, [total])

  // Auto-rotate every 4 s
  useEffect(() => {
    autoTimer.current = setInterval(() => advance(1), 4000)
    return () => { if (autoTimer.current) clearInterval(autoTimer.current) }
  }, [advance])

  const resetTimer = () => {
    if (autoTimer.current) clearInterval(autoTimer.current)
    autoTimer.current = setInterval(() => advance(1), 4000)
  }

  const goTo = (idx: number) => {
    setCenter(idx)
    resetTimer()
  }

  // Swipe / drag
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    setIsDragging(false)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const diff = e.clientX - dragStartX.current
    if (Math.abs(diff) > 40) {
      advance(diff < 0 ? 1 : -1)
      resetTimer()
    }
    setIsDragging(false)
  }

  // Map player indices to the 5 visible slots
  const slotIndices = [
    (center - 2 + total) % total,
    (center - 1 + total) % total,
    center,
    (center + 1) % total,
    (center + 2) % total,
  ]

  return (
    <section className="relative w-full overflow-hidden py-20 bg-black">
      {/* Ambient radial glow behind carousel */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "700px",
          height: "420px",
          background: "radial-gradient(ellipse at center, rgba(0,255,133,0.07) 0%, rgba(2,239,255,0.04) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Heading */}
      <div className="relative z-10 mb-10 px-4 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Live Player Data
        </p>
        <h2 className="text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
          <span className="text-white">This Week&apos;s </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(to right, #00ff85, #02efff, #a855f7)",
              WebkitBackgroundClip: "text",
            }}
          >
            Top Performers
          </span>
        </h2>
        <p className="mt-3 text-sm text-white/50">
          Tap a card to bring it front and centre. Data updates in real time.
        </p>
      </div>

      {/* Carousel stage */}
      <div
        className="relative mx-auto select-none"
        style={{ width: "100%", maxWidth: 1100, height: 480, perspective: "1200px" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {slotIndices.map((playerIdx, slotIdx) => {
          const player  = players[playerIdx]
          const pos     = POSITIONS[slotIdx]
          const isCenter = slotIdx === 2
          const posColor = POS_COLORS[player.position] ?? "#00FF85"

          return (
            <motion.div
              key={playerIdx}
              onClick={() => !isDragging && goTo(playerIdx)}
              className="absolute top-0 left-1/2 cursor-pointer"
              style={{ transformStyle: "preserve-3d", zIndex: pos.zIdx }}
              animate={{
                x:       pos.x,
                z:       pos.z,
                rotateY: pos.rotY,
                scale:   pos.scale,
                opacity: pos.opacity,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              {/* Card body */}
              <div
                className="relative overflow-visible"
                style={{
                  width:  220,
                  height: 310,
                  marginLeft: -110,
                  borderRadius: 20,
                  background: isCenter
                    ? "linear-gradient(145deg, rgba(0,20,16,0.95) 0%, rgba(0,10,20,0.98) 100%)"
                    : "linear-gradient(145deg, rgba(8,12,18,0.92) 0%, rgba(4,8,14,0.95) 100%)",
                  border: isCenter
                    ? `1px solid rgba(0,255,133,0.25)`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isCenter
                    ? "0 0 40px rgba(0,255,133,0.15), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 12px 32px rgba(0,0,0,0.5)",
                }}
              >
                {/* Top accent strip */}
                <div
                  className="absolute top-0 left-0 right-0 rounded-t-[20px]"
                  style={{
                    height: 3,
                    background: isCenter
                      ? "linear-gradient(to right, #00ff85, #02efff)"
                      : "transparent",
                  }}
                />

                {/* Player photo — floating above card */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    bottom: 148,
                    width: 130,
                    zIndex: 10,
                  }}
                >
                  {/* Shadow on card surface */}
                  <motion.div
                    className="mx-auto rounded-full"
                    style={{
                      width: 70,
                      height: 12,
                      background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 80%)",
                      filter: "blur(4px)",
                      marginBottom: -6,
                    }}
                    animate={isCenter
                      ? { scaleX: [1, 0.82, 1], opacity: [0.55, 0.35, 0.55] }
                      : { scaleX: 1, opacity: 0.4 }
                    }
                    transition={isCenter
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : {}
                    }
                  />

                  {/* The photo itself — bobs when center */}
                  <motion.div
                    animate={isCenter ? { y: [0, -14, 0] } : { y: 0 }}
                    transition={isCenter
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : {}
                    }
                  >
                    {player.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        draggable={false}
                        style={{
                          width: 130,
                          height: "auto",
                          objectFit: "contain",
                          filter: isCenter
                            ? "drop-shadow(0 8px 20px rgba(0,255,133,0.25))"
                            : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                        }}
                      />
                    ) : (
                      // Placeholder silhouette
                      <div
                        className="flex items-end justify-center rounded-t-full"
                        style={{
                          width: 130,
                          height: 150,
                          background: "linear-gradient(160deg, rgba(0,255,133,0.12), rgba(2,239,255,0.08))",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <svg viewBox="0 0 60 80" fill="none" width={60} opacity={0.4}>
                          <circle cx="30" cy="18" r="12" fill="rgba(255,255,255,0.4)" />
                          <path d="M8 80 Q8 48 30 48 Q52 48 52 80Z" fill="rgba(255,255,255,0.3)" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Card info — bottom section */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-[20px] px-4 pb-4 pt-3"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent)",
                  }}
                >
                  {/* Position badge */}
                  <span
                    className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: posColor,
                      background: `${posColor}18`,
                      border: `1px solid ${posColor}40`,
                    }}
                  >
                    {player.position}
                  </span>

                  {/* Name */}
                  <p className="mt-0.5 text-[17px] font-bold leading-[1.1] text-white tracking-tight">
                    {player.name}
                  </p>

                  {/* Club */}
                  <p className="text-[11px] text-white/45 font-medium mt-0.5">
                    {player.club}
                  </p>

                  {/* Stats row */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-center">
                      <p
                        className="text-[15px] font-bold leading-none"
                        style={{ color: "#00FF85" }}
                      >
                        {player.totalPts}
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">
                        Pts
                      </p>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[15px] font-bold leading-none text-white/90">
                        {player.form}
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">
                        Form
                      </p>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[15px] font-bold leading-none text-white/90">
                        {player.price}
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">
                        Price
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center glow overlay */}
                {isCenter && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[20px]"
                    style={{
                      background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,133,0.06) 0%, transparent 65%)",
                    }}
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Dot nav */}
      <div className="relative z-10 mt-6 flex justify-center gap-2">
        {players.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to player ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === center ? 20 : 6,
              height: 6,
              background: i === center
                ? "linear-gradient(to right, #00ff85, #02efff)"
                : "rgba(255,255,255,0.20)",
            }}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <button
        onClick={() => { advance(-1); resetTimer() }}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white/50 transition-all hover:text-white/90"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        aria-label="Previous"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => { advance(1); resetTimer() }}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white/50 transition-all hover:text-white/90"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        aria-label="Next"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  )
}
