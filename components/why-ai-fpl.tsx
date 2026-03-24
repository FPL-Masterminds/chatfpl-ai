"use client"

import Image from "next/image"
import { Reveal } from "@/components/scroll-reveal"

function GaugeGraphic() {
  return (
    <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[220px]">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#00FFA8" />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Track */}
      <path d="M 20 120 A 90 90 0 0 1 200 120" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* Fill — ~80% */}
      <path d="M 20 120 A 90 90 0 0 1 185 55" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" fill="none" filter="url(#gaugeGlow)" />
      {/* Needle */}
      <line x1="110" y1="120" x2="178" y2="52" stroke="#00FFA8" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="110" cy="120" r="6" fill="#00FFA8" opacity="0.9" />
      {/* Tick marks */}
      {[0, 36, 72, 108, 144, 180].map((deg, i) => {
        const rad = ((deg - 180) * Math.PI) / 180
        const x1 = 110 + 82 * Math.cos(rad)
        const y1 = 120 + 82 * Math.sin(rad)
        const x2 = 110 + 92 * Math.cos(rad)
        const y2 = 120 + 92 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      })}
      {/* Labels */}
      <text x="14" y="136" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace">SLOW</text>
      <text x="180" y="136" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace">FAST</text>
      {/* Centre metric */}
      <text x="110" y="100" fill="url(#gaugeGrad)" fontSize="22" fontWeight="700" textAnchor="middle" fontFamily="monospace">10x</text>
      <text x="110" y="114" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" fontFamily="monospace">DECISION SPEED</text>
    </svg>
  )
}

function LineChartGraphic() {
  const points = [
    [0, 90], [30, 78], [55, 70], [75, 58], [100, 52], [120, 40], [145, 30], [175, 18], [200, 8],
  ]
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ")
  const area = `${points[0][0]},110 ` + polyline + ` 200,110`

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[220px]">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#29D3FF" />
          <stop offset="100%" stopColor="#00FFA8" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
        </linearGradient>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Grid lines */}
      {[25, 50, 75].map(y => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <polygon points={area} fill="url(#areaGrad)" />
      {/* Line */}
      <polyline points={polyline} stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#lineGlow)" />
      {/* End dot */}
      <circle cx="200" cy="8" r="4" fill="#00FFA8" />
      <circle cx="200" cy="8" r="8" fill="#00FFA8" fillOpacity="0.2" />
      {/* Arrow up */}
      <path d="M 188 16 L 200 4 L 200 10" stroke="#00FFA8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Labels */}
      <text x="2" y="108" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontFamily="monospace">GW1</text>
      <text x="160" y="108" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontFamily="monospace">NOW</text>
      <text x="130" y="20" fill="#00FFA8" fontSize="9" fontWeight="700" fontFamily="monospace">↑ RANK</text>
    </svg>
  )
}

