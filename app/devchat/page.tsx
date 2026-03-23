"use client"

import { useState, useEffect, useRef } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Send } from "lucide-react"
import Link from "next/link"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"

const ALL_PROMPTS = [
  "Best captain this gameweek?",
  "Compare Isak vs Watkins",
  "Give me 3 low-owned midfielders",
  "Who has the best fixtures in the next 4?",
  "Who should I sell this gameweek?",
  "Best budget defender under £4.5m?",
  "Which premium forward is worth it right now?",
  "Who are the best differential picks this GW?",
  "Should I use my wildcard now?",
  "Best players to triple-up on this gameweek?",
  "Which midfielder has the most xG this season?",
  "Who has the easiest run of fixtures?",
  "Best bench boost candidates?",
  "Which players have the most clean sheet potential?",
  "Give me a differential captain option under 10% owned",
]

function pickPrompts() {
  return [...ALL_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 4)
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Conversation = {
  id: string
  title: string | null
  archived: boolean
  created_at: string
  updated_at: string
  messages: Message[]
}

type ContextMenu = { visible: true; x: number; y: number; conversationId: string } | { visible: false }

type InsightPlayer = { name: string; team: string; teamCode: number; value: string }
type StatPanel = { id: string; title: string; accent: string; players: InsightPlayer[] }
type InjuryItem = { name: string; news: string; teamCode: number; team: string }
type Insights = { gameweek: string; deadline: string | null; stats: StatPanel[]; injuries: InjuryItem[] }
type Countdown = { days: string; hours: string; minutes: string; seconds: string }

const ACCENT: Record<string, { value: string; border: string; bg: string; dot: string }> = {
  emerald: { value: "text-emerald-300", border: "border-emerald-400/20", bg: "bg-emerald-400/8", dot: "bg-emerald-400" },
  red:     { value: "text-red-400",     border: "border-red-400/20",     bg: "bg-red-400/8",     dot: "bg-red-400"     },
  cyan:    { value: "text-cyan-300",    border: "border-cyan-400/20",    bg: "bg-cyan-400/8",    dot: "bg-cyan-400"    },
  yellow:  { value: "text-yellow-300",  border: "border-yellow-400/20",  bg: "bg-yellow-400/8",  dot: "bg-yellow-400"  },
  purple:  { value: "text-purple-300",  border: "border-purple-400/20",  bg: "bg-purple-400/8",  dot: "bg-purple-400"  },
}

function TeamBadge({ code, name }: { code: number; name: string }) {
  const [ok, setOk] = useState(true)
  if (!code || !ok) return null
  return (
    <img
      src={`https://resources.premierleague.com/premierleague/badges/70/t${code}.png`}
      alt={name}
      className="h-5 w-5 object-contain shrink-0"
      onError={() => setOk(false)}
    />
  )
}

export default function DevChatPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [suggestedPrompts] = useState<string[]>(pickPrompts)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [userFirstName, setUserFirstName] = useState("there")
  const [userInitials, setUserInitials] = useState("JM")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messagesUsed, setMessagesUsed] = useState(0)
  const [messagesLimit, setMessagesLimit] = useState(20)
  const [userPlan, setUserPlan] = useState("Free")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false })
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Insights state
  const [insights, setInsights] = useState<Insights | null>(null)
  const [countdown, setCountdown] = useState<Countdown>({ days: "--", hours: "--", minutes: "--", seconds: "--" })
  const [newsIndex, setNewsIndex] = useState(0)
  const [newsFading, setNewsFading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Email gate — silent redirect for anyone else
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/account")
        if (!res.ok) { router.replace("/login"); return }
        const data = await res.json()
        if ((data.user?.email || "") !== ALLOWED_EMAIL) { router.replace("/login"); return }
        setAuthorized(true)
      } catch {
        router.replace("/login")
      }
    }
    checkAccess()
  }, [router])

  // Load all data once authorised
  useEffect(() => {
    if (!authorized) return
    const load = async () => {
      try {
        let firstName = "there"
        const accountRes = await fetch("/api/account")
        if (accountRes.ok) {
          const d = await accountRes.json()
          const name: string = d.user?.name || ""
          firstName = name.split(" ")[0] || "there"
          const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "JM"
          setUserFirstName(firstName)
          setUserInitials(initials)
          setMessagesUsed(d.usage?.messages_used ?? 0)
          setMessagesLimit(d.usage?.messages_limit ?? 20)
          setUserPlan(d.subscription?.plan || "Free")
        }

        const convsRes = await fetch("/api/chat/conversations")
        if (convsRes.ok) {
          const d = await convsRes.json()
          setConversations(d.conversations || [])
        }

        const historyRes = await fetch("/api/chat/history")
        if (historyRes.ok) {
          const d = await historyRes.json()
          if (d.messages?.length > 0) {
            setMessages(d.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
            setConversationId(d.conversationId)
          } else {
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: `Hi ${firstName}! I'm your ChatFPL AI analyst. Ask me about captains, transfers, differentials, fixtures - anything FPL.`,
              timestamp: new Date(),
            }])
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    load()
  }, [authorized])

  // Fetch FPL insights
  useEffect(() => {
    if (!authorized) return
    fetch("/api/fpl-insights")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setInsights(d) })
      .catch(console.error)
  }, [authorized])

  // Live countdown
  useEffect(() => {
    if (!insights?.deadline) return
    const deadline = new Date(insights.deadline)
    const tick = () => {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) { setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" }); return }
      setCountdown({
        days:    String(Math.floor(diff / 86_400_000)).padStart(2, "0"),
        hours:   String(Math.floor((diff % 86_400_000) / 3_600_000)).padStart(2, "0"),
        minutes: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0"),
        seconds: String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0"),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [insights?.deadline])

  // News ticker — fade out, swap, fade in every 7 s
  useEffect(() => {
    if (!insights?.injuries?.length) return
    const id = setInterval(() => {
      setNewsFading(true)
      setTimeout(() => {
        setNewsIndex((i) => (i + 1) % insights.injuries.length)
        setNewsFading(false)
      }, 400)
    }, 7000)
    return () => clearInterval(id)
  }, [insights?.injuries])

  const startNewChat = async () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Hi ${userFirstName}! What FPL question can I help you with today?`,
      timestamp: new Date(),
    }])
    setConversationId(null)
    setInput("")
    const res = await fetch("/api/chat/conversations")
    if (res.ok) { const d = await res.json(); setConversations(d.conversations || []) }
  }

  const loadConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (conv?.messages) {
      setMessages(conv.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
      setConversationId(convId)
    }
  }

  const renderMessageContent = (content: string) => {
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/)
    const elements: (string | React.ReactElement)[] = []
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0 && parts[i]) elements.push(parts[i])
      else if (i % 3 === 1) {
        const alt = parts[i]; const url = parts[i + 1]
        if (url) elements.push(<img key={`img-${i}`} src={url} alt={alt} className="inline-block h-12 w-auto rounded mx-1" />)
        i++
      }
    }
    return elements
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, conversationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.answer, timestamp: new Date() }])
      setConversationId(data.conversation_id)
      setMessagesUsed(data.messages_used)
      setMessagesLimit(data.messages_limit)
    } catch (e: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: e.message || "Something went wrong.", timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async (convId: string) => {
    setContextMenu({ visible: false })
    await fetch("/api/chat/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, archived: true }),
    })
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (conversationId === convId) {
      setConversationId(null)
      setMessages([{ id: "welcome", role: "assistant", content: `Hi ${userFirstName}! What FPL question can I help you with today?`, timestamp: new Date() }])
    }
  }

  const handleRenameSubmit = async (convId: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    await fetch("/api/chat/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, title: renameValue.trim() }),
    })
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title: renameValue.trim() } : c))
    setRenamingId(null)
  }

  if (!authorized) return null

  if (isLoadingHistory) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="flex gap-1">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400" />
      </div>
    </div>
  )

  const currentInjury = insights?.injuries?.[newsIndex]
  const accentFallback = ACCENT.emerald

  return (
    <div className="bg-black text-white overflow-hidden devchat-root" style={{ height: '100dvh' }}>
      <style>{`
        .devchat-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .devchat-root ::-webkit-scrollbar-track { background: transparent; }
        .devchat-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .devchat-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
        .news-fade { transition: opacity 0.4s ease; }
        .news-fade.fading { opacity: 0; }
        .devchat-messages { -webkit-overflow-scrolling: touch; }
      `}</style>
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,200,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,180,255,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(122,92,255,0.12),transparent_30%)]" />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative flex h-full">

        {/* ─── Left Sidebar ─── */}
        <aside className="w-[280px] shrink-0 border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 hidden lg:flex lg:flex-col">
          {/* Logo */}
          <div className="mb-8">
            <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={140} height={40} className="h-9 w-auto" />
          </div>

          {/* New Chat */}
          <button
            onClick={startNewChat}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold px-4 py-3 mb-6 shadow-[0_0_30px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all text-sm"
          >
            + New Chat
          </button>

          {/* Conversation history */}
          <div className="flex-1 overflow-y-auto min-h-0" onClick={() => setContextMenu({ visible: false })}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-3 px-1">Recent chats</p>
            <div className="space-y-1.5">
              {conversations.length === 0 ? (
                <p className="text-sm text-white/35 px-2 py-2">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => { if (renamingId !== conv.id) loadConversation(conv.id) }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, conversationId: conv.id })
                    }}
                    className={`rounded-xl p-3 border cursor-pointer transition-all select-none ${
                      conv.id === conversationId
                        ? "border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    {renamingId === conv.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(conv.id)
                          if (e.key === "Escape") setRenamingId(null)
                        }}
                        onBlur={() => handleRenameSubmit(conv.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/10 text-white text-sm rounded px-2 py-0.5 outline-none border border-emerald-400/40"
                      />
                    ) : (
                      <div className="text-sm font-medium text-white truncate">
                        {conv.title || conv.messages[0]?.content?.substring(0, 42) || "New Chat"}
                      </div>
                    )}
                    <div className="text-[11px] text-white/40 mt-1">
                      {new Date(conv.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Plan card */}
          <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/8 via-white/[0.02] to-emerald-400/8 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{userPlan}</div>
            <div className="text-base font-semibold text-white">
              {messagesLimit === 999999 ? "Unlimited messages" : `${messagesUsed} / ${messagesLimit} messages`}
            </div>
            <p className="text-xs text-white/55 mt-1.5 leading-5">Live FPL data, smarter recommendations.</p>
            <Link href="/admin">
              <button className="mt-3 w-full rounded-xl bg-white text-black font-semibold py-2 text-sm hover:bg-gray-100 transition-all">
                Manage Plan
              </button>
            </Link>
          </div>
        </aside>

        {/* ─── Main ─── */}
        <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          <section className="flex-1 min-w-0 min-h-0 px-0 md:px-5 py-0 md:py-4 flex flex-col gap-0 md:gap-3 overflow-hidden">

            {/* ── Mobile header (logo + icons) — hidden on desktop ── */}
            <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0 z-10">
              <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={100} height={28} className="h-7 w-auto" />
              <div className="flex items-center gap-2">
                <button
                  onClick={startNewChat}
                  title="New chat"
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  title="Chat history"
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10"/></svg>
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sign out"
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black font-bold flex items-center justify-center text-xs hover:brightness-110 transition-all"
                >
                  {userInitials}
                </button>
              </div>
            </div>

            {/* Top bar — hidden on mobile ── */}
            <div className="hidden md:flex rounded-[26px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl px-5 py-3.5 items-center justify-between shadow-[0_8px_40px_rgba(0,0,0,0.3)] shrink-0">
              <div>
                <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white">Chat with your FPL AI analyst</h1>
                <p className="text-xs text-white/45 mt-0.5">Live data · Real-time reasoning · Smarter decisions</p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3.5 py-1.5 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  API live
                </div>
                <span className="rounded-full border border-yellow-500/40 bg-yellow-500/8 px-2.5 py-1 text-[10px] font-bold text-yellow-400 tracking-wide">DEV</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sign out"
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black font-bold flex items-center justify-center text-xs hover:brightness-110 transition-all"
                >
                  {userInitials}
                </button>
              </div>
            </div>

            {/* Chat window */}
            <div className="flex-1 min-h-0 rounded-none md:rounded-[28px] border-0 md:border md:border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-2xl md:shadow-[0_20px_80px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">

              {/* Messages */}
              <div className="devchat-messages flex-1 overflow-y-auto p-4 pb-24 md:pb-6 md:p-6 space-y-5">
                {messages.map((message) => (
                  message.role === "user" ? (
                    <div key={message.id} className="w-full rounded-[24px] border border-cyan-400/15 bg-cyan-400/[0.07] p-4 md:p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/70 mb-2">You</div>
                      <p className="text-sm md:text-base leading-7 text-white/90">{message.content}</p>
                    </div>
                  ) : (
                    <div key={message.id} className="w-full rounded-[28px] border border-white/8 bg-black/30 p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0">AI</div>
                        <div>
                          <div className="text-sm font-semibold text-white">ChatFPL</div>
                          <div className="text-[11px] text-white/40">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                      <div className="text-sm leading-7 text-white/85 space-y-2">
                        {message.content.split("\n\n").map((para, i) => (
                          <p key={i} className="whitespace-pre-wrap">
                            {para.split("\n").map((line, j) => (
                              <span key={j}>
                                {renderMessageContent(line)}
                                {j < para.split("\n").length - 1 && <br />}
                              </span>
                            ))}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {isLoading && (
                  <div className="w-full rounded-[28px] border border-white/8 bg-black/30 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0">AI</div>
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts + input */}
              <div className="shrink-0 md:relative fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.07] bg-black/90 md:bg-black/20 backdrop-blur-xl md:backdrop-blur-none p-4">
                <div className="hidden md:flex flex-wrap gap-2 mb-3">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] hover:border-white/20 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3 flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Ask your FPL question..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/35 resize-none outline-none text-sm leading-6 max-h-[140px] min-h-[36px] pt-1"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold text-sm shadow-[0_0_24px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
                <p className="text-center text-[10px] text-white/60 mt-2">ChatFPL can make mistakes. Verify important information.</p>
              </div>
            </div>
          </section>

          {/* ─── Right Sidebar — Gameweek Edge ─── */}
          <aside className="w-[320px] xl:w-[340px] shrink-0 p-4 hidden xl:flex xl:flex-col gap-3 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-1 shrink-0">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Live FPL</div>
                <h2 className="text-lg font-semibold mt-0.5 text-white">Gameweek Edge</h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300">Live</span>
              </div>
            </div>

            {/* ── 1. Countdown — always visible ── */}
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shrink-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40 mb-3">
                {insights?.gameweek || "Next Gameweek"} deadline
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="flex flex-col items-center rounded-2xl border border-white/8 bg-black/30 py-2.5 px-1">
                    <span className="text-xl font-bold text-white tabular-nums leading-none">{countdown[unit]}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/35 mt-1">{unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. Injury / Availability ticker ── */}
            {insights?.injuries && insights.injuries.length > 0 && (
              <div className="rounded-[22px] border border-red-400/20 bg-red-400/[0.05] p-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-red-400/80">
                    Injury &amp; Availability
                  </span>
                </div>
                <div className={`news-fade${newsFading ? " fading" : ""}`}>
                  {currentInjury && (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <TeamBadge code={currentInjury.teamCode} name={currentInjury.team} />
                        <span className="text-sm font-semibold text-white">{currentInjury.name}</span>
                        <span className="ml-auto text-[10px] text-white/35 shrink-0">{currentInjury.team}</span>
                      </div>
                      <p className="text-xs text-white/65 leading-5">{currentInjury.news}</p>
                    </>
                  )}
                </div>
                <div className="mt-3 flex gap-1">
                  {insights.injuries.slice(0, Math.min(8, insights.injuries.length)).map((_, i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i === newsIndex ? "bg-red-400" : "bg-white/15"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 3. Three random stat panels ── */}
            {insights?.stats ? (
              insights.stats.map((panel) => {
                const ac = ACCENT[panel.accent] ?? accentFallback
                return (
                  <div
                    key={panel.id}
                    className={`rounded-[22px] border ${ac.border} ${ac.bg} p-4 shrink-0`}
                  >
                    <div className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${ac.value}`}>
                      {panel.title}
                    </div>
                    <div className="space-y-2">
                      {panel.players.map((p, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-black/20 px-3 py-2.5">
                          <span className="text-[10px] text-white/30 w-3 shrink-0">{i + 1}</span>
                          <TeamBadge code={p.teamCode} name={p.team} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-white/40">{p.team}</div>
                          </div>
                          <div className={`text-sm font-bold shrink-0 ${ac.value}`}>{p.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              // Loading skeleton
              [0, 1].map((i) => (
                <div key={i} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 shrink-0 animate-pulse">
                  <div className="h-2 w-24 rounded-full bg-white/10 mb-4" />
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-10 rounded-xl bg-white/5 mb-2" />
                  ))}
                </div>
              ))
            )}


          </aside>
        </main>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#080808] border-r border-white/10 flex flex-col p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={110} height={30} className="h-7 w-auto" />
              <button onClick={() => setMobileDrawerOpen(false)} className="h-8 w-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.07] transition-all">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <button
              onClick={() => { startNewChat(); setMobileDrawerOpen(false) }}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold px-4 py-3 mb-5 shadow-[0_0_24px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all text-sm shrink-0"
            >
              + New Chat
            </button>

            <div className="flex-1 overflow-y-auto min-h-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-3 px-1">Recent chats</p>
              <div className="space-y-1.5">
                {conversations.length === 0 ? (
                  <p className="text-sm text-white/35 px-2 py-2">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => { loadConversation(conv.id); setMobileDrawerOpen(false) }}
                      className={`rounded-xl p-3 border cursor-pointer transition-all ${
                        conv.id === conversationId
                          ? "border-emerald-400/30 bg-emerald-400/10"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="text-sm font-medium text-white truncate">
                        {conv.title || conv.messages[0]?.content?.substring(0, 40) || "New Chat"}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        {new Date(conv.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/8 to-emerald-400/8 p-4 shrink-0">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{userPlan}</div>
              <div className="text-sm font-semibold text-white">
                {messagesLimit === 999999 ? "Unlimited" : `${messagesUsed} / ${messagesLimit} messages`}
              </div>
              <Link href="/admin" onClick={() => setMobileDrawerOpen(false)}>
                <button className="mt-2.5 w-full rounded-xl bg-white text-black font-semibold py-2 text-xs hover:bg-gray-100 transition-all">
                  Manage Plan
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu.visible && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu({ visible: false })} />
          <div
            className="fixed z-50 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-1.5 overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                const conv = conversations.find(c => c.id === contextMenu.conversationId)
                setRenameValue(conv?.title || conv?.messages[0]?.content?.substring(0, 50) || "")
                setRenamingId(contextMenu.conversationId)
                setContextMenu({ visible: false })
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/[0.07] hover:text-white transition-all"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Rename
            </button>
            <button
              onClick={() => handleArchive(contextMenu.conversationId)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-amber-300/80 hover:bg-amber-400/[0.08] hover:text-amber-300 transition-all"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
              Archive
            </button>
          </div>
        </>
      )}
    </div>
  )
}
