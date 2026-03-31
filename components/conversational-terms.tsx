"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const TERMS_DATA = [
  {
    id: "accept",
    question: "What am I agreeing to by using ChatFPL?",
    answer: "By using ChatFPL, you're agreeing to use the service as it's intended - for FPL advice and analysis - and not to do anything that would damage or abuse it. That's pretty much it. If anything in the full terms is unclear, get in touch and we'll explain.",
  },
  {
    id: "limits",
    question: "How do message limits work?",
    answer: "Free accounts get 20 messages as a trial. Premium is 100 messages a month, Elite is 500. Limits reset on your renewal date, which is shown in your dashboard. Unused messages don't roll over - they expire at the end of each billing period.",
  },
  {
    id: "rewards",
    question: "What's the bonus messages rewards program?",
    answer: "Free users can earn extra messages by sharing ChatFPL on X, Reddit, or Facebook (5 messages each, claimable once per platform), leaving a review (5-10 messages), or referring a friend (5 messages each, up to 3 referrals). There's a lifetime cap of 50 bonus messages across all rewards. We verify claims manually for social and review rewards - referral rewards are granted automatically when the referred user verifies their email.",
  },
  {
    id: "rewards-rules",
    question: "Can rewards be denied or revoked?",
    answer: "Yes. We reserve the right to decline or remove reward messages if we think the program is being gamed - for example, if a review is fake, negative, or defamatory. Rewards are meant to encourage genuine engagement. By submitting a review or social post, you also grant us permission to feature it on the site or in marketing.",
  },
  {
    id: "cancel",
    question: "Can I cancel my subscription?",
    answer: "Any time, from your account dashboard. You keep access until the end of the billing period you've already paid for. Fees aren't refundable after that, unless the law says otherwise.",
  },
  {
    id: "acceptable",
    question: "What's not allowed on the platform?",
    answer: "Using the service for anything unlawful, trying to scrape or attack the platform, sharing your account credentials with others, or abusing the rewards program. Basically - don't be a pain about it. Accounts found breaking these rules may be suspended.",
  },
  {
    id: "guarantee",
    question: "Can ChatFPL guarantee FPL results?",
    answer: "No - and we'd be lying if we claimed otherwise. ChatFPL gives you better information than most - form data, fixture difficulty, ownership trends, expected stats. But football is unpredictable and FPL decisions are ultimately yours. We're not liable if a captain blank wrecks your week.",
  },
  {
    id: "changes",
    question: "What if the terms change?",
    answer: "We can update them any time. If it's a significant change, we'll tell you by email or through the service. Keep using ChatFPL after that and you're accepting the updated terms.",
  },
  {
    id: "contact",
    question: "How do I contact you about the terms?",
    answer: "Through the contact page. We'll come back to you.",
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

export function ConversationalTerms() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey - got a question about the terms? Ask below. I'll give you a straight answer, not a wall of legal text.",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function ask(item: (typeof TERMS_DATA)[0]) {
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

  const remaining = TERMS_DATA.filter((f) => !asked.has(f.id))
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
