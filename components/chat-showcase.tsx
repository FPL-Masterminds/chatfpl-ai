"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"

// FPL CDN helpers — auto-update each season
const fplPhoto = (code: number) =>
  `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`
const fplBadge = (teamCode: number) =>
  `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`

type PlayerLine = { name: string; info: string; photoCode: number | null }

type Tab = {
  id: string
  label: string
  description: string
  question: string
  // AI response — array of paragraphs / player lists
  response: Array<{ type: "text"; text: string } | { type: "players"; players: PlayerLine[] }>
}

const TABS: Tab[] = [
  {
    id: "captain",
    label: "Captain Picks",
    description: "Instant captaincy advice using live form, fixtures and ownership data.",
    question: "Who should I captain for Gameweek 29?",
    response: [
      { type: "text", text: "Based on GW29 fixtures and current form, **Mohamed Salah** is the standout captain pick. Here are your top three options:" },
      {
        type: "players",
        players: [
          { name: "Mohamed Salah", info: "FWD · £13.1m · 183 pts · Form 9.8", photoCode: 118748 },
          { name: "Erling Haaland", info: "FWD · £14.0m · 174 pts · Form 7.2", photoCode: 447415 },
          { name: "Bukayo Saka",    info: "MID · £10.2m · 149 pts · Form 6.8", photoCode: 223340 },
        ],
      },
      { type: "text", text: "Salah faces Ipswich at Anfield this week — xG of 2.6 in his last three home games. Near-certain armband choice." },
    ],
  },
  {
    id: "transfers",
    label: "Transfer Advice",
    description: "Make smarter transfer decisions with fixture-aware, data-driven recommendations.",
    question: "I own Mateta — should I sell him this week?",
    response: [
      { type: "text", text: "**Short answer: yes.** Mateta's fixtures turn rough for the next four gameweeks — Arsenal (H), Man City (A), Chelsea (H), then a blank in GW32. His projected xG across that run is just 0.4 per game." },
      { type: "text", text: "**Recommended replacement:** Erling Haaland (£14.0m). Home double in GW29/30, six goals in his last five starts, and 42% ownership growth this week alone." },
      {
        type: "players",
        players: [
          { name: "Erling Haaland", info: "FWD · £14.0m · 174 pts · Form 7.2", photoCode: 447415 },
          { name: "Bukayo Saka",    info: "MID · £10.2m · 149 pts · Form 6.8", photoCode: 223340 },
        ],
      },
    ],
  },
  {
    id: "fixtures",
    label: "Fixture Analysis",
    description: "Know exactly who to target and who to avoid with fixture difficulty rankings.",
    question: "Which teams have the easiest next 5 fixtures?",
    response: [
      { type: "text", text: "Here's the fixture difficulty ranking for GW29–33 (FDR average, lower = easier):" },
      { type: "text", text: "🟢 **Liverpool** — FDR avg 2.0 · Ipswich, Brentford, Fulham, Southampton, Wolves\n🟢 **Aston Villa** — FDR avg 2.2 · Wolves, Bournemouth, Ipswich, Brighton, Everton\n🟡 **Arsenal** — FDR avg 2.8 · Crystal Palace, Newcastle, Brighton, Spurs, Brentford\n🔴 **Man Utd** — FDR avg 4.2 · Man City, Chelsea, Arsenal, Liverpool, Spurs" },
      {
        type: "players",
        players: [
          { name: "Mohamed Salah", info: "FWD · £13.1m · 183 pts · Form 9.8", photoCode: 118748 },
          { name: "Erling Haaland", info: "FWD · £14.0m · 174 pts · Form 7.2", photoCode: 447415 },
        ],
      },
      { type: "text", text: "Triple-up on Liverpool assets? Salah + Trent + Robertson gives blanket coverage across that golden run." },
    ],
  },
  {
    id: "price",
    label: "Price Watch",
    description: "Spot price risers early and find the differentials your mini-league rivals are missing.",
    question: "Give me three differential picks under £6m",
    response: [
      { type: "text", text: "Here are **three under-the-radar value picks** under £6.0m with excellent upcoming fixtures and strong recent form:" },
      {
        type: "players",
        players: [
          { name: "Mohamed Salah", info: "FWD · £13.1m · 4.1% captained · 3 goals last 4", photoCode: 118748 },
          { name: "Bukayo Saka",   info: "MID · £10.2m · 3.8% owned diff · 2G 1A last 3",  photoCode: 223340 },
          { name: "Erling Haaland",info: "FWD · £14.0m · 8.2% owned · 5 goal involvements", photoCode: 447415 },
        ],
      },
      { type: "text", text: "For true differentials, look at players with upcoming easy fixtures and sub-10% ownership. Would you like me to filter by position or budget?" },
    ],
  },
]

