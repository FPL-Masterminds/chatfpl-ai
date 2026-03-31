"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

type PlayerNames = { fwd1: string; fwd2: string; mid1: string; mid2: string; mid3: string }

const FALLBACK_NAMES: PlayerNames = {
  fwd1: "Haaland",
  fwd2: "Watkins",
  mid1: "Palmer",
  mid2: "Mbeumo",
  mid3: "Saka",
}

function makeFaqData(p: PlayerNames) {
  return [
  {
    id: "what",
    question: "What is ChatFPL?",
    answer: "ChatFPL is your personal Fantasy Premier League analyst. It's powered by live FPL data and trained to answer anything from captain picks to chip timing to transfer targets - instantly, without you having to trawl through Twitter or Reddit. Just ask, and it answers.",
  },
  {
    id: "fplid",
    question: "Can it actually look at my own team?",
    answer: "Yes - and this is honestly one of the most powerful things it does. Drop your FPL Manager ID into the chat (you'll find it in the URL on your FPL profile page) and ChatFPL will pull in your squad, your budget, your chip status, and your captain history. From that point, every answer is tailored to you. Ask 'Who should I transfer out?' or 'Who's my best captain option this week?' and it responds knowing exactly who you have, what you can afford, and where your weak spots are. It's like having a scout who's already done their homework on your team.",
  },
  {
    id: "questions",
    question: "What kind of FPL questions can I ask?",
    answer: "Pretty much anything - captain picks, transfer suggestions, fixture analysis, differentials, chip strategy, price predictions, ownership trends, double gameweek planning, budget options by position... If it's FPL-related, you can ask it. The more specific you are, the sharper the answer.",
  },
  {
    id: "quality",
    question: "Does how I word my question actually matter?",
    answer: "It does, yeah. ChatFPL pulls from the full FPL dataset but focuses on the top relevant players for your specific question - so a vague question like 'Who's good this week?' gives it a lot of ground to cover and the answer will reflect that. But ask 'Who are three differential forwards under £8m with good fixtures in GW27?' and it can zero straight in. Think of it like briefing a scout - the more context you give, the better the intel you get back.",
  },
  {
    id: "phrasing",
    question: "How should I phrase my questions?",
    answer: "One topic per message - that's the golden rule. Instead of 'Tell me about transfers, captaincy, and my defence all at once,' break it into separate questions. Shorter and focused always beats long and sprawling. Mention a gameweek number, a price range, or a specific player name and you'll get much tighter results.",
  },
  {
    id: "captain",
    question: "How do I ask about captaincy?",
    answer: "Use words like captain, armband, or VC and you're set. Something like 'Who's the safest captain for GW27?' or 'Best differential captain under 20% ownership?' works perfectly. Vague questions like 'Who should I pick?' don't give it enough to work with - it doesn't know if you mean captain, transfer, or bench order.",
  },
  {
    id: "differentials",
    question: "How do I find differentials and hidden gems?",
    answer: "Words like differential, low ownership, or under the radar tell it exactly what you're after. Try something like 'Top 3 midfield differentials under 15% ownership for GW28' or 'Low-owned defenders with green fixtures in the next four.' The more filters you give it, the more targeted the picks.",
  },
  {
    id: "budget",
    question: "How do I ask about players by price?",
    answer: "Just say the number. 'Best defenders under £4.5m for clean sheet potential' or 'Is there a premium midfielder worth £11m+ right now?' will get you instant filtered results. Asking 'Who's cheap?' doesn't really tell it what you need - cheap compared to what, and for which position?",
  },
  {
    id: "transfers",
    question: "How do I ask about transfers?",
    answer: `Use words like transfer, replace, or bring in. 'Who should I replace ${p.fwd2} with if he's injured?' or 'Best transfer targets under £7m for the next three gameweeks' both work really well. ChatFPL needs a bit of context - just saying 'Who should I buy?' leaves it guessing what you already have and what you need.`,
  },
  {
    id: "position",
    question: "How do I filter by position?",
    answer: "Just name the position - goalkeeper, defender, midfielder, or forward. 'Best budget goalkeepers for save points' or 'Which midfielders are in the best form right now?' will get you focused answers. Without a position, it has to consider everyone and the answer gets broader.",
  },
  {
    id: "compare",
    question: "Can I compare players against each other?",
    answer: `Absolutely - comparisons are one of its strongest features. Stick to two to four players though. '${p.fwd1} vs ${p.fwd2} for the next four fixtures' or '${p.mid1}, ${p.mid2}, or ${p.fwd1} for captaincy this week?' will get you a proper breakdown with context. Asking it to compare ten players at once is too wide and the results suffer for it.`,
  },
  {
    id: "combine",
    question: "Can I combine multiple filters in one question?",
    answer: "Yes, and this is where it gets really good. You can stack filters for very precise results - try things like 'Budget defenders with green fixtures under £5m,' 'Premium captain options for the next double gameweek,' or 'Under-the-radar forwards with strong xG over the last three matches.' The more you layer in, the more surgical the answer.",
  },
  {
    id: "avoid",
    question: "Is there anything I should avoid asking?",
    answer: "A few things to steer clear of: asking for 'all players this week,' pasting in long lists of names to analyse at once, or open-ended questions like 'Give me expert insights on everything.' These overload the system and tend to produce slower, less useful responses. One clear, specific question always beats a paragraph of requests.",
  },
  {
    id: "examples",
    question: "Can you give me some example questions that work well?",
    answer: `Here are a few that hit the sweet spot:\n\n• 'Who is the best captain pick this gameweek?'\n• 'Give me three differentials under £7m with good fixtures'\n• 'Who should I replace ${p.mid3} with if he's injured?'\n• 'Compare ${p.fwd1} vs ${p.fwd2} for the next five gameweeks'\n• 'Best cheap defenders with a strong fixture run'\n• 'Should I use my wildcard now or wait?'\n\nShort, specific, and focused. That's the formula.`,
  },
  {
    id: "followup",
    question: "Can I ask follow-up questions in the same chat?",
    answer: `Yes - conversations are contextual, so you can build on previous answers. After asking about ${p.mid1}'s stats, you can immediately follow with 'Should I captain him?' or 'Compare him with ${p.mid2}' and it knows exactly what you mean. Each follow-up uses one message.`,
  },
  {
    id: "data",
    question: "How current is the data?",
    answer: "Very. Player prices update daily at 1:30 AM UK time, match stats update within hours of the final whistle, and injury news refreshes as official team announcements come in. Whatever you're asking about, you're getting the latest available picture.",
  },
  {
    id: "gameweeks",
    question: "Can I use it right before a deadline?",
    answer: "That's exactly when it's most useful. ChatFPL is available 24/7, including during live gameweeks. Last-minute captain call, injury news, fixture swing you hadn't clocked - ask it anything right up to the deadline. It doesn't sleep.",
  },
  {
    id: "free",
    question: "Can I try it for free?",
    answer: "Yes - the Free plan gives you 20 messages to try it out with no credit card required. You can upgrade any time, or earn extra messages by completing quick tasks like sharing on social media. Either way, you can put it through its paces before you commit to anything.",
  },
  {
    id: "earn",
    question: "How do I earn extra free messages?",
    answer: "Share ChatFPL on X, Facebook, or Reddit, or leave a review, and each completed task adds bonus messages to your account - up to a lifetime cap of 50. Your dashboard shows what's available.",
  },
  {
    id: "rollover",
    question: "Do messages roll over if I don't use them?",
    answer: "They don't, no. Premium is 100 messages a month, Elite is 500 - both reset on your renewal date. So make sure you're using them.",
  },
  {
    id: "runout",
    question: "What happens when I run out of messages?",
    answer: "You can upgrade to a higher plan for immediate access to more messages, or sit tight until your next renewal date. Free users can also top up by completing the social sharing tasks on their dashboard.",
  },
  {
    id: "difference",
    question: "What's the difference between Premium and Elite?",
    answer: "Premium is £7.99/month for 100 messages - ideal for regular FPL managers who want reliable weekly support. Elite is £14.99/month for 500 messages - built for serious players, content creators, or anyone managing multiple teams who needs serious research capacity.",
  },
  {
    id: "cancel",
    question: "Can I cancel whenever I want?",
    answer: "Any time, from your account dashboard. Your access continues to the end of the current billing period and that's it - no charges after, no cancellation fees, no awkward calls.",
  },
  {
    id: "guarantee",
    question: "Will it guarantee I climb the rankings?",
    answer: "No tool can guarantee that - FPL has too much unpredictability built in. What ChatFPL does is give you a genuine information edge: form data, fixture difficulty, expected stats, ownership trends. You still make the calls. But you'll be making them with better information than most of your mini-league.",
  },
  {
    id: "length",
    question: "Is there a limit to how long my questions can be?",
    answer: "No hard limit, but shorter and more focused always gets better results. If you have three things to ask, ask them as three separate questions rather than one big block. ChatFPL responds better to clarity than volume.",
  },
]}


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
      text: "Hey - got questions about ChatFPL? Click any of the questions below and I'll answer them right here.",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [playerNames, setPlayerNames] = useState<PlayerNames>(FALLBACK_NAMES)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/top-players")
      .then((r) => r.json())
      .then((data) => setPlayerNames({ ...FALLBACK_NAMES, ...data }))
      .catch(() => {})
  }, [])

  const FAQ_DATA = useMemo(() => makeFaqData(playerNames), [playerNames])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  function ask(item: ReturnType<typeof makeFaqData>[0]) {
    if (asked.has(item.id) || typing) return
    setAsked((prev) => new Set([...prev, item.id]))
    setShowAll(false) // collapse back to one-at-a-time after answering

    setMessages((prev) => [...prev, { id: `u-${item.id}`, role: "user", text: item.question }])

    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: `a-${item.id}`, role: "assistant", text: item.answer }])
    }, 1100)
  }

  const remaining = FAQ_DATA.filter((f) => !asked.has(f.id))
  // In default mode show only the next question; "Load All" reveals everything
  const visiblePills = showAll ? remaining : remaining.slice(0, 1)

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

      {/* Question pills */}
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

            {/* Load All toggle — only shown when more than 1 question remains */}
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
