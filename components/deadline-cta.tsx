"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const DEADLINE = new Date("2026-04-10T18:30:00Z")
const GW = 32

function calcRemaining() {
  const diff = DEADLINE.getTime() - Date.now()
  if (diff <= 0) return null
  const total = Math.floor(diff / 1000)
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    urgent:  diff < 86400000, // < 24 hours
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function Unit({ value, label, urgent }: { value: string; label: string; urgent: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-4 py-4 sm:px-6 sm:py-5 min-w-[72px] sm:min-w-[90px]"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: `1px solid ${urgent ? "rgba(255,60,60,0.35)" : "rgba(0,255,135,0.2)"}`,
        boxShadow: urgent
          ? "0 0 18px rgba(255,60,60,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 0 18px rgba(0,255,135,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="font-bold tracking-tight tabular-nums leading-none"
          style={{
            fontSize: "clamp(28px,5vw,48px)",
            color: urgent ? "#ff4444" : "#00FF87",
            textShadow: urgent
              ? "0 0 20px rgba(255,60,60,0.6)"
              : "0 0 20px rgba(0,255,135,0.5)",
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-1.5 text-[10px] uppercase tracking-widest text-white/35">{label}</span>
    </div>
  )
}

export function DeadlineCTA() {
  const [remaining, setRemaining] = useState(calcRemaining)

  useEffect(() => {
    const id = setInterval(() => setRemaining(calcRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  const urgent = remaining?.urgent ?? false

  return (
    <section className="relative bg-black px-4 py-24 overflow-hidden">
      {/* Background radial — deep emerald centre */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: urgent
            ? "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(180,0,0,0.12) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,40,20,0.6) 0%, rgba(0,0,0,0) 70%)",
          transition: "background 2s ease",
        }}
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">

        {/* Urgent pill — only shown when < 24 hours */}
        {urgent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: "rgba(255,60,60,0.4)", color: "#ff6666", background: "rgba(255,0,0,0.06)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#ff4444" }} />
            Less than 24 hours remaining
          </motion.div>
        )}

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-bold leading-[1.1] tracking-tighter mb-4 text-[36px] lg:text-5xl whitespace-nowrap"
        >
          {remaining ? (
            <>
              <span className="text-white">The Gameweek {GW} </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Deadline is Closing.
              </span>
            </>
          ) : (
            <>
              <span className="text-white">Deadline Passed. </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Prep for GW{GW + 1}.
              </span>
            </>
          )}
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="text-lg text-gray-300 max-w-xl mx-auto mb-10"
        >
          Your rivals are already refining their rosters with live data. Don't go into the deadline blind.
        </motion.p>

        {/* Countdown boxes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="flex justify-center gap-3 sm:gap-4 mb-12"
        >
          {remaining ? (
            <>
              <Unit value={pad(remaining.days)}    label="Days"    urgent={urgent} />
              <Unit value={pad(remaining.hours)}   label="Hours"   urgent={urgent} />
              <Unit value={pad(remaining.minutes)} label="Mins"    urgent={urgent} />
              <Unit value={pad(remaining.seconds)} label="Secs"    urgent={urgent} />
            </>
          ) : (
            <p className="text-white/40 text-base">The next deadline will be announced shortly.</p>
          )}
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
              href="/signup"
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
              Secure My Advantage
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/60">Free trial · No credit card required</p>
        </motion.div>

      </div>
    </section>
  )
}
