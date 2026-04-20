"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"

function calcRemaining(deadline: Date | null) {
  if (!deadline) return null
  const diff = deadline.getTime() - Date.now()
  if (diff <= 0) return null
  const total = Math.floor(diff / 1000)
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    urgent:  diff < 86400000,
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function Unit({ value, label, urgent, speed }: { value: string; label: string; urgent: boolean; speed: number }) {
  return (
    <div
      className="rounded-2xl p-px"
      style={{
        background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
        backgroundSize: "220% 220%",
        animation: `glow_scroll ${speed}s linear infinite`,
      }}
    >
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-4 py-4 sm:px-6 sm:py-5 min-w-[72px] sm:min-w-[90px]"
      style={{ background: "#08100c" }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="font-bold tracking-tight tabular-nums leading-none text-transparent bg-clip-text"
          style={{
            fontSize: "clamp(28px,5vw,48px)",
            backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
            WebkitBackgroundClip: "text",
            filter: "drop-shadow(0 0 8px rgba(0,255,135,0.4))",
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-1.5 text-[10px] uppercase tracking-widest text-white">{label}</span>
    </div>
    </div>
  )
}

export function DeadlineCTA() {
  const { data: session } = useSession()
  const ctaHref = session?.user ? "/chat" : "/signup"
  const [gw, setGw] = useState<number | null>(null)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [remaining, setRemaining] = useState<ReturnType<typeof calcRemaining>>(null)
  const [seasonOver, setSeasonOver] = useState<boolean>(false)
  const [loaded, setLoaded] = useState(false)

  // Fetch next deadline from FPL API (via our route)
  useEffect(() => {
    fetch("/api/next-deadline")
      .then((r) => r.json())
      .then(({ gw, deadline, seasonOver }: { gw: number | null; deadline: string | null; seasonOver: boolean }) => {
        setGw(gw)
        setDeadline(deadline ? new Date(deadline) : null)
        setSeasonOver(!!seasonOver)
        setLoaded(true)
      })
      .catch(() => { setLoaded(true) })
  }, [])

  // Tick every second once we have a deadline
  useEffect(() => {
    if (!deadline) return
    setRemaining(calcRemaining(deadline))
    const id = setInterval(() => setRemaining(calcRemaining(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  const urgent = remaining?.urgent ?? false

  // Three display states
  const hasCounting  = !!remaining            // active countdown
  const betweenGWs   = loaded && !remaining && !seasonOver  // API updating / between GWs
  const isSeasonOver = loaded && !remaining && seasonOver   // genuine end of season

  return (
    <section className="relative bg-black px-4 py-24 overflow-hidden">
      {/* Background radial — deep emerald centre */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,40,20,0.6) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl"
        >
          {hasCounting ? (
            <>
              <span className="text-white">Gameweek </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                {gw ?? "Next"}
              </span>
            </>
          ) : betweenGWs ? (
            <>
              <span className="text-white">Next Gameweek </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Coming Soon.
              </span>
            </>
          ) : isSeasonOver ? (
            <>
              <span className="text-white">New Season. </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Same Rivals. Head Start.
              </span>
            </>
          ) : null}
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="text-lg text-gray-300 max-w-xl mx-auto mb-10"
        >
          {hasCounting
            ? "Ready When You Are."
            : betweenGWs
            ? "Results are being processed. The next deadline will be confirmed shortly."
            : isSeasonOver
            ? "The season's done. But the managers who finish top next year are already thinking. Don't start on the back foot."
            : null
          }
        </motion.p>

        {/* Countdown boxes or placeholder notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="flex justify-center gap-3 sm:gap-4 mb-12"
        >
          {hasCounting ? (
            <>
              <Unit value={pad(remaining!.days)}    label="Days"    urgent={urgent} speed={7} />
              <Unit value={pad(remaining!.hours)}   label="Hours"   urgent={urgent} speed={9} />
              <Unit value={pad(remaining!.minutes)} label="Mins"    urgent={urgent} speed={11} />
              <Unit value={pad(remaining!.seconds)} label="Secs"    urgent={urgent} speed={8} />
            </>
          ) : betweenGWs ? (
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
              style={{
                background: "rgba(0,255,135,0.08)",
                border: "1px solid rgba(0,255,135,0.25)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", flexShrink: 0 }}
              />
              <span className="text-sm font-medium text-white/80">
                Next deadline date to be confirmed
              </span>
            </div>
          ) : isSeasonOver ? (
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
              style={{
                background: "rgba(0,255,135,0.08)",
                border: "1px solid rgba(0,255,135,0.25)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", flexShrink: 0 }}
              />
              <span className="text-sm font-medium text-white/80">
                Gameweek 1 deadline to be confirmed by the Premier League
              </span>
            </div>
          ) : null}
        </motion.div>

        {/* CTA button with shimmer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="inline-block"
        >
          <div
            className="relative rounded-full p-[4px] transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <Link
              href={ctaHref}
              className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-[#08020E]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              {/* Shimmer sweep */}
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
              Start Your Free Trial Now
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/60">Free trial · No credit card required</p>
        </motion.div>

      </div>
    </section>
  )
}
