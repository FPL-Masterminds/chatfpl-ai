"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const PRIVACY_DATA = [
  {
    id: "collect",
    question: "What data do you collect about me?",
    answer: "When you sign up, we collect your name, email, and payment info - processed securely through Stripe. We also store your chat conversations. That's what allows ChatFPL to remember context across messages and track your usage against your plan limit. Same as any AI platform - without it, the whole thing stops working.",
  },
  {
    id: "sell",
    question: "Do you sell my data to anyone?",
    answer: "No. Full stop. We never sell, rent, or share your personal data with third parties for marketing. The only time your data goes anywhere is when it's needed to operate the service - like Stripe handling your payment, or analytics tools that only ever see anonymised, aggregated patterns.",
  },
  {
    id: "conversations",
    question: "Why do you store my conversations?",
    answer: "Two reasons. First, it lets ChatFPL maintain context - so you can ask a follow-up and it knows what you're referring to. Second, we track message counts against your plan limit. We may also look at conversations if you report a technical issue, purely to diagnose the problem. Your messages are never used for anything else.",
  },
  {
    id: "security",
    question: "How is my data kept secure?",
    answer: "We take reasonable technical measures to protect against unauthorised access. That said, no internet service is 100% watertight and we won't pretend otherwise. What we can tell you is that your data is never shared, never sold, and access to it is strictly limited.",
  },
  {
    id: "retention",
    question: "How long do you keep my data?",
    answer: "For as long as your account is active, or as long as we're legally required to. If you delete your account, we'll remove your data unless we need to hold onto any of it for legal or compliance reasons.",
  },
  {
    id: "rights",
    question: "What are my rights over my data?",
    answer: "You can access, update, or delete your personal data any time from your account settings. You can also request an export of your data or ask us to remove your account entirely. If you have a GDPR question or want to exercise any of your rights, reach out through the contact page.",
  },
  {
    id: "cookies",
    question: "Do you use cookies?",
    answer: "Yes - standard stuff. Cookies keep you logged in and help us understand how the site is being used. You can block them through your browser settings, though some parts of the service may not work properly if you do.",
  },
  {
    id: "changes",
    question: "What if the policy changes?",
    answer: "We'll update this page and change the 'last updated' date. If it's a significant change, we'll let you know by email too. Last updated: January 2025.",
  },
  {
    id: "questions",
    question: "I have a question about the policy.",
    answer: "Drop us a message on the contact page and we'll answer anything you're unsure about.",
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

export function ConversationalPrivacy() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey - got a question about how we handle your data? Ask below and I'll give you a straight answer.",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function ask(item: (typeof PRIVACY_DATA)[0]) {
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

  const remaining = PRIVACY_DATA.filter((f) => !asked.has(f.id))
  const visiblePills = showAll ? remaining : remaining.slice(0, 1)

  return (
    <div className="flex flex-col h-full">
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

      {remaining.length > 0 && (
        <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
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
        </div>
      )}
    </div>
  )
}
