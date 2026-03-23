"use client"

import { useState, useEffect } from "react"
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
  icon: string
  label: string
  sublabel: string
  question: string
  messages: MessagePart[]
}

const TABS: Tab[] = [
  {
    id: "captain",
    icon: "⚽",
    label: "Captain Picks",
    sublabel: "Who to armband this GW",
    question: "Who should I captain for Gameweek 29?",
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
          "Salah faces a home fixture vs Ipswich (xG 2.6). With 8 goal involvements in his last 6, he's a near-certain armband choice.",
      },
    ],
  },
  {
    id: "transfers",
    icon: "🔄",
    label: "Transfer Advice",
    sublabel: "Best in, best out decisions",
    question: "I own Mateta — should I sell him this week?",
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
          "Blanks GW32 (no fixture)",
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
    icon: "📊",
    label: "Fixture Analysis",
    sublabel: "Who has the best run ahead",
    question: "Which teams have the easiest next 5 fixtures?",
    messages: [
      {
        type: "text",
        content:
          "Ranking Premier League teams by fixture difficulty for GW29–33 (FDR score, lower = easier):",
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
          "Triple-up on Liverpool assets? Salah + Trent + Robertson gives you coverage across a golden run.",
      },
    ],
  },
  {
    id: "price",
    icon: "💰",
    label: "Price Watch",
    sublabel: "Risers, fallers & value picks",
    question: "Give me the best value differentials under £6m",
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
          "Semenyo is owned by just **4.1%** and has 3 goals in 4. Great differential with upside.",
      },
    ],
  },
]

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
  const [animating, setAnimating] = useState(false)

  function switchTab(idx: number) {
    if (idx === activeTab || animating) return
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      setActiveTab(idx)
      setVisible(true)
      setAnimating(false)
    }, 220)
  }

  const tab = TABS[activeTab]

  return (
    <section className="border-b border-white/[0.07] px-4 py-24 bg-black">
      <div className="container mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FF87]/70">
            How It Works
          </p>
          <h2
            className="mb-4 font-bold uppercase leading-[1.05]"
            style={{
              fontFamily: "'Futura Maxi CG', sans-serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              WebkitTextStroke: "5px #2E0032",
              paintOrder: "stroke fill",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Ask. Analyse. </span>
            <span style={{ color: "#00FFFF" }}>Dominate </span>
            <span style={{ color: "#00FF86" }}>Your League.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Four ways ChatFPL AI gives you the edge every single gameweek.
          </p>
        </div>

        {/* Main split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-8 items-start">
          {/* Left: tab buttons */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
            {TABS.map((t, i) => {
              const active = i === activeTab
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(i)}
                  className={`group relative flex-shrink-0 w-[220px] lg:w-full text-left rounded-2xl border px-4 py-4 transition-all duration-300 ${
                    active
                      ? "border-[#00FF87]/40 bg-[#00FF87]/[0.07] shadow-[0_0_30px_rgba(0,255,135,0.08)]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 rounded-full bg-gradient-to-b from-[#00FF87] to-[#00FFFF]" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <div
                        className={`text-sm font-semibold transition-colors ${
                          active ? "text-white" : "text-white/60 group-hover:text-white/80"
                        }`}
                      >
                        {t.label}
                      </div>
                      <div className="text-[11px] text-white/35 mt-0.5">{t.sublabel}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: mock chat window */}
          <div
            className="rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{ minHeight: 420 }}
          >
            {/* Chat window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="ml-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-[8px] font-black text-black">AI</div>
                <span className="text-[12px] text-white/40 font-medium">ChatFPL AI</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87] animate-pulse" />
                <span className="text-[10px] text-[#00FF87]/70">Live data</span>
              </div>
            </div>

            {/* Messages area */}
            <div
              className="p-5 space-y-4 transition-all"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.22s ease, transform 0.22s ease",
              }}
            >
              {/* User question bubble */}
              <div className="flex items-end justify-end gap-2">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#00FF87]/20 to-[#00FFFF]/20 border border-[#00FF87]/20 px-4 py-2.5">
                  <p className="text-sm text-white/90">{tab.question}</p>
                </div>
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-[9px] font-black text-black shrink-0">
                  JM
                </div>
              </div>

              {/* AI response */}
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-[9px] font-black text-black shrink-0 mt-0.5">
                  AI
                </div>
                <div className="flex-1 space-y-3">
                  {tab.messages.map((msg, mi) => {
                    if (msg.type === "text") {
                      return (
                        <div
                          key={mi}
                          className="rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.07] px-4 py-3"
                        >
                          <p className="text-sm text-white/75 leading-relaxed">
                            {renderMarkdown(msg.content!)}
                          </p>
                        </div>
                      )
                    }
                    if (msg.type === "players" && msg.players) {
                      return (
                        <div key={mi} className="space-y-2">
                          {msg.players.map((p, pi) => (
                            <div
                              key={pi}
                              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2"
                            >
                              <div className="h-9 w-9 rounded-full overflow-hidden border border-white/20 shrink-0">
                                <Image
                                  src={p.img}
                                  alt={p.name}
                                  width={36}
                                  height={36}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white leading-tight">{p.name}</div>
                                <div className="text-[11px] text-white/40">{p.club}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-[#00FF87]">{p.pts}</div>
                                <div className="text-[11px] text-white/40">{p.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    if (msg.type === "bullets" && msg.items) {
                      return (
                        <div
                          key={mi}
                          className="rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.07] px-4 py-3 space-y-1.5"
                        >
                          {msg.items.map((item, ii) => (
                            <div key={ii} className="flex items-start gap-2">
                              <span className="text-[#00FF87] mt-0.5 text-xs">›</span>
                              <span className="text-sm text-white/70 leading-relaxed">{item}</span>
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

            {/* Mock input bar at bottom */}
            <div className="mx-4 mb-4 mt-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 flex items-center gap-3">
              <span className="text-sm text-white/25 flex-1">Ask your FPL question...</span>
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#00FF87] to-[#00FFFF] flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-black font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)] hover:-translate-y-0.5"
          >
            Start Chatting for Free →
          </Link>
          <p className="mt-3 text-xs text-white/30">Free trial · No credit card required</p>
        </div>
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