function BarChartGraphic() {
  const bars = [
    { label: "xG",  h: 38, color: "#29D3FF" },
    { label: "xA",  h: 52, color: "#00F0FF" },
    { label: "OWN", h: 30, color: "#6EE7FF" },
    { label: "FIX", h: 65, color: "#00FFA8" },
    { label: "FRM", h: 80, color: "#7CFFB2" },
  ]
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[220px]">
      <defs>
        <filter id="barGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Grid */}
      {[30, 60, 90].map(y => (
        <line key={y} x1="10" y1={y} x2="195" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {bars.map((bar, i) => {
        const x = 18 + i * 36
        const y = 100 - bar.h
        return (
          <g key={i}>
            <rect x={x} y={y} width="22" height={bar.h} rx="4" fill={bar.color} fillOpacity="0.15" />
            <rect x={x} y={y} width="22" height={bar.h} rx="4" fill={bar.color} fillOpacity="0.0" />
            {/* Bright top cap */}
            <rect x={x} y={y} width="22" height="3" rx="2" fill={bar.color} filter="url(#barGlow)" />
            <text x={x + 11} y="112" fill="rgba(255,255,255,0.4)" fontSize="7.5" textAnchor="middle" fontFamily="monospace">{bar.label}</text>
          </g>
        )
      })}
      {/* "INSTANT" badge */}
      <rect x="130" y="8" width="58" height="18" rx="9" fill="rgba(0,255,168,0.12)" />
      <text x="159" y="20" fill="#00FFA8" fontSize="8.5" fontWeight="700" textAnchor="middle" fontFamily="monospace">INSTANT</text>
    </svg>
  )
}

const CARDS = [
  {
    label: "Decision Speed",
    headline: "Make Decisions in Seconds, Not Hours",
    body: "Stop scrolling Twitter, stats sites, and Reddit threads. ChatFPL AI gives you instant answers using live data, form, fixtures, and underlying metrics, all in one place.",
    Graphic: GaugeGraphic,
    accent: "#00F0FF",
    glowColor: "rgba(0,240,255,0.12)",
    borderColor: "rgba(0,240,255,0.15)",
  },
  {
    label: "Rank Improvement",
    headline: "Climb the Ranks with Data-Driven Picks",
    body: "Every decision is backed by real stats: xG, xA, ownership, minutes, and fixtures. No guesswork. Just smarter transfers, captaincy, and squad planning.",
    Graphic: LineChartGraphic,
    accent: "#29D3FF",
    glowColor: "rgba(41,211,255,0.12)",
    borderColor: "rgba(41,211,255,0.15)",
  },
  {
    label: "Learning Curve",
    headline: "No Expertise Required",
    body: "You don't need to understand advanced stats or spend hours analysing. Just ask questions and ChatFPL AI translates complex data into clear, actionable advice.",
    Graphic: BarChartGraphic,
    accent: "#00FFA8",
    glowColor: "rgba(0,255,168,0.12)",
    borderColor: "rgba(0,255,168,0.15)",
  },
]

const BENEFITS = [
  {
    title: "Faster Gameweek Decisions",
    body: "Get transfer ideas, captain picks, and differentials in seconds, even minutes before deadline.",
  },
  {
    title: "Spot Differentials Before Everyone Else",
    body: "Identify low-owned players with strong underlying data before they become template.",
  },
  {
    title: "Win Your Mini-League",
    body: "Outthink your rivals with smarter, faster, data-backed decisions every single week.",
  },
]

export function WhyAiFpl() {
  return (
    <section className="bg-black px-4 py-24 border-b border-white/[0.06]">
      <div className="mx-auto max-w-[1400px]">

        {/* Heading */}
        <div className="mb-16 text-center">
          <Reveal>
            <h2
              className="mb-5 text-5xl font-bold leading-[1.1] tracking-tighter lg:text-6xl"
            >
              <span className="text-white">AI is the Future of </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #00ff85, #02efff, #a855f7)", WebkitBackgroundClip: "text" }}>Fantasy Premier League.</span>
              <br />
              <span className="text-white">Here&apos;s Why Smart Managers Are Switching…</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Smarter transfers, faster captaincy calls, sharper differentials, and data-backed decisions without spending hours researching.
            </p>
          </Reveal>
        </div>

        {/* Three feature cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
          {CARDS.map((card, i) => (
            <Reveal key={card.label} delay={i * 0.12}>
              <div className="relative h-full">
                {/* Card */}
                <div
                  className="rounded-[24px] p-7 flex flex-col h-full"
                  style={{ background: "#000000", border: "1px solid rgba(51,51,51,0.25)" }}
                >
                    {/* Graphic */}
                    <div className="flex justify-center items-center mb-6 h-[130px]">
                      {i === 0
                        ? <Image src="/gauge.png" alt="Decision Speed" width={200} height={130} className="h-[130px] w-auto object-contain" />
                        : <card.Graphic />
                      }
                    </div>

                    {/* Headline */}
                    <h3
                      className="font-bold text-white mb-3"
                      style={{ fontSize: "22px", lineHeight: "1.3", letterSpacing: "-0.01em" }}
                    >
                      {card.headline}
                    </h3>

                    {/* Body */}
                    <p
                      className="flex-1"
                      style={{ fontSize: "14px", fontWeight: 400, lineHeight: "1.65", color: "rgba(255,255,255,0.52)" }}
                    >
                      {card.body}
                    </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Three supporting benefits */}
        <div className="grid gap-6 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={0.1 + i * 0.1}>
              <div className="flex items-start gap-4 px-2">
                {/* Check mark */}
                <span
                  className="mt-0.5 h-5 w-5 rounded-full shrink-0 flex items-center justify-center text-black text-[10px] font-black"
                  style={{ background: "#00FF86", boxShadow: "0 0 10px rgba(0,255,134,0.35)" }}
                >
                  ✓
                </span>
                <div>
                  <p className="font-bold text-white mb-1" style={{ fontSize: "15px", letterSpacing: "-0.01em" }}>{b.title}</p>
                  <p style={{ fontSize: "14px", fontWeight: 400, lineHeight: "1.65", color: "rgba(255,255,255,0.52)" }}>{b.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}

