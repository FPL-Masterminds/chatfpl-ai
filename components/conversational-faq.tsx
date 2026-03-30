"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const FAQ_DATA = [
  {
    id: "what",
    question: "What is ChatFPL AI?",
    answer: "ChatFPL AI is your intelligent Fantasy Premier League assistant powered by artificial intelligence and real-time FPL data. Simply ask any question about players, transfers, captains, fixtures, or strategy, and receive instant, data-driven answers to help you make smarter FPL decisions and climb the rankings.",
  },
  {
    id: "free",
    question: "Can I try it for free?",
    answer: "Yes! Our Free plan includes 20 trial messages to experience ChatFPL AI with no credit card required. You can upgrade at any time or complete simple tasks to earn additional messages.",
  },
  {
    id: "earn",
    question: "How do I earn extra messages on the Free plan?",
    answer: "Free users can earn bonus messages by completing simple tasks like sharing ChatFPL AI on social media (X, Facebook, Reddit) or leaving a review. Each task rewards you with additional messages, up to a lifetime cap of 50 bonus messages. Visit your dashboard to see available rewards.",
  },
  {
    id: "questions",
    question: "What type of FPL questions can I ask?",
    answer: "You can ask anything FPL-related: player statistics, captain picks, transfer advice, fixture analysis, differential suggestions, chip strategy, rule clarifications, price predictions, ownership trends, and much more. ChatFPL AI provides instant, data-driven answers backed by real-time Premier League data.",
  },
  {
    id: "data",
    question: "How often is the FPL data updated?",
    answer: "ChatFPL AI uses live Fantasy Premier League data that updates continuously. Player prices update daily at 1:30 AM UK time, match statistics update within hours of the final whistle, and injury news is refreshed as official team announcements are made. You're always getting the most current information available.",
  },
  {
    id: "rollover",
    question: "Do unused messages roll over to the next month?",
    answer: "No, unused messages do not carry over. Premium users receive 100 messages each month, and Elite users receive 500 messages per month. Your message allowance resets on your renewal date, so make sure to use your messages before they expire.",
  },
  {
    id: "runout",
    question: "What happens if I run out of messages?",
    answer: "If you've used all your messages for the current period, you can upgrade to a higher plan for more messages, or wait until your next renewal date when your allowance resets. Free users can also earn bonus messages by completing social sharing tasks.",
  },
  {
    id: "difference",
    question: "What's the difference between Premium and Elite?",
    answer: "Premium gives you 100 messages per month for £7.99, perfect for regular FPL managers who want consistent support throughout the season. Elite offers 500 messages per month for £14.99, ideal for dedicated players, content creators, or those managing multiple teams who need extensive research capabilities.",
  },
  {
    id: "cancel",
    question: "Can I cancel my subscription at any time?",
    answer: "Yes! You can cancel your Premium or Elite subscription at any time from your account dashboard. Your access will continue until the end of your current billing period, and you won't be charged again. No cancellation fees or penalties.",
  },
  {
    id: "gameweeks",
    question: "Can I use ChatFPL AI during gameweeks?",
    answer: "Yes! ChatFPL AI is available 24/7, including during live gameweeks. You can get last-minute captain advice before the deadline, check injury updates, analyse fixture swings, or plan your transfers for the following week. The AI is always ready when you need it.",
  },
  {
    id: "guarantee",
    question: "Does ChatFPL AI guarantee I'll climb the rankings?",
    answer: "While ChatFPL AI provides data-driven insights and analysis to support better decisions, FPL involves unpredictability that no tool can eliminate. We give you the information edge — form trends, expected stats, fixture analysis — but ultimately, player performance and your strategic decisions determine your rank.",
  },
  {
    id: "followup",
    question: "Can I ask follow-up questions?",
    answer: "Yes! Each conversation with ChatFPL AI is contextual, meaning you can ask follow-up questions that build on previous answers. For example, after asking about Mohamed Salah's stats, you can immediately ask \"Should I captain him?\" or \"Compare him with Son Heung-min.\" Each follow-up costs one message.",
  },
  {
    id: "length",
    question: "Is there a limit to how long my questions can be?",
    answer: "While there's no strict character limit, we recommend keeping questions clear and concise for the best results. Instead of asking multiple questions in one message, break them into separate queries. For example, ask \"Who should I captain?\" first, then follow up with \"What about transfers?\" This helps the AI provide more focused, accurate responses.",
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
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
