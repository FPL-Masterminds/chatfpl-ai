"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedGlow } from "@/components/animated-glow"
import { Reveal } from "@/components/scroll-reveal"

const PLANS = [
  {
    id: "free",
    index: 0,
    label: "Free Trial",
    price: "£0",
    period: "/month",
    tagline: "Try it. No card required.",
    messages: 20,
    accent: "rgba(255,255,255,0.6)",
    accentGlow: "rgba(255,255,255,0.08)",
    features: [
      "20 messages",
      "Live FPL data access",
      "FPL Team ID integration",
      "FPL Dashboard access",
      "Limited support",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    ctaStyle: "outline" as const,
  },
  {
    id: "premium",
    index: 1,
    label: "Premium",
    price: "£7.99",
    period: "/month",
    tagline: "For serious FPL managers.",
    messages: 100,
    accent: "#00FF87",
    accentGlow: "rgba(0,255,135,0.18)",
    popular: true,
    features: [
      "100 messages per month",
      "Live FPL data access",
      "FPL Team ID integration",
      "FPL Dashboard access",
      "Priority support",
    ],
    cta: "Subscribe",
    ctaHref: "/signup",
    ctaStyle: "filled" as const,
  },
  {
    id: "elite",
    index: 2,
    label: "Elite",
    price: "£14.99",
    period: "/month",
    tagline: "For elite FPL competitors.",
    messages: 500,
    accent: "#00FFFF",
    accentGlow: "rgba(0,210,255,0.15)",
    features: [
      "500 messages per month",
      "Live FPL data access",
      "FPL Team ID integration",
      "FPL Dashboard access",
      "Priority support",
    ],
    cta: "Subscribe",
    ctaHref: "/signup",
    ctaStyle: "outline-cyan" as const,
  },
]

const STEPS = [0, 1, 2]
const SLIDER_LABELS = ["20 msgs", "100 msgs", "500 msgs"]

function CheckIcon({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center h-5 w-5 rounded-full shrink-0" style={{ background: color }}>
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function PlanCard({ plan, active }: { plan: typeof PLANS[0]; active: boolean }) {
  return (
    <div
      className="rounded-2xl p-px transition-all duration-500"
      style={{
        background: active
          ? `linear-gradient(135deg,${plan.accent},rgba(255,255,255,0.1),${plan.accent})`
          : "linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))",
        boxShadow: active ? `0 0 40px ${plan.accentGlow}, 0 0 80px ${plan.accentGlow}` : "none",
      }}
    >
      <div
        className="rounded-2xl p-6 h-full flex flex-col"
        style={{
          background: "linear-gradient(145deg,rgba(0,12,8,0.97),rgba(0,6,15,0.99))",
          opacity: active ? 1 : 0.45,
        }}
      >
        {plan.popular && (
          <div className="mb-4 flex justify-center">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{ background: "rgba(0,255,135,0.12)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.3)" }}
            >
              Most Popular
            </span>
          </div>
        )}

        <div className="mb-1 text-lg font-bold text-white">{plan.label}</div>
        <div className="flex items-end gap-1 mb-1">
          <span className="text-4xl font-bold tracking-tight text-white leading-none">{plan.price}</span>
          <span className="text-white/40 text-sm mb-1">{plan.period}</span>
        </div>
        <p className="text-white/40 text-sm mb-6">{plan.tagline}</p>

        <div className="space-y-3 flex-1 mb-6">
          {plan.features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <CheckIcon color={plan.accent} />
              <span className="text-sm text-white/70">{f}</span>
            </div>
          ))}
        </div>

        <Link
          href={plan.ctaHref}
          className="relative block overflow-hidden w-full text-center py-3 rounded-full font-bold text-sm transition-all duration-300 hover:-translate-y-0.5"
          style={
            plan.ctaStyle === "filled"
              ? { background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#000" }
              : plan.ctaStyle === "outline-cyan"
              ? { background: "rgba(0,210,255,0.08)", color: "#00FFFF", border: "1px solid rgba(0,210,255,0.35)" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }
          }
        >
          {plan.ctaStyle === "filled" && (
            <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 2.4s linear infinite" }} />
          )}
          {plan.cta}
        </Link>
      </div>
    </div>
  )
}

export function PricingSlider() {
  const [active, setActive] = useState(1)
  const [prev, setPrev] = useState(1)
  const trackRef = useRef<HTMLDivElement>(null)

  const direction = active > prev ? 1 : -1

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value)
    setPrev(active)
    setActive(val)
  }

  function handleStep(i: number) {
    setPrev(active)
    setActive(i)
  }

  const plan = PLANS[active]
  const pct = (active / 2) * 100

  return (
    <section className="relative bg-black px-4 py-24 overflow-hidden">
      {/* Grid + animated green glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatedGlow
          color="rgba(0,255,135,0.11)"
          size="60% 50%"
          duration={18}
          waypoints={[
            { x: "-20%", y: "20%"  },
            { x: "10%",  y: "-10%" },
            { x: "20%",  y: "15%"  },
            { x: "-5%",  y: "-20%" },
          ]}
        />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative mx-auto max-w-6xl">

        {/* Heading */}
        <Reveal className="text-center mb-14">
          <h2 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
            <span className="text-white">Simple </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Transparent Pricing
            </span>
          </h2>
          <p className="text-white/45 text-base max-w-xl mx-auto text-center px-4 sm:whitespace-nowrap">Choose the plan that fits your FPL ambitions. Slide to explore.</p>
        </Reveal>

        {/* Slider */}
        <Reveal delay={0.1} className="max-w-lg mx-auto mb-12 px-2">
          {/* Step labels */}
          <div className="flex justify-between mb-3">
            {SLIDER_LABELS.map((lbl, i) => (
              <button
                key={i}
                onClick={() => handleStep(i)}
                className="text-xs font-semibold transition-all duration-300"
                style={{ color: active === i ? PLANS[i].accent : "rgba(255,255,255,0.25)" }}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Track + thumb */}
          <div ref={trackRef} className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            {/* Fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(to right,#00FF87,#00FFFF)",
                boxShadow: "0 0 8px rgba(0,255,135,0.5)",
              }}
            />
            {/* Step dots */}
            {STEPS.map((i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                style={{ left: `${(i / 2) * 100}%`, background: active >= i ? PLANS[i].accent : "rgba(255,255,255,0.2)" }}
              />
            ))}
            {/* Native range input overlaid */}
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={active}
              onChange={handleSlider}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ margin: 0 }}
            />
            {/* Custom thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-black transition-all duration-300 pointer-events-none"
              style={{
                left: `${pct}%`,
                background: "linear-gradient(135deg,#00FF87,#00FFFF)",
                boxShadow: "0 0 12px rgba(0,255,135,0.6)",
              }}
            />
          </div>
        </Reveal>

        {/* Desktop — three cards */}
        <Reveal delay={0.2} className="hidden md:grid grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div key={p.id} onClick={() => handleStep(p.index)} className="cursor-pointer">
              <PlanCard plan={p} active={active === p.index} />
            </div>
          ))}
        </Reveal>

        {/* Mobile — single card with slide transition */}
        <Reveal delay={0.2} className="md:hidden overflow-hidden px-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <PlanCard plan={plan} active={true} />
            </motion.div>
          </AnimatePresence>

          {/* Mobile dots */}
          <div className="flex justify-center gap-2 mt-5">
            {PLANS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleStep(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: active === i ? "24px" : "6px",
                  height: "6px",
                  background: active === i ? `linear-gradient(to right,#00FF87,#00FFFF)` : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  )
}
