"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"

type MessagePart = {
  type: "text" | "players" | "bullets"
  content?: string
  items?: string[]
  players?: { name: string; club: string; price: string; pts: string; img: string }[]
}

type Tab = {
  id: string
  label: string
  sublabel: string
  question: string
  description: string
  messages: MessagePart[]
}

const TABS: Tab[] = [
  {
    id: "captain",
    label: "Captain Picks",
    sublabel: "Who to armband this GW",
    question: "Who should I captain for Gameweek 29?",
    description: "Instant captaincy advice using live form, fixtures and ownership data.",
    messages: [
      {
        type: "text",
        content:
          "Based on GW29 fixtures and current form, **Mohamed Salah** is the standout captain. Here are your top 3 options:",
      },
      {
        type: "players",
        players: [
          { name: "M. Salah", club: "Liverpool", price: "£13.1m", pts: "183pts", img: "/player_images/circular/mohamed_salah_circular.png" },
          { name: "E. Haaland", club: "Man City", price: "£14.0m", pts: "174pts", img: "/player_images/circular/erling_haaland_circular.png" },
          { name: "B. Saka", club: "Arsenal", price: "£10.2m", pts: "149pts", img: "/player_images/circular/bukayo_saka_circular.png" },
        ],
      },
      {
        type: "text",
        content:
          "Salah faces a home fixture vs Ipswich. With 8 goal involvements in his last 6, he's the near-certain armband choice.",
      },
    ],
  },
  {
    id: "transfers",
    label: "Transfer Advice",
    sublabel: "Best in, best out decisions",
    question: "I own Mateta — should I sell him this week?",
    description: "Make smarter transfer decisions with fixture-aware, data-driven recommendations.",
    messages: [
      {
        type: "text",
        content:
          "**Short answer: Yes.** Mateta's fixtures turn rough for the next 4 gameweeks. Here's the picture:",
      },
      {
        type: "bullets",
        items: [
          "GW29 vs Arsenal (H) — xGA 0.6",
          "GW30 vs Man City (A) — xGA 0.4",
          "GW31 vs Chelsea (H) — xGA 0.7",
          "Blanks GW32 — no fixture",
        ],
      },
      {
        type: "text",
        content:
          "**Recommended replacement:** Isak (£8.9m) — home double in GW29/30, 6 goals in last 5, and 42% ownership growth this week.",
      },
    ],
  },
  {
    id: "fixtures",
    label: "Fixture Analysis",
    sublabel: "Who has the best run ahead",
    question: "Which teams have the easiest next 5 fixtures?",
    description: "Know exactly who to target and who to avoid with fixture difficulty rankings.",
    messages: [
      {
        type: "text",
        content:
          "Ranking Premier League teams by fixture difficulty for GW29–33 (lower FDR = easier):",
      },
      {
        type: "bullets",
        items: [
          "🟢 Liverpool — FDR avg 2.0 · Ipswich, Brentford, Fulham",
          "🟢 Aston Villa — FDR avg 2.2 · Wolves, Bournemouth, Ipswich",
          "🟡 Arsenal — FDR avg 2.8 · Palace, Newcastle, Brighton",
          "🔴 Man Utd — FDR avg 4.2 · City, Chelsea, Arsenal",
        ],
      },
      {
        type: "text",
        content:
          "Triple-up on Liverpool assets? Salah + Trent + Robertson covers a golden run of fixtures.",
      },
    ],
  },
  {
    id: "price",
    label: "Price Watch",
    sublabel: "Risers, fallers & differentials",
    question: "Give me the best value differentials under £6m",
    description: "Spot price risers early and find the differentials your mini-league rivals are missing.",
    messages: [
      {
        type: "text",
        content:
          "Here are **3 under-the-radar value picks** under £6.0m with excellent upcoming fixtures:",
      },
      {
        type: "players",
        players: [
          { name: "A. Semenyo", club: "Bournemouth", price: "£5.7m", pts: "91pts", img: "/player_images/circular/antoine_semenyo_circular.png" },
          { name: "J. Ramsey", club: "Newcastle", price: "£5.0m", pts: "78pts", img: "/player_images/circular/mohamed_salah_circular.png" },
          { name: "B. Mbeumo", club: "Brentford", price: "£7.1m", pts: "124pts", img: "/player_images/circular/erling_haaland_circular.png" },
        ],
      },
      {
        type: "text",
        content:
          "Semenyo is owned by just **4.1%** and has 3 goals in his last 4. Great differential with serious upside.",
      },
    ],
  },
]

