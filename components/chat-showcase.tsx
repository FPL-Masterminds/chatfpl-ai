"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import type { ShowcasePlayer, ShowcasePlayers, EdgePlayer } from "@/app/api/showcase-players/route"

// Team badge helper (badges don't change between seasons)
const fplBadge = (teamCode: number) =>
  `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`

type PlayerLine = { name: string; info: string; photoUrl: string | null }

type Tab = {
  id: string
  label: string
  description: string
  question: string
  // AI response — array of paragraphs / player lists
  response: Array<{ type: "text"; text: string } | { type: "players"; players: PlayerLine[] }>
}

// Tab structure — questions + static text only. Players come from live API.
const TAB_DEFS = [
  {
    id: "captain",
    label: "Captain Picks",
    description: "Instant captaincy advice using live form, fixtures and ownership data.",
    question: "Who should I captain this gameweek?",
    intro: "Based on current form and upcoming fixtures, here are this week's **top captain options** from the live FPL data:",
    outro: "Pick the highest-form player with the best fixture. ChatFPL AI can break down each option in depth.",
    dataKey: "topPts" as keyof ShowcasePlayers,
  },
  {
    id: "transfers",
    label: "Transfer Advice",
    description: "Make smarter transfer decisions with fixture-aware, data-driven recommendations.",
    question: "Who are the best players to transfer in right now?",
    intro: "Here are the **highest form players** in the current FPL gameweek based on live API data:",
    outro: "Form is key this late in the season. Want me to cross-reference these against your current squad?",
    dataKey: "topForm" as keyof ShowcasePlayers,
  },
  {
    id: "fixtures",
    label: "Fixture Analysis",
    description: "Know exactly who to target and who to avoid with fixture difficulty rankings.",
    question: "Which players have been rising in price this week?",
    intro: "These players have seen **price increases this gameweek** based on transfer activity — act before they rise further:",
    outro: "Price rises compound quickly. Getting these in early maximises your budget for the rest of the season.",
    dataKey: "risers" as keyof ShowcasePlayers,
  },
  {
    id: "price",
    label: "Price Watch",
    description: "Spot price risers early and find the differentials your mini-league rivals are missing.",
    question: "Give me differential picks under 10% ownership with good form",
    intro: "Here are **live differentials** — players with strong current form and under 10% ownership:",
    outro: "Low ownership + good form = mini-league edge. These are the players your rivals probably don't have.",
    dataKey: "differentials" as keyof ShowcasePlayers,
  },
]

const PROMPTS = [
  "Give me a differential captain option under 10% owned",
  "Should I use my wildcard now?",
]

