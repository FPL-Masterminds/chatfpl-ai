"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface PlayerQA {
  id: string
  question: string
  answer: string
}

interface ConversationalPlayerProps {
  welcome: string
  qaItems: PlayerQA[]
}

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

export function ConversationalPlayer({ welcome, qaItems }: ConversationalPlayerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: welcome },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  function ask(item: PlayerQA) {
    if (asked.has(item.id) || typing) return
    setAsked((prev) => new Set([...prev, item.id]))
    setShowAll(false)
    setMessages((prev) => [...prev, { id: `u-${item.id}`, role: "user", text: item.question }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: `a-${item.id}`, role: "assistant", text: item.answer }])
    }, 1100)
  }

  const remaining = qaItems.filter((q) => !asked.has(q.id))
  const visiblePills = showAll ? remaining : remaining.slice(0, 1)

  return (
    <div
      className="flex flex-col h-full rounded-2xl"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
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
                className={`max-w-[80%] rounded-[20px] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
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

      {/* Question pills */}
      {remaining.length > 0 && (
        <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
          <p className="text-white/70 text-xs mb-3 uppercase tracking-widest">Ask a question</p>
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
        </div>
      )}
    </div>
  )
}
