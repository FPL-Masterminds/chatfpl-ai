"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  id: number; code: number; name: string; full_name: string; team: string
  pos: string; price: string; ownership: string; form: string; ep_next: string
  goals: number; assists: number; total_points: number
  photo_url: string; photo_fallback: string; news: string
}

// ─── Query templates ─────────────────────────────────────────────────────────

const TEMPLATES = [
  (p: Player) =>
    `How many points is ${p.name} predicted to score for ${p.team} this gameweek - and why?`,
  (p: Player) =>
    `${p.name} is ${p.ownership}% owned. Is he still worth it or has the price peaked?`,
  (p: Player) =>
    `My captain is ${p.name} - xP ${p.ep_next} for ${p.team}. Am I making the right call?`,
  (p: Player) =>
    `${p.name}: ${p.goals} goals, ${p.assists} assists at £${p.price}m. Is that value for money?`,
  (p: Player) =>
    `I want to bring in ${p.name} - form ${p.form}. Walk me through his next three fixtures.`,
  (p: Player) =>
    `Compare ${p.name}'s stats with the top alternatives at £${p.price}m. Worth the switch?`,
]

const STAT_LABELS = [
  (p: Player) => [
    { label: "xP Next GW", value: p.ep_next },
    { label: "Form", value: p.form },
    { label: "Owned by", value: `${p.ownership}%` },
    { label: "Price", value: `£${p.price}m` },
  ],
  (p: Player) => [
    { label: "Ownership", value: `${p.ownership}%` },
    { label: "Price", value: `£${p.price}m` },
    { label: "Total pts", value: String(p.total_points) },
    { label: "Form", value: p.form },
  ],
  (p: Player) => [
    { label: "xP Next GW", value: p.ep_next },
    { label: "Form", value: p.form },
    { label: "Club", value: p.team },
    { label: "Position", value: p.pos },
  ],
  (p: Player) => [
    { label: "Goals", value: String(p.goals) },
    { label: "Assists", value: String(p.assists) },
    { label: "Price", value: `£${p.price}m` },
    { label: "Total pts", value: String(p.total_points) },
  ],
  (p: Player) => [
    { label: "Form", value: p.form },
    { label: "xP Next GW", value: p.ep_next },
    { label: "Ownership", value: `${p.ownership}%` },
    { label: "Club", value: p.team },
  ],
  (p: Player) => [
    { label: "Price", value: `£${p.price}m` },
    { label: "Goals", value: String(p.goals) },
    { label: "Assists", value: String(p.assists) },
    { label: "Form", value: p.form },
  ],
]

// ─── Shared animation config ──────────────────────────────────────────────────

const SPRING = { type: "spring" as const, stiffness: 100, damping: 22, mass: 0.8 }
const AUTO_MS = 7000
const REVEAL = { duration: 0.75, ease: [0.16, 1, 0.3, 1] as number[] }

// ─── Fallback players ─────────────────────────────────────────────────────────

