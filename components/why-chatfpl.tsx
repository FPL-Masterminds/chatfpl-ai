"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useSpring, useInView } from "framer-motion"
import type { ShowcasePlayer } from "@/app/api/showcase-players/route"

const CARDS = [
  {
    tag: "THE FEAR",
    number: "01",
    title: "Eliminate the Variables.",
    desc: "FPL is won on cold logic. While your rivals react to Sunday's highlights, you're executing a strategy backed by millions of match simulations.",
    side: "left" as const,
    position: "GKP",
  },
  {
    tag: "THE EDGE",
    number: "02",
    title: "Spot the Invisible.",
    desc: "Our engine identifies the sub-5% owned gems before they explode. Move first, move fast, and leave the pack behind.",
    side: "right" as const,
    position: "DEF",
  },
  {
    tag: "THE ROI",
    number: "03",
    title: "Secure the Crown.",
    desc: "Elite-level FPL management at a fraction of what your rivals spend on tips that don't work. One calculated captaincy call doesn't just pay for the season - it settles the debate.",
    side: "left" as const,
    position: "MID",
  },
  {
    tag: "THE TIMING",
    number: "04",
    title: "Total Tactical Awareness.",
    desc: "Late leaks and injury news are filtered and processed in seconds. Your squad is locked, loaded, and bulletproof before the whistle blows.",
    side: "right" as const,
    position: "FWD",
  },
]

// ── Player images + animated branch line ──────────────────────────────────────
function PlayerStack({
  players,
  side,
  inView,
}: {
  players: ShowcasePlayer[]
  side: "left" | "right"
  inView: boolean
}) {
  const isLeft = side === "left"
  if (!players.length) return null

  return (
    // Covers the opposite half of the card — hidden on mobile
    <div
      className={`absolute top-1/2 -translate-y-1/2 hidden md:flex items-end z-0 ${
        isLeft
          ? "left-[52%] right-0 flex-row pl-2"
          : "right-[52%] left-0 flex-row-reverse pr-2"
      }`}
    >
      {/* Animated horizontal branch from the dot */}
      <motion.div
        className="flex-1 self-end"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: 0.35, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 1,
          transformOrigin: isLeft ? "left" : "right",
          background: isLeft
            ? "linear-gradient(to right, #00FF87, rgba(0,255,135,0.12))"
            : "linear-gradient(to left, #00FF87, rgba(0,255,135,0.12))",
          boxShadow: "0 0 6px rgba(0,255,135,0.55)",
          minWidth: 12,
          marginBottom: 0,
        }}
      />

      {/* Three player photos */}
      <div className="flex items-end gap-1.5 shrink-0">
        {players.slice(0, 3).map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: 0.6 + i * 0.11,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.photoUrl}
                alt={p.name}
                draggable={false}
                style={{
                  width: 57,
                  height: 74,
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(0,255,133,0.2))",
                  display: "block",
                }}
              />
            ) : (
              <div style={{ width: 57, height: 74 }} />
            )}
            {/* Glowing white separator line under each photo */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(to right,transparent,rgba(255,255,255,0.7) 30%,rgba(255,255,255,0.95) 50%,rgba(255,255,255,0.7) 70%,transparent)",
                boxShadow: "0 0 8px 2px rgba(255,255,255,0.28)",
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Single timeline card ───────────────────────────────────────────────────────
function Card({
  card,
  index,
  players,
}: {
  card: (typeof CARDS)[0]
  index: number
  players: ShowcasePlayer[]
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px 0px" })
  const isLeft = card.side === "left"

  return (
    <div
      ref={ref}
      className={`relative flex items-center w-full ${
        isLeft ? "justify-start md:pr-[55%]" : "justify-end md:pl-[55%]"
      }`}
    >
      {/* Node on the line */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:block"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{
            background: "linear-gradient(135deg,#00FF87,#00FFFF)",
            boxShadow:
              "0 0 12px rgba(0,255,135,0.6), 0 0 24px rgba(0,255,135,0.3)",
          }}
        />
      </motion.div>

      {/* Player images + branch */}
      <PlayerStack players={players} side={card.side} inView={inView} />

      {/* Card panel — above branch line */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{
          duration: 0.65,
          ease: [0.16, 1, 0.3, 1],
          delay: index * 0.05,
        }}
        className="w-full md:w-auto relative z-10"
      >
        <div
          className="rounded-2xl p-px"
          style={{
            background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
            backgroundSize: "200% 200%",
            animation: `glow_scroll ${7 + index * 2.3}s linear infinite`,
          }}
        >
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background:
                "linear-gradient(145deg,rgba(0,15,10,0.97),rgba(0,8,18,0.99))",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(0,255,135,0.1)",
                  color: "#00FF87",
                  border: "1px solid rgba(0,255,135,0.25)",
                }}
              >
                {card.tag}
              </span>
              <span
                className="text-5xl font-black leading-none tabular-nums"
                style={{
                  background: "linear-gradient(to right,#00FF87,#00FFFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.04em",
                }}
              >
                {card.number}
              </span>
            </div>

            <h3
              className="font-bold text-white mb-3 leading-tight"
              style={{ fontSize: "clamp(18px,2vw,24px)" }}
            >
              {card.title}
            </h3>
            <p className="text-white/55 leading-relaxed text-sm md:text-base">
              {card.desc}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────
export function WhyChatFPL() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"],
  })
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  })
  const headingRef = useRef(null)
  const headingInView = useInView(headingRef, { once: true })

  const [playersByPos, setPlayersByPos] = useState<
    Record<string, ShowcasePlayer[]>
  >({ GKP: [], DEF: [], MID: [], FWD: [] })

  useEffect(() => {
    fetch("/api/showcase-players")
      .then((r) => r.json())
      .then((d) => {
        setPlayersByPos({
          GKP: d.topGkp ?? [],
          DEF: d.topDef ?? [],
          MID: d.topMid ?? [],
          FWD: d.topFwd ?? [],
        })
      })
      .catch(() => {})
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative bg-black px-4 py-24 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_8%_50%,rgba(0,255,135,0.05),transparent)]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-bold leading-[1.1] tracking-tighter mb-4 text-[36px] lg:text-6xl">
              <span className="text-white">The Edge </span>
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(to right,#00ff85,#02efff)",
                  WebkitBackgroundClip: "text",
                }}
              >
                Smart Managers Have
              </span>
            </h2>
          </motion.div>
          <motion.p
            className="text-white/45 text-base max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
          >
            Four edges your rivals already have. Here&apos;s how you close the gap.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Background line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px hidden md:block"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />

          {/* Animated fill line */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-0 origin-top w-px hidden md:block"
            style={{
              scaleY,
              height: "100%",
              background: "linear-gradient(to bottom,#00FF87,#00FFFF)",
              boxShadow: "0 0 8px rgba(0,255,135,0.5)",
            }}
          />

          {/* Cards */}
          <div className="flex flex-col gap-16 md:gap-20">
            {CARDS.map((card, i) => (
              <Card
                key={card.number}
                card={card}
                index={i}
                players={playersByPos[card.position]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
