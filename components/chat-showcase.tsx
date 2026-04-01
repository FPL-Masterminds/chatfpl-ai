"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { AnimatedGlow } from "@/components/animated-glow"
import Image from "next/image"
import Link from "next/link"
import type { ShowcasePlayer, ShowcasePlayers, EdgePlayer, InjuryItem } from "@/app/api/showcase-players/route"

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
    question: "Who are the best captain options this current gameweek?",
    intro: "Based on current form and upcoming fixtures, here are this week's **top captain options** from the live FPL data:",
    outro: "Pick the highest-form player with the best fixture. ChatFPL AI can break down each option in depth.",
    dataKey: "topPts" as keyof ShowcasePlayers,
  },
  {
    id: "transfers",
    label: "Transfer Advice",
    description: "Make smarter transfer decisions with fixture-aware, data-driven recommendations.",
    question: "Who are the best players to transfer in right now using form as a guide?",
    intro: "Here are the **highest form players** in the current FPL gameweek based on live API data:",
    outro: "Form is key this late in the season. Want me to cross-reference these against your current squad?",
    dataKey: "topForm" as keyof ShowcasePlayers,
  },
  {
    id: "fixtures",
    label: "Fixture Analysis",
    description: "Know exactly who to target and who to avoid with fixture difficulty rankings.",
    question: "Give me three differential picks under 10% ownership with good fixtures",
    intro: "Here are **live differentials** — players with strong current form and under 10% ownership:",
    outro: "Low ownership + favourable fixtures = mini-league edge. These are the players your rivals probably don't have.",
    dataKey: "differentials" as keyof ShowcasePlayers,
  },
  {
    id: "price",
    label: "Price Watch",
    description: "Spot price risers early and maximise your budget before rivals catch on.",
    question: "Which players are rising in price this gameweek - who should I buy before they climb?",
    intro: "These players have seen **price increases this gameweek** based on transfer activity - act before they rise further:",
    outro: "Price rises compound quickly. Getting these in early maximises your budget for the rest of the season.",
    dataKey: "risers" as keyof ShowcasePlayers,
  },
]

const PROMPTS = [
  "Give me a differential captain option under 10% owned",
  "Should I use my wildcard now?",
]

const INTERVAL_MS = 26000