const FALLBACK: Player[] = [
  { id: 1, code: 223094, name: "Haaland", full_name: "Erling Haaland", team: "Man City", pos: "FWD", price: "14.0", ownership: "47.2", form: "8.8", ep_next: "8.5", goals: 18, assists: 3, total_points: 162, photo_url: "https://resources.premierleague.com/premierleague25/photos/players/250x250/223094.png", photo_fallback: "https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png", news: "" },
  { id: 2, code: 118748, name: "Salah", full_name: "Mohamed Salah", team: "Liverpool", pos: "MID", price: "13.5", ownership: "62.1", form: "12.0", ep_next: "11.5", goals: 20, assists: 14, total_points: 210, photo_url: "https://resources.premierleague.com/premierleague25/photos/players/250x250/118748.png", photo_fallback: "https://resources.premierleague.com/premierleague25/photos/players/110x140/118748.png", news: "" },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function QueryCarousel() {
  const [players, setPlayers] = useState<Player[]>(FALLBACK)
  const [idx, setIdx]     = useState(0)
  const [photoOk, setPhotoOk] = useState(true)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    fetch("/api/query-players")
      .then((r) => r.json())
      .then((d) => { if (d.players?.length) setPlayers(d.players) })
      .catch(() => {})
  }, [])

  // Batches direction + photoOk + idx in one React render — no extra effects
  const go = useCallback((dir: 1 | -1) => {
    setPhotoOk(true)
    setIdx((i) => (i + dir + players.length) % players.length)
  }, [players.length])

  // Auto-rotate
  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current) go(1)
      timerRef.current = setTimeout(tick, AUTO_MS)
    }
    timerRef.current = setTimeout(tick, AUTO_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [go])

  const p = players[idx]
  const question = TEMPLATES[idx % TEMPLATES.length]?.(p) ?? TEMPLATES[0](p)
  const stats    = STAT_LABELS[idx % STAT_LABELS.length]?.(p) ?? STAT_LABELS[0](p)

  const highlightedQuestion = question.replace(
    p.name,
    `<mark>${p.name}</mark>`
  )

  return (
    <section
      className="relative overflow-hidden bg-black px-4 py-20"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(0,255,135,0.06),transparent),radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(0,210,255,0.06),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto max-w-6xl">

        {/* Heading — whileInView fires once, immune to parent state updates */}
        <div className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={REVEAL}
          >
            <h2
              className="font-bold leading-[1.1] tracking-tighter"
              style={{ fontSize: "clamp(28px,4.5vw,52px)" }}
            >
              <span className="text-white">Ask ChatFPL About </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                Any Player
              </span>
            </h2>
          </motion.div>
          <motion.p
            className="mt-4 text-base text-gray-400 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...REVEAL, delay: 0.1 }}
          >
            Live data. Real answers. Here are some of the questions you could be asking right now.
          </motion.p>
        </div>

        {/* Split pane */}
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 items-stretch max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...REVEAL, delay: 0.15 }}
        >
          {/* ── Left — Player portrait ── */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg,rgba(0,255,135,0.06) 0%,rgba(255,255,255,0.03) 50%,rgba(0,210,255,0.04) 100%)",
              boxShadow: "0 0 60px rgba(0,255,135,0.06), inset 0 1px 0 rgba(255,255,255,0.07)",
              height: "480px",
              willChange: "transform",
            }}
          >
            {/* Rotating glow border */}
            <div
              className="glow-border-mask pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                padding: "1px",
                background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
                backgroundSize: "220% 220%",
                animation: "glow_scroll 5.5s linear infinite",
              }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={`photo-${idx}`}
                className="absolute inset-0 flex flex-col items-center justify-end pb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{ willChange: "opacity" }}
              >
                {/* Player photo */}
                <div className="absolute inset-x-0 top-4 bottom-20 flex items-center justify-center overflow-hidden">
                  {photoOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      className="h-full w-auto object-contain object-bottom drop-shadow-2xl"
                      style={{ filter: "brightness(0.96) saturate(1.05) contrast(1.02)" }}
                      onError={() => setPhotoOk(false)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_fallback}
                      alt={p.name}
                      className="h-full w-auto object-contain object-bottom drop-shadow-2xl"
                      style={{ filter: "brightness(0.96) saturate(1.05)" }}
                    />
                  )}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px pointer-events-none"
                    style={{ width: "70%", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 70%)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.3)" }}
                  />
                </div>

                {/* Player name chip */}
                <div
                  className="relative z-10 rounded-2xl px-5 py-2.5 text-center"
                  style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.2)", backdropFilter: "blur(12px)" }}
                >
                  <p
                    className="font-bold text-transparent bg-clip-text text-lg leading-tight"
                    style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                  >
                    {p.full_name}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">{p.team} · {p.pos} · £{p.price}m</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Right — Question + stats + nav ── */}
          <div
            className="relative rounded-3xl flex flex-col justify-between p-7 md:p-8 overflow-hidden"
            style={{
              background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              height: "480px",
              willChange: "transform",
            }}
          >
            {/* Rotating glow border */}
            <div
              className="glow-border-mask pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                padding: "1px",
                background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
                backgroundSize: "220% 220%",
                animation: "glow_scroll 5s linear infinite",
              }}
            />

            {/* Label — static, never moves */}
            <div className="flex items-center gap-2 mb-5 shrink-0">
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.25)" }}
              >
                Example question
              </span>
            </div>

            {/* Fixed-height content zone — popLayout keeps exiting element in-place so layout never collapses */}
            <div className="overflow-hidden shrink-0" style={{ height: "280px" }}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={`q-${idx}`}
                  className="h-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  style={{ willChange: "opacity" }}
                >
                  <p
                    className="text-white leading-relaxed mb-6"
                    style={{ fontSize: "clamp(16px,1.6vw,20px)", fontWeight: 500 }}
                    dangerouslySetInnerHTML={{
                      __html: highlightedQuestion.replace(
                        /<mark>(.*?)<\/mark>/g,
                        `<span style="background:linear-gradient(to right,#00ff85,#00ffff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700">$1</span>`
                      ),
                    }}
                  />

                  {/* Stat pills */}
                  <div className="grid grid-cols-2 gap-2">
                    {stats.map((s, i) => (
                      <div key={s.label} className="relative rounded-xl">
                        <div
                          className="glow-border-mask absolute inset-0 rounded-xl"
                          style={{
                            padding: "2px",
                            background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
                            backgroundSize: "220% 220%",
                            animation: `glow_scroll ${3.8 + i * 0.65}s linear infinite`,
                          }}
                        />
                        <div className="relative rounded-xl px-3 py-2" style={{ background: "rgba(10,10,15,0.7)" }}>
                          <p className="text-[9px] uppercase tracking-[0.15em] text-white/35 mb-0.5">{s.label}</p>
                          <p className="text-sm font-bold text-white">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom row — pinned by justify-between on parent, never moves */}
            <div className="flex items-end justify-between pt-5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="font-bold text-white text-base">{p.name}</p>
                <p className="text-white/40 text-sm">{p.team}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Prev */}
                <div className="relative rounded-full inline-flex">
                  <div
                    className="glow-border-mask pointer-events-none absolute inset-0 rounded-full"
                    style={{ padding: "1px", background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)", backgroundSize: "220% 220%", animation: "glow_scroll 4s linear infinite" }}
                  />
                  <button
                    onClick={() => go(-1)}
                    className="relative h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                    aria-label="Previous player"
                  >
                    <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                {/* Next */}
                <div className="relative rounded-full inline-flex">
                  <div
                    className="glow-border-mask pointer-events-none absolute inset-0 rounded-full"
                    style={{ padding: "1px", background: "linear-gradient(90deg,#00FFFF,rgba(255,255,255,0.08),#00FF87,rgba(255,255,255,0.08),#00FFFF)", backgroundSize: "220% 220%", animation: "glow_scroll 4.8s linear infinite" }}
                  />
                  <button
                    onClick={() => go(1)}
                    className="relative h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                    aria-label="Next player"
                  >
                    <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dot indicators */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...REVEAL, delay: 0.2 }}
        >
          {players.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPhotoOk(true); setIdx(i) }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === idx ? "24px" : "6px",
                height: "6px",
                background: i === idx ? "linear-gradient(to right,#00FF87,#00FFFF)" : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to player ${i + 1}`}
            />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...REVEAL, delay: 0.25 }}
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            Ask ChatFPL AI now
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>

      </div>
    </section>
  )
}