const INTERVAL_MS = 6000

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function ChatShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const [visible, setVisible] = useState(true)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const goToTab = useCallback((idx: number) => {
    setVisible(false)
    setTimeout(() => {
      setActiveTab(idx)
      setVisible(true)
    }, 200)
  }, [])

  // Auto-rotate
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % TABS.length)
        setVisible(true)
      }, 200)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const tab = TABS[activeTab]

  const fi = (delay: string) =>
    inView
      ? { animation: `scFadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: delay }
      : { opacity: 0 }

  return (
    <section ref={sectionRef} className="border-b border-white/[0.07] px-4 py-24 bg-black">
      <style>{`
        @keyframes scFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="container mx-auto max-w-5xl">

        {/* Section header */}
        <div className="mb-12 text-center">
          <h2
            className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
            style={{
              fontFamily: "'Futura Maxi CG', sans-serif",
              WebkitTextStroke: "6px #2E0032",
              paintOrder: "stroke fill",
              ...fi("0.1s"),
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Ask Chat</span>
            <span style={{ color: "#00FFFF" }}>FPL </span>
            <span style={{ color: "#00FF86" }}>AI</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto" style={fi("0.22s")}>
            Get instant, data-driven answers to any FPL question. Here are some examples of what our power users are asking right now.
          </p>
        </div>

        {/* Full-width mock chat window — fixed height so it never resizes */}
        <div
          className="rounded-[24px] border border-white/10 bg-gradient-to-b from-[#0d0d0d] to-[#080808] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden flex mb-5"
          style={{ height: 500, ...fi("0.38s") }}
        >
          {/* Slim left sidebar */}
          <div className="hidden md:flex w-[190px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01] p-3 gap-1">
            <div className="mb-3 px-1">
              <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={100} height={28} className="h-6 w-auto" />
            </div>
            {["GW29 Captain advice", "Who to transfer in?", "Best budget picks", "Fixture analysis"].map((t, i) => (
              <div
                key={i}
                className={`rounded-lg px-2.5 py-2 text-[11px] truncate cursor-default transition-colors duration-300 border ${
                  i === activeTab
                    ? "bg-white/[0.08] text-white/80 border-white/[0.08]"
                    : "text-white/25 border-transparent"
                }`}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Main chat pane */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-black text-black"
                  style={{ background: "linear-gradient(135deg, #00FFFF, #00FF87)" }}
                >AI</div>
                <span className="text-[13px] font-semibold text-white/60">ChatFPL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87] animate-pulse" />
                <span className="text-[11px] text-[#00FF87]/60">Live FPL data</span>
              </div>
            </div>

            {/* Messages — fixed scroll area */}
            <div
              className="flex-1 overflow-hidden p-5 space-y-4"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            >
              {/* User message */}
              <div className="flex items-end justify-end gap-2.5">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-white/[0.07] border border-white/[0.08] px-4 py-2.5">
                  <p className="text-sm text-white/85 leading-relaxed">{tab.question}</p>
                </div>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg, #00FFFF, #00FF87)" }}
                >
                  AB
                </div>
              </div>

              {/* AI message — single bubble containing all content */}
              <div className="flex items-start gap-2.5">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #00FFFF, #00FF87)" }}
                >
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-white/50">ChatFPL</span>
                    <span className="text-[10px] text-white/20">just now</span>
                  </div>
                  {/* Single response bubble */}
                  <div className="rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.06] px-4 py-3 space-y-3">
                    {tab.messages.map((msg, mi) => {
                      if (msg.type === "text") {
                        return (
                          <p key={mi} className="text-sm text-white/80 leading-relaxed">
                            {renderMarkdown(msg.content!)}
                          </p>
                        )
                      }
                      if (msg.type === "players" && msg.players) {
                        return (
                          <div key={mi} className="space-y-1.5">
                            {msg.players.map((p, pi) => (
                              <div key={pi} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
                                <span className="text-[10px] font-bold text-white/20 w-4 shrink-0">#{pi + 1}</span>
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                                  <Image src={p.img} alt={p.name} width={32} height={32} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-white leading-tight truncate">{p.name}</div>
                                  <div className="text-[11px] text-white/35">{p.club}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-[#00FF87]">{p.pts}</div>
                                  <div className="text-[11px] text-white/35">{p.price}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      if (msg.type === "bullets" && msg.items) {
                        return (
                          <div key={mi} className="space-y-1.5">
                            {msg.items.map((item, ii) => (
                              <div key={ii} className="flex items-start gap-2">
                                <span className="text-[#00FF87]/70 mt-0.5 text-xs font-bold shrink-0">›</span>
                                <span className="text-sm text-white/75 leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Mock input bar */}
            <div className="shrink-0 border-t border-white/[0.06] p-3.5 bg-black/20">
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 flex items-center gap-3">
                <span className="text-sm text-white/20 flex-1 select-none">Ask your FPL question...</span>
                <div
                  className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #00FF87, #00FFFF)" }}
                >
                  <svg className="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DesignRocket-style pill tab bar ── */}
        <div className="flex justify-center mb-4" style={fi("0.52s")}>
          <div
            className="inline-flex items-center gap-1 rounded-full p-1.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 20px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {TABS.map((t, i) => {
              const active = i === activeTab
              return (
                <button
                  key={t.id}
                  onClick={() => goToTab(i)}
                  className="relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 focus:outline-none"
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)) padding-box, linear-gradient(to right, #00FFFF, #00FF87) border-box",
                          border: "1.5px solid transparent",
                          boxShadow: "0 0 12px rgba(0,255,200,0.12)",
                        }
                      : { border: "1.5px solid transparent" }
                  }
                >
                  {active ? (
                    <span
                      className="font-semibold"
                      style={{
                        background: "linear-gradient(to right, #00FFFF, #00FF87)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {t.label}
                    </span>
                  ) : (
                    <span className="text-white/38 hover:text-white/60 transition-colors">{t.label}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab description line */}
        <p
          className="text-center text-sm text-white/40 transition-opacity duration-200"
          style={{
            ...fi("0.6s"),
            opacity: inView ? (visible ? undefined : 0) : 0,
          }}
        >
          {tab.description}
        </p>

        {/* Bottom CTA */}
        <div className="mt-10 text-center" style={fi("0.7s")}>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-black font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)] hover:-translate-y-0.5"
          >
            Start Chatting for Free →
          </Link>
          <p className="mt-3 text-xs text-white/25">Free trial · No credit card required</p>
        </div>
      </div>

    </section>
  )
}
