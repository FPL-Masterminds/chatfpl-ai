"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const ABOUT_DATA = [
  {
    id: "what",
    question: "What is ChatFPL AI?",
    answer: "ChatFPL AI is your personal Fantasy Premier League analyst. Ask it anything - captain picks, transfer targets, fixture analysis, chip timing, differentials - and it gives you an instant, data-driven answer. No spreadsheets, no trawling through Reddit. Just ask, and it answers.",
  },
  {
    id: "myteam",
    question: "Can it actually look at my team?",
    answer: "Yes - and this is one of the best things it does. Drop your FPL Manager ID into the chat and ChatFPL AI pulls in your squad, your budget, your chip status, and your captain history. Every answer from that point is built around your team specifically. Ask 'Who should I transfer out?' and it knows exactly who you have, what you can afford, and where your weak spots are.",
  },
  {
    id: "data",
    question: "Where does the data come from?",
    answer: "It connects directly to the live FPL API - player prices, form, expected stats, fixture difficulty, injury news, ownership trends. Player prices update daily at 1:30 AM UK time, match stats refresh within hours of the final whistle. You're always working with the most current picture available.",
  },
  {
    id: "who",
    question: "Who's it built for?",
    answer: "Anyone who plays FPL - from someone who sets their team once a week to obsessives who track every press conference. If you've ever sat staring at your transfers page not knowing what to do, ChatFPL AI is the thing you were missing. It was built by FPL managers, tested by FPL managers, and shaped by the same community that plays the game every week.",
  },
  {
    id: "how",
    question: "How do I get the best out of it?",
    answer: "One question at a time, and be specific. 'Who are three differential forwards under £8m with good fixtures in the next four gameweeks?' will get you a much sharper answer than 'Who should I buy?' The more context you give it - position, price range, gameweek number - the better the intel. Think of it like briefing a scout.",
  },
  {
    id: "free",
    question: "Can I try it for free?",
    answer: "Yes. The Free plan gives you 20 messages - no credit card required. Enough to put it through its paces properly. Premium is £7.99/month for 100 messages and Elite is £14.99/month for 500. You can also earn extra free messages by sharing ChatFPL AI on social media.",
  },
]

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

const SPRING = { type: "spring" as const, stiffness: 120, damping: 20 }

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

export function ConversationalAbout() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey - want to know more about ChatFPL AI? Click any question below and I'll answer it right here.",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function ask(item: (typeof ABOUT_DATA)[0]) {
    if (asked.has(item.id) || typing) return
    setAsked((prev) => new Set([...prev, item.id]))
    setShowAll(false)

    setMessages((prev) => [...prev, { id: `u-${item.id}`, role: "user", text: item.question }])

    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: `a-${item.id}`, role: "assistant", text: item.answer }])
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      }, 50)
    }, 1100)

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 50)
  }

  const remaining = ABOUT_DATA.filter((f) => !asked.has(f.id))
  const visiblePills = showAll ? remaining : remaining.slice(0, 1)

  const allAnswered = remaining.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Chat window */}
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
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mb-0.5">
                  CF
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0">
                CF
              </div>
              <div className="rounded-[20px] rounded-bl-sm border border-white/8 bg-black/30 px-4 py-3">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question pills or CTA once all answered */}
      <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
        {!allAnswered ? (
          <>
            <p className="text-white/30 text-xs mb-3 uppercase tracking-widest">Ask a question</p>
            <div className="flex flex-wrap gap-2 items-center">
              <AnimatePresence mode="popLayout">
                {visiblePills.map((item) => (
                  <motion.button
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => ask(item)}
                    disabled={typing}
                    className="text-sm px-4 py-2 rounded-full border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,200,0.2)]"
                    style={{
                      borderColor: "rgba(0,255,200,0.25)",
                      background: "rgba(0,255,200,0.05)",
                      color: "rgba(0,255,200,0.85)",
                    }}
                  >
                    {item.question}
                  </motion.button>
                ))}
              </AnimatePresence>

              {remaining.length > 1 && (
                <motion.button
                  layout
                  onClick={() => setShowAll((v) => !v)}
                  disabled={typing}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {showAll ? "Show less" : `Load all ${remaining.length} questions`}
                </motion.button>
              )}
            </div>
          </>
        ) : (
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
                href="/signup"
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
                Start free - 20 messages, no card needed
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