const INTERVAL_MS = 6000

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export function ChatShowcase() {
  const [activeTab, setActiveTab]   = useState(0)
  const [visible, setVisible]       = useState(true)
  const [inView, setInView]         = useState(false)
  const [players, setPlayers]       = useState<ShowcasePlayers | null>(null)
  const sectionRef                  = useRef<HTMLElement>(null)

  // Fetch live player data once
  useEffect(() => {
    fetch("/api/showcase-players")
      .then(r => r.json())
      .then(setPlayers)
      .catch(() => {}) // silent fail — tabs still render without player cards
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const goToTab = useCallback((idx: number) => {
    setVisible(false)
    setTimeout(() => { setActiveTab(idx); setVisible(true) }, 200)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setActiveTab(p => (p + 1) % TAB_DEFS.length); setVisible(true) }, 200)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const fi = (delay: string) =>
    inView
      ? { animation: `scFadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: delay }
      : { opacity: 0 as const }

  const tabDef = TAB_DEFS[activeTab]
  const livePlayers: ShowcasePlayer[] = players ? players[tabDef.dataKey] : []

  // Build response blocks from live data
  const responseBlocks: Array<{ type: "text"; text: string } | { type: "players"; players: PlayerLine[] }> = [
    { type: "text", text: tabDef.intro },
    ...(livePlayers.length > 0 ? [{
      type: "players" as const,
      players: livePlayers.map(p => ({
        name: p.name,
        info: `${p.position} · ${p.price} · ${p.club} · ${p.totalPts} pts · Form ${p.form}`,
        photoUrl: p.photoUrl,
      })),
    }] : []),
    { type: "text", text: tabDef.outro },
  ]

  return (
    <section ref={sectionRef} className="border-b border-white/[0.07] px-4 py-24 bg-black">
      <style>{`
        @keyframes scFadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <h2
            className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
            style={{ fontFamily:"'Futura Maxi CG',sans-serif", WebkitTextStroke:"6px #2E0032", paintOrder:"stroke fill", ...fi("0.1s") }}
          >
            <span style={{ color:"#FFFFFF" }}>Ask Chat</span>
            <span style={{ color:"#00FFFF" }}>FPL </span>
            <span style={{ color:"#00FF86" }}>AI</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto" style={fi("0.22s")}>
            Get instant, data-driven answers to any FPL question. Here are some examples of what our power users are asking right now.
          </p>
        </div>

        {/* ── Mock app window — gradient border + ambient glow ── */}
        <div className="relative mb-5" style={fi("0.38s")}>
          {/* Ambient glow — blurred gradient behind the card */}
          <div
            className="absolute inset-0 rounded-[32px] opacity-30 blur-2xl pointer-events-none"
            style={{ background: "linear-gradient(135deg, #00FFFF 0%, #00FF87 100%)" }}
          />
          {/* 2px gradient border wrapper */}
          <div
            className="relative rounded-[26px] p-[2px]"
            style={{ background: "linear-gradient(135deg, #00FFFF 0%, #00FF87 100%)" }}
          >
        <div
          className="rounded-[24px] bg-[#080808] overflow-hidden flex w-full"
          style={{ height: 680 }}
        >

          {/* Left sidebar */}
          <div className="hidden md:flex w-[180px] shrink-0 flex-col border-r border-white/[0.06] bg-[#060606] p-3 gap-1 overflow-hidden">
            <div className="mb-4 px-1">
              <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={100} height={28} className="h-6 w-auto" />
            </div>
            <button
              className="w-full rounded-2xl text-black font-semibold px-3 py-2.5 mb-3 text-xs shrink-0 text-center"
              style={{ background: "linear-gradient(to right, #22d3ee, #34d399)", boxShadow: "0 0 20px rgba(0,255,200,0.15)" }}
            >
              + New Chat
            </button>
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30 mb-1.5 px-1">Recent chats</p>
            {[
              ["Who are the top three scori...",    "23 Mar"],
              ["Give me three midfield differ...",  "20 Mar"],
              ["Give me statistics on Moham...",    "20 Mar"],
              ["Best captain for GW32?",            "18 Mar"],
              ["Which defenders have the bes...",   "17 Mar"],
              ["Is Salah still worth his pri...",   "15 Mar"],
              ["Show me the top price risers",      "14 Mar"],
              ["Compare Mbeumo vs Watkins",         "12 Mar"],
              ["Who has the best fixtures GW...",   "11 Mar"],
              ["Wildcard options under £6m",        "10 Mar"],
            ].map(([t, d], i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 border cursor-default transition-colors duration-300 ${
                  i === activeTab % 3
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-white/[0.04] bg-white/[0.015]"
                }`}
              >
                <div className="text-[11px] text-white/75 leading-tight truncate">{t}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{d}</div>
              </div>
            ))}
          </div>

          {/* ── Centre: chat pane ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Top bar — mirrors devchat */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.015] shrink-0 gap-3">

              {/* Mobile left: logo only */}
              <div className="md:hidden flex-1 min-w-0">
                <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={110} height={28} className="h-6 w-auto" />
              </div>

              {/* Desktop left: title + subtitle */}
              <div className="hidden md:block flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white leading-tight truncate">Chat with your FPL AI analyst</div>
                <div className="text-[10px] text-white/40 mt-0.5">Live data · Real-time reasoning · Smarter decisions</div>
              </div>

              {/* Right-side actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* API live */}
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300">API live</span>
                </div>
                {/* Bar chart icon */}
                <button className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center opacity-60">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="0" y="5" width="3" height="8" rx="0.5" fill="white"/>
                    <rect x="5" y="2" width="3" height="11" rx="0.5" fill="white"/>
                    <rect x="10" y="0" width="3" height="13" rx="0.5" fill="white"/>
                  </svg>
                </button>
                {/* Plus / new chat icon */}
                <button className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center opacity-60">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Hamburger — mobile only */}
                <button className="md:hidden h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.04] flex flex-col items-center justify-center gap-[4px] opacity-60">
                  <span className="block w-4 h-px bg-white rounded-full" />
                  <span className="block w-4 h-px bg-white rounded-full" />
                  <span className="block w-4 h-px bg-white rounded-full" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-hidden px-4 py-4 space-y-3"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            >
              {/* User message — exact devchat style */}
              <div className="w-full rounded-[20px] border border-cyan-400/15 bg-cyan-400/[0.07] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/70 mb-1.5">You</div>
                <p className="text-sm leading-6 text-white/90">{tabDef.question}</p>
              </div>

              {/* AI message — exact devchat style */}
              <div className="w-full rounded-[24px] border border-white/[0.08] bg-black/30 px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-black font-black text-[10px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#00FFFF,#00FF87)" }}>AI</div>
                  <div>
                    <div className="text-sm font-semibold text-white">ChatFPL</div>
                    <div className="text-[11px] text-white/40">live</div>
                  </div>
                </div>
                <div className="text-sm leading-6 text-white/85 space-y-3">
                  {responseBlocks.map((block, bi) => {
                    if (block.type === "text") {
                      return (
                        <p key={bi} className="whitespace-pre-wrap">{renderText(block.text)}</p>
                      )
                    }
                    if (block.type === "players") {
                      return (
                        <ul key={bi} className="space-y-2 pl-1">
                          {block.players.map((p, pi) => (
                            <li key={pi} className="flex items-center gap-2.5">
                              <span className="text-[11px] text-white/30 w-4 shrink-0">{pi + 1}.</span>
                              {p.photoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.photoUrl}
                                  alt={p.name}
                                  className="inline-block h-10 w-auto rounded shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-white">{p.name} </span>
                                <span className="text-[11px] text-white/45">{p.info}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    return null
                  })}
                  {/* Loading skeleton while API fetches */}
                  {!players && (
                    <div className="space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 rounded-xl bg-white/[0.04] animate-pulse" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prompt pills + input — exact devchat */}
            <div className="shrink-0 border-t border-white/[0.06] bg-black/20 px-4 pt-2.5 pb-3">
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {PROMPTS.map((p) => (
                  <span key={p} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/55 cursor-default">
                    {p}
                  </span>
                ))}
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2.5 flex items-center gap-2">
                <span className="flex-1 text-sm text-white/30 select-none">Ask your FPL question...</span>
                <button
                  className="h-9 px-4 rounded-xl text-black font-semibold text-sm flex items-center gap-1.5 shrink-0"
                  style={{ background: "linear-gradient(to right,#22d3ee,#34d399)", boxShadow: "0 0 20px rgba(0,255,200,0.2)" }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z" />
                  </svg>
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: static Gameweek Edge panel ── */}
          <div className="hidden xl:flex w-[230px] shrink-0 flex-col border-l border-white/[0.06] bg-[#060606] p-3 gap-2.5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5 shrink-0">
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-white/35">Live FPL</div>
                <div className="text-sm font-semibold text-white mt-0.5">Gameweek Edge</div>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[9px] text-emerald-300">Live</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/35 mb-2">Gameweek 32 Deadline</div>
              <div className="grid grid-cols-4 gap-1">
                {[["17","DAYS"],["20","HRS"],["28","MIN"],["30","SEC"]].map(([n,u]) => (
                  <div key={u} className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-black/30 py-2">
                    <span className="text-base font-bold text-white tabular-nums leading-none">{n}</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/30 mt-0.5">{u}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Injury ticker */}
            <div className="rounded-[16px] border border-red-400/20 bg-red-400/[0.04] p-3 shrink-0">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-red-400/80">Injury &amp; Availability</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fplBadge(43)} alt="MCI" className="h-5 w-5 object-contain" />
                <span className="text-xs font-semibold text-white">K. Walker</span>
                <span className="ml-auto text-[9px] text-white/35">NEW</span>
              </div>
              <p className="text-[11px] text-white/60 leading-4">Has joined AC Milan on loan for the rest of the season.</p>
            </div>

            {/* Most Selected */}
            <div className="rounded-[16px] border border-purple-400/20 bg-purple-400/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-purple-300/80 mb-2">Most Selected</div>
              <div className="space-y-1.5">
                {(players?.mostSelected ?? [] as EdgePlayer[]).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-2 py-1.5">
                    <span className="text-[9px] text-white/25 w-3">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fplBadge(p.teamCode)} alt={p.team} className="h-4 w-4 object-contain shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                      <div className="text-[9px] text-white/35">{p.team}</div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-300 shrink-0">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Bonus Points */}
            <div className="rounded-[16px] border border-amber-400/20 bg-amber-400/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-amber-300/80 mb-2">Most Bonus Points</div>
              <div className="space-y-1.5">
                {(players?.mostBonus ?? [] as EdgePlayer[]).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-2 py-1.5">
                    <span className="text-[9px] text-white/25 w-3">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fplBadge(p.teamCode)} alt={p.team} className="h-4 w-4 object-contain shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                      <div className="text-[9px] text-white/35">{p.team}</div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 shrink-0">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>{/* end inner window */}
          </div>{/* end gradient border wrapper */}
        </div>{/* end glow + relative container */}

        {/* Pill tab bar */}
        <div className="flex justify-center mb-4" style={fi("0.52s")}>
          <div
            className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full p-1 sm:p-1.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 20px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {TAB_DEFS.map((t, i) => {
              const active = i === activeTab
              return (
                <button
                  key={t.id}
                  onClick={() => goToTab(i)}
                  className="relative rounded-full px-3 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-sm font-medium transition-all duration-300 focus:outline-none"
                  style={active ? {
                    background: "linear-gradient(rgba(0,0,0,0.9),rgba(0,0,0,0.9)) padding-box, linear-gradient(to right,#00FFFF,#00FF87) border-box",
                    border: "1.5px solid transparent",
                    boxShadow: "0 0 12px rgba(0,255,200,0.12)",
                  } : { border: "1.5px solid transparent" }}
                >
                  {active ? (
                    <span className="font-semibold" style={{ background:"linear-gradient(to right,#00FFFF,#00FF87)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
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

        {/* Description */}
        <p
          className="text-center text-sm text-white/40"
          style={{ ...fi("0.6s"), opacity: inView ? (visible ? undefined : 0) : 0 }}
        >
          {tabDef.description}
        </p>

        {/* CTA */}
        <div className="mt-10 text-center" style={fi("0.7s")}>
          <Link href="/signup" className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-black font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)] hover:-translate-y-0.5">
            Start Chatting for Free →
          </Link>
          <p className="mt-3 text-xs text-white/25">Free trial · No credit card required</p>
        </div>
      </div>
    </section>
  )
}
