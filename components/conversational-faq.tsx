"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const FAQ_DATA = [
  {
    id: "what",
    question: "What is ChatFPL?",
    answer: "ChatFPL is your private FPL strategist. It uses advanced performance models and real-time data to give you a bulletproof edge in your mini-league — from captain picks to transfer chains and chip strategy.",
  },
  {
    id: "free",
    question: "Can I try it for free?",
    answer: "Absolutely. The Free Trial gives you 20 messages per month to test the engine before unlocking full access. No credit card required.",
  },
  {
    id: "questions",
    question: "What type of FPL questions can I ask?",
    answer: "Anything. 'Who is the best Salah replacement for the next 3 gameweeks?' — 'Analyse my team's defensive rotation for a double gameweek.' — 'Give me three differentials under 5% owned with good fixtures.' The engine handles it all.",
  },
  {
    id: "data",
    question: "How often is data updated?",
    answer: "Continuously. The engine processes live FPL data, injury leaks, and press conference news in real-time, 24/7. You're always working with the latest information before the deadline.",
  },
  {
    id: "rollover",
    question: "Do unused messages roll over?",
    answer: "No. Your message allowance resets on your renewal date each month. Premium gets 100, Elite gets 500. Use them — that's what they're there for.",
  },
  {
    id: "team",
    question: "Can ChatFPL see my actual FPL team?",
    answer: "Yes. Link your public FPL Team ID in your account settings and ChatFPL will use your squad, chip status, and transfer history as context when answering questions.",
  },
  {
    id: "dashboard",
    question: "What is the FPL Dashboard?",
    answer: "A real-time animated dashboard showing your rank graph, season heatmap, squad analysis, mini-league standings, transfer history, and captaincy performance — all in one place. Included on every plan.",
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel from your account dashboard at any time. You keep access until the end of your billing period. No fees, no penalties.",
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

export function ConversationalFAQ() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey — got questions about ChatFPL? Click any of the questions below and I'll answer them right here.",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  function ask(item: typeof FAQ_DATA[0]) {
    if (asked.has(item.id) || typing) return
    setAsked((prev) => new Set([...prev, item.id]))

    // User bubble
    setMessages((prev) => [...prev, { id: `u-${item.id}`, role: "user", text: item.question }])

    // Typing delay then answer
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: `a-${item.id}`, role: "assistant", text: item.answer }])
    }, 1100)
  }

  const remaining = FAQ_DATA.filter((f) => !asked.has(f.id))

  return (
    <div className="flex flex-col h-full">
      {/* Chat window */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 min-h-0">
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
        <div ref={bottomRef} />
      </div>

      {/* Question pills */}
      {remaining.length > 0 && (
        <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
          <p className="text-white/30 text-xs mb-3 uppercase tracking-widest">Ask a question</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {remaining.map((item) => (
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
          </div>
          {remaining.length === 0 && (
            <p className="text-white/30 text-sm">All questions answered. Ready to get started?</p>
          )}
        </div>
      )}

      {remaining.length === 0 && (
        <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6 text-center">
          <p className="text-white/40 text-sm mb-3">All questions answered.</p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 rounded-full font-bold text-sm text-black transition-all hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            Get Started Free →
          </a>
        </div>
      )}
    </div>
  )
}
