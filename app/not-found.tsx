"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { DevHeader } from "@/components/dev-header"

// ── Types ─────────────────────────────────────────────────────────────────────

type Msg = { id: string; role: "bot" | "user"; text: string }

type Dest = {
  id: string
  label: string
  href: string
  reply: string
}

// ── Navigation options ────────────────────────────────────────────────────────

const DESTINATIONS: Dest[] = [
  {
    id: "chat",
    label: "Take me to the AI chat",
    href: "/chat",
    reply: "That's where the edge is. Let's go.",
  },
  {
    id: "dashboard",
    label: "My FPL Dashboard",
    href: "/dashboard",
    reply: "Back to the numbers. Good call.",
  },
  {
    id: "pricing",
    label: "Pricing plans",
    href: "/#pricing",
    reply: "Less than a pint for proper FPL intel. Smart.",
  },
  {
    id: "home",
    label: "Back to the homepage",
    href: "/",
    reply: "Taking stock. Fair enough.",
  },
  {
    id: "lost",
    label: "I genuinely have no idea",
    href: "/",
    reply: "Same energy as a wildcard in GW2. I'll send you home.",
  },
]

// ── Intro sequence ────────────────────────────────────────────────────────────

const INTRO: { id: string; text: string; delay: number }[] = [
  {
    id: "var",
    text: "VAR check complete. The page you were looking for has been transferred out. It's not in this squad.",
    delay: 400,
  },
  {
    id: "blank",
    text: "Blank gameweek for this URL. Nothing here. The FPL equivalent of picking a player with no fixture.",
    delay: 2200,
  },
  {
    id: "question",
    text: "Right. Classic panic click. It happens to the best managers. Where were you actually trying to go?",
    delay: 4200,
  },
]

// ── Spring config ─────────────────────────────────────────────────────────────

const SPRING = { type: "spring" as const, stiffness: 120, damping: 20 }

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: "rgba(0,255,200,0.6)" }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

// ── CF Avatar ─────────────────────────────────────────────────────────────────

function CFAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mb-0.5">
      CF
    </div>
  )
}

// ── Shimmering redirect button ────────────────────────────────────────────────

function ShimmerButton({ href, label }: { href: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex justify-center"
    >
      <div
        className="inline-block rounded-full p-[3px] transition-all duration-300 hover:scale-105"
        style={{
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 0 30px rgba(0,255,135,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <Link
          href={href}
          className="relative block overflow-hidden rounded-full px-8 py-3 font-bold text-sm text-[#08020E]"
          style={{ background: "linear-gradient(to right, #00FF87, #00FFFF)" }}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s linear infinite",
            }}
          />
          {label}
        </Link>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NotFound() {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [phase, setPhase] = useState<"intro" | "navigation" | "chosen">("intro")
  const [chosen, setChosen] = useState<Dest | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll whenever messages change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 60)
  }, [messages, typing])

  // Play intro sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    INTRO.forEach((item, i) => {
      // Show typing indicator just before each message
      timers.push(setTimeout(() => setTyping(true), item.delay))
      // Show message 900ms after typing starts
      timers.push(
        setTimeout(() => {
          setTyping(false)
          setMessages((prev) => [...prev, { id: item.id, role: "bot", text: item.text }])
          if (i === INTRO.length - 1) {
            setTimeout(() => setPhase("navigation"), 400)
          }
        }, item.delay + 900)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  function pick(dest: Dest) {
    if (phase !== "navigation") return
    setPhase("chosen")
    setChosen(dest)

    // User message
    setMessages((prev) => [...prev, { id: `u-${dest.id}`, role: "user", text: dest.label }])

    // Bot reply after typing
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: `r-${dest.id}`, role: "bot", text: dest.reply }])
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black notfound-root">
      <style>{`
        .notfound-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .notfound-root ::-webkit-scrollbar-track { background: transparent; }
        .notfound-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .notfound-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      {/* Grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 pb-12">

        {/* Heading */}
        <div className="text-center mb-10 max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
            <span className="text-white">404 </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              - Page Not Found
            </span>
          </h1>
          <p className="text-lg text-gray-300">
            This one&apos;s gone. But let&apos;s get you back on track.
          </p>
        </div>

        {/* Chat panel */}
        <div
          className="w-full max-w-2xl flex flex-col rounded-[28px] overflow-hidden"
          style={{
            height: "clamp(420px, 62vh, 640px)",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 80px rgba(0,255,135,0.06), 0 32px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={SPRING}
                  className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && <CFAvatar />}
                  <div
                    className={`max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-medium rounded-br-sm"
                        : "border border-white/8 bg-black/30 text-white/85 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  key="typing"
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={SPRING}
                  className="flex items-end gap-3 justify-start"
                >
                  <CFAvatar />
                  <div className="rounded-[20px] rounded-bl-sm border border-white/8 bg-black/30 px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom panel */}
          <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
            <AnimatePresence mode="wait">

              {/* Navigation pills */}
              {phase === "navigation" && (
                <motion.div
                  key="nav"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-white/30 text-xs mb-3 uppercase tracking-widest">Where to?</p>
                  <div className="flex flex-wrap gap-2">
                    {DESTINATIONS.map((dest) => (
                      <motion.button
                        key={dest.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => pick(dest)}
                        className="text-sm px-4 py-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,200,0.2)]"
                        style={{
                          borderColor: "rgba(0,255,200,0.25)",
                          background: "rgba(0,255,200,0.05)",
                          color: "rgba(0,255,200,0.85)",
                        }}
                      >
                        {dest.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Post-choice: shimmering CTA */}
              {phase === "chosen" && !typing && chosen && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ShimmerButton
                    href={chosen.href}
                    label={
                      chosen.id === "chat" ? "Open ChatFPL AI" :
                      chosen.id === "dashboard" ? "Go to Dashboard" :
                      chosen.id === "pricing" ? "See Pricing" :
                      "Take me home"
                    }
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  )
}