const PROMPTS = [
  "Give me a differential captain option under 10% owned",
  "Should I use my wildcard now?",
  "Which players have the most clean sheet potential?",
  "Who are the best differential picks this GW?",
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
  const [activeTab, setActiveTab] = useState(0)
  const [visible, setVisible]     = useState(true)
  const [inView, setInView]       = useState(false)
  const sectionRef                = useRef<HTMLElement>(null)

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
      setTimeout(() => { setActiveTab(p => (p + 1) % TABS.length); setVisible(true) }, 200)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const fi = (delay: string) =>
    inView
      ? { animation: `scFadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: delay }
      : { opacity: 0 as const }

  const tab = TABS[activeTab]

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

        {/* ── Mock app window ── */}
        <div
          className="rounded-[24px] border border-white/10 bg-[#080808] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden flex mb-5"
          style={{ height: 680, ...fi("0.38s") }}
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
              "Who are the top three scori...",
              "Give me three midfield differ...",
              "Give me statistics on Moham...",
            ].map((t, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 border cursor-default transition-colors duration-300 ${
                  i === activeTab % 3
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-white/[0.04] bg-white/[0.015]"
                }`}
              >
                <div className="text-[11px] text-white/75 leading-tight truncate">{t}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{["23 Mar","20 Mar","20 Mar"][i]}</div>
              </div>
            ))}
          </div>

          {/* ── Centre: chat pane ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Top bar — mirrors devchat */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.015] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#00FFFF,#00FF87)" }}>AI</div>
                <span className="text-[13px] font-semibold text-white">ChatFPL</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300">API live</span>
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
                <p className="text-sm leading-6 text-white/90">{tab.question}</p>
              </div>

              {/* AI message — exact devchat style */}
              <div className="w-full rounded-[24px] border border-white/[0.08] bg-black/30 px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-black font-black text-[10px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#00FFFF,#00FF87)" }}>AI</div>
                  <div>
                    <div className="text-sm font-semibold text-white">ChatFPL</div>
                    <div className="text-[11px] text-white/40">18:46</div>
                  </div>
                </div>
                <div className="text-sm leading-6 text-white/85 space-y-3">
                  {tab.response.map((block, bi) => {
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
                              {/* FPL CDN photo — portrait thumbnail, exactly as real app renders */}
                              {p.photoCode && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={fplPhoto(p.photoCode)}
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
                {[
                  { rank:1, name:"Haaland",    team:"MCI", code:43, val:"55.0%" },
                  { rank:2, name:"Semenyo",    team:"BOU", code:91, val:"53.6%" },
                  { rank:3, name:"João Pedro", team:"CHE", code:8,  val:"50.5%" },
                ].map(p => (
                  <div key={p.rank} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-2 py-1.5">
                    <span className="text-[9px] text-white/25 w-3">{p.rank}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fplBadge(p.code)} alt={p.team} className="h-4 w-4 object-contain shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                      <div className="text-[9px] text-white/35">{p.team}</div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-300 shrink-0">{p.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Bonus Points */}
            <div className="rounded-[16px] border border-amber-400/20 bg-amber-400/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-amber-300/80 mb-2">Most Bonus Points</div>
              <div className="space-y-1.5">
                {[
                  { rank:1, name:"B.Fernandes", team:"MUN", code:1,  val:"36 bonus" },
                  { rank:2, name:"Haaland",     team:"MCI", code:43, val:"35 bonus" },
                  { rank:3, name:"João Pedro",  team:"CHE", code:8,  val:"28 bonus" },
                ].map(p => (
                  <div key={p.rank} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-2 py-1.5">
                    <span className="text-[9px] text-white/25 w-3">{p.rank}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fplBadge(p.code)} alt={p.team} className="h-4 w-4 object-contain shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                      <div className="text-[9px] text-white/35">{p.team}</div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 shrink-0">{p.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pill tab bar */}
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
          {tab.description}
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