// Strip **bold** markers for typewriter display (avoids ** appearing mid-type)
function stripBold(text: string) { return text.replace(/\*\*/g, "") }

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export function ChatShowcase() {
  const { data: session } = useSession()
  const ctaHref = session?.user ? "/chat" : "/signup"
  const [activeTab, setActiveTab]   = useState(0)
  const [visible, setVisible]       = useState(true)
  const [inView, setInView]         = useState(false)
  const [players, setPlayers]       = useState<ShowcasePlayers | null>(null)
  const [countdown, setCountdown]   = useState({ d: "--", h: "--", m: "--", s: "--" })
  const [newsIndex, setNewsIndex]   = useState(0)
  const [newsFading, setNewsFading] = useState(false)
  const [scTickerIdx, setScTickerIdx]       = useState(0)
  const [scTickerDisplay, setScTickerDisplay] = useState("")
  const [scTickerFading, setScTickerFading]   = useState(false)
  const [scTickerPhoto, setScTickerPhoto]     = useState<string | null>(null)
  const sectionRef                  = useRef<HTMLElement>(null)

  // ── Typewriter animation states ───────────────────────────────────────────
  const [qText, setQText]                     = useState("")   // user question typed so far
  const [showAiBubble, setShowAiBubble]       = useState(false)
  const [introText, setIntroText]             = useState("")
  const [introDone, setIntroDone]             = useState(false)
  const [revealedPlayers, setRevealedPlayers] = useState(0)
  const [outroText, setOutroText]             = useState("")
  const [outroDone, setOutroDone]             = useState(false)
  const playersRef  = useRef<ShowcasePlayers | null>(null)   // latest players without dep issues
  const animCleanup = useRef<(() => void) | null>(null)

  // Fetch live player data once
  useEffect(() => {
    fetch("/api/showcase-players")
      .then(r => r.json())
      .then((data: ShowcasePlayers) => {
        setPlayers(data)
        if (!data.nextDeadline) return
        const deadline = new Date(data.nextDeadline).getTime()
        const tick = () => {
          const diff = deadline - Date.now()
          if (diff <= 0) { setCountdown({ d: "0", h: "0", m: "0", s: "0" }); return }
          const d = Math.floor(diff / 86400000)
          const h = Math.floor((diff % 86400000) / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          const s = Math.floor((diff % 60000) / 1000)
          setCountdown({ d: String(d), h: String(h), m: String(m), s: String(s).padStart(2, "0") })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
      })
      .catch(() => {})
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

  const resetAnimStates = useCallback(() => {
    setQText(""); setShowAiBubble(false)
    setIntroText(""); setIntroDone(false)
    setRevealedPlayers(0); setOutroText(""); setOutroDone(false)
  }, [])

  const goToTab = useCallback((idx: number) => {
    setVisible(false)
    resetAnimStates()
    setTimeout(() => { setActiveTab(idx); setVisible(true) }, 200)
  }, [resetAnimStates])

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      resetAnimStates()
      setTimeout(() => { setActiveTab(p => (p + 1) % TAB_DEFS.length); setVisible(true) }, 200)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [resetAnimStates])

  // News ticker — fade out, swap, fade in every 7 s
  useEffect(() => {
    if (!players?.injuryNews?.length) return
    const id = setInterval(() => {
      setNewsFading(true)
      setTimeout(() => {
        setNewsIndex(i => (i + 1) % players.injuryNews.length)
        setNewsFading(false)
      }, 400)
    }, 7000)
    return () => clearInterval(id)
  }, [players?.injuryNews])

  // Keep playersRef in sync so animation closures always see latest data
  useEffect(() => { playersRef.current = players }, [players])

  // ── Chat typewriter animation — drives on every tab change ───────────────
  useEffect(() => {
    if (animCleanup.current) animCleanup.current()

    const tab      = TAB_DEFS[activeTab]
    const plainIntro = stripBold(tab.intro)
    const plainOutro = stripBold(tab.outro)

    // Reset all animation state
    setQText(""); setShowAiBubble(false)
    setIntroText(""); setIntroDone(false)
    setRevealedPlayers(0)
    setOutroText(""); setOutroDone(false)

    const timers: ReturnType<typeof setTimeout>[]   = []
    const intervals: ReturnType<typeof setInterval>[] = []
    let cancelled = false

    // Phase 1 — type the user question
    let qi = 0
    const qInterval = setInterval(() => {
      if (cancelled) return
      qi++
      setQText(tab.question.slice(0, qi))
      if (qi >= tab.question.length) {
        clearInterval(qInterval)

        // Phase 2 — "thinking" pause, then reveal AI bubble
        const t1 = setTimeout(() => {
          if (cancelled) return
          setShowAiBubble(true)

          // Phase 3 — type intro
          let ii = 0
          const introInterval = setInterval(() => {
            if (cancelled) return
            ii++
            setIntroText(plainIntro.slice(0, ii))
            if (ii >= plainIntro.length) {
              clearInterval(introInterval)
              setIntroDone(true)

              // Phase 4 — reveal player rows one-by-one
              const liveP = playersRef.current ? playersRef.current[tab.dataKey] as ShowcasePlayer[] : []
              let pi = 0
              const revealNext = () => {
                if (cancelled) return
                if (pi < liveP.length) {
                  pi++
                  setRevealedPlayers(pi)
                  timers.push(setTimeout(revealNext, 380))
                } else {
                  // Phase 5 — type outro
                  let oi = 0
                  const outroInterval = setInterval(() => {
                    if (cancelled) return
                    oi++
                    setOutroText(plainOutro.slice(0, oi))
                    if (oi >= plainOutro.length) {
                      clearInterval(outroInterval)
                      setOutroDone(true)
                    }
                  }, 22)
                  intervals.push(outroInterval)
                }
              }
              timers.push(setTimeout(revealNext, 250))
            }
          }, 22)
          intervals.push(introInterval)
        }, 500)
        timers.push(t1)
      }
    }, 22)
    intervals.push(qInterval)

    animCleanup.current = () => {
      cancelled = true
      intervals.forEach(clearInterval)
      timers.forEach(clearTimeout)
    }
    return () => { if (animCleanup.current) animCleanup.current() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Showcase desktop ticker — typewriter through 3 picked facts
  const SC_FACTS_INDICES = [0, 4, 9] // most expensive, most owned, most transferred-out
  useEffect(() => {
    const facts = players?.tickerFacts
    if (!facts?.length) return
    const pool = SC_FACTS_INDICES.map(i => facts[i] ?? facts[i % facts.length]).filter(Boolean)
    const fact = pool[scTickerIdx % pool.length]
    setScTickerPhoto(fact.photoUrl)
    setScTickerDisplay("")
    setScTickerFading(false)
    let charCount = 0
    const typeId = setInterval(() => {
      charCount++
      setScTickerDisplay(fact.text.slice(0, charCount))
      if (charCount >= fact.text.length) clearInterval(typeId)
    }, 30)
    const advanceTimer = setTimeout(() => {
      setScTickerFading(true)
      setTimeout(() => {
        setScTickerFading(false)
        setScTickerDisplay("")
        setScTickerIdx(i => (i + 1) % pool.length)
      }, 500)
    }, fact.text.length * 30 + 4000)
    return () => { clearInterval(typeId); clearTimeout(advanceTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players?.tickerFacts, scTickerIdx])

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
    <section ref={sectionRef} className="relative px-4 py-24 bg-black overflow-hidden">
      {/* Grid + animated green glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatedGlow
          color="rgba(0,255,135,0.13)"
          size="70% 60%"
          duration={16}
          waypoints={[
            { x: "-15%", y: "-20%" },
            { x: "20%",  y: "10%"  },
            { x: "-5%",  y: "25%"  },
            { x: "10%",  y: "-10%" },
          ]}
        />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>
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
            className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl"
            style={fi("0.1s")}
          >
            <span className="text-white">Ask </span>
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #00ff85, #02efff)", WebkitBackgroundClip: "text" }}>ChatFPL AI</span>
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
          {/* 2px animated glow border wrapper */}
          <div
            className="relative rounded-[26px] p-[2px]"
            style={{
              background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.15),#00FFFF,rgba(255,255,255,0.15),#00FF87)",
              backgroundSize: "220% 220%",
              animation: "glow_scroll 6s linear infinite",
            }}
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

              {/* Desktop left: live ticker */}
              <div className="hidden md:flex flex-1 min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0 animate-pulse"
                  style={{ background: "#00FF87", boxShadow: "0 0 8px 2px rgba(0,255,135,0.7)" }}
                />
                {scTickerPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={scTickerPhoto}
                    src={scTickerPhoto}
                    alt=""
                    className="h-8 w-auto rounded shrink-0 object-contain"
                    style={{ transition: "opacity 0.5s ease", opacity: scTickerFading ? 0 : 1 }}
                  />
                )}
                <span
                  className="text-[11px] text-white/75 font-medium truncate"
                  style={{ transition: "opacity 0.5s ease", opacity: scTickerFading ? 0 : 1 }}
                >
                  {scTickerDisplay}
                  {!scTickerFading && scTickerDisplay.length > 0 && (
                    <span className="inline-block w-px h-3 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </span>
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
              {/* User message — types out character by character */}
              <div className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-[20px] rounded-br-sm px-4 py-3 text-sm leading-relaxed font-medium text-black"
                  style={{ background: "linear-gradient(to right,#22d3ee,#34d399)" }}
                >
                  {qText}
                  {qText.length > 0 && qText.length < tabDef.question.length && (
                    <span className="inline-block w-0.5 h-3.5 bg-black/40 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>

              {/* AI message — appears after thinking pause, content streams in */}
              {showAiBubble && (
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
                    {/* Intro — types, then shows formatted */}
                    <p className="whitespace-pre-wrap">
                      {introDone ? renderText(tabDef.intro) : introText}
                      {!introDone && introText.length > 0 && (
                        <span className="inline-block w-0.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </p>

                    {/* Player rows — fade in one-by-one */}
                    {introDone && (
                      <ul className="space-y-2 pl-1">
                        {livePlayers.slice(0, revealedPlayers).map((p, pi) => (
                          <li
                            key={pi}
                            className="flex items-center gap-2.5"
                            style={{ animation: "scFadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
                          >
                            <span className="text-[11px] text-white/30 w-4 shrink-0">{pi + 1}.</span>
                            {p.photoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.photoUrl} alt={p.name} className="inline-block h-10 w-auto rounded shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-white">{p.name} </span>
                              <span className="text-[11px] text-white/45">
                                {p.position} · {p.price} · {p.club} · {p.totalPts} pts · Form {p.form}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Outro — types once players revealed, then shows formatted */}
                    {revealedPlayers >= livePlayers.length && livePlayers.length > 0 && (
                      <p className="whitespace-pre-wrap">
                        {outroDone ? renderText(tabDef.outro) : outroText}
                        {!outroDone && outroText.length > 0 && (
                          <span className="inline-block w-0.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                        )}
                      </p>
                    )}

                    {/* Skeleton while API fetches */}
                    {!players && (
                      <div className="space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-8 rounded-xl bg-white/[0.04] animate-pulse" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/35 mb-2">{players?.nextGwName ?? "Gameweek"} Deadline</div>
              <div className="grid grid-cols-4 gap-1">
                {([[ countdown.d,"DAYS"],[countdown.h,"HRS"],[countdown.m,"MIN"],[countdown.s,"SEC"]] as [string,string][]).map(([n,u]) => (
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
              <div style={{ transition: "opacity 0.4s ease", opacity: newsFading ? 0 : 1 }}>
                {players?.injuryNews?.[newsIndex] ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fplBadge(players.injuryNews[newsIndex].teamCode)} alt={players.injuryNews[newsIndex].team} className="h-5 w-5 object-contain" />
                      <span className="text-xs font-semibold text-white">{players.injuryNews[newsIndex].name}</span>
                      {players.injuryNews[newsIndex].isNew && <span className="ml-auto text-[9px] text-white/35">NEW</span>}
                    </div>
                    <p className="text-[11px] text-white/60 leading-4">{players.injuryNews[newsIndex].news}</p>
                  </>
                ) : (
                  <p className="text-[11px] text-white/40 leading-4">No injury news available.</p>
                )}
              </div>
            </div>

            {/* Most Selected */}
            <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-400/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-emerald-300/80 mb-2">Most Selected</div>
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
                    <span className="text-[11px] font-bold text-emerald-300 shrink-0">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Bonus Points */}
            <div className="rounded-[16px] border border-cyan-400/20 bg-cyan-400/[0.04] p-3 shrink-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-300/80 mb-2">Most Bonus Points</div>
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
                    <span className="text-[11px] font-bold text-cyan-300 shrink-0">{p.value}</span>
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
              boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {TAB_DEFS.map((t, i) => {
              const active = i === activeTab
              return active ? (
                <div
                  key={t.id}
                  style={{
                    padding: "1.5px",
                    borderRadius: "9999px",
                    background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
                    backgroundSize: "200% 200%",
                    animation: `glow_scroll ${3.5 + i * 0.4}s linear infinite`,
                  }}
                >
                  <button
                    onClick={() => goToTab(i)}
                    className="rounded-full px-3 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-sm font-medium focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.9)", display: "block" }}
                  >
                    <span className="font-semibold" style={{ background:"linear-gradient(to right,#00FFFF,#00FF87)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                      {t.label}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  key={t.id}
                  onClick={() => goToTab(i)}
                  className="relative rounded-full px-3 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-sm font-medium transition-all duration-300 focus:outline-none"
                  style={{ border: "1.5px solid transparent" }}
                >
                  <span className="text-white hover:text-white transition-colors">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <p
          className="text-center text-sm text-white"
          style={{ ...fi("0.6s"), opacity: inView ? (visible ? undefined : 0) : 0 }}
        >
          {tabDef.description}
        </p>

        {/* CTA */}
        <div className="mt-10 text-center" style={fi("0.7s")}>
          <div
            className="inline-block rounded-full p-[4px] transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 0 32px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <Link
              href={ctaHref}
              className="relative block overflow-hidden px-8 py-4 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-black font-bold text-base"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 2.4s linear infinite" }} />
              Start Chatting for Free →
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/60">Free trial · No credit card required</p>
        </div>
      </div>
    </section>
  )
}


