"use client"

import { useState, useEffect, useRef } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Send } from "lucide-react"
import Link from "next/link"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"

const SUGGESTED_PROMPTS = [
  "Best captain this gameweek?",
  "Compare Isak vs Watkins",
  "Give me 3 low-owned midfielders",
  "Who has the best fixtures in the next 4?",
]

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Conversation = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  messages: Message[]
}

export default function DevChatPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
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
        const accountRes = await fetch("/api/account")
        if (accountRes.ok) {
          const d = await accountRes.json()
          const name: string = d.user?.name || ""
          const firstName = name.split(" ")[0] || "there"
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
              content: `Hi ${userFirstName}! I'm your ChatFPL AI analyst. Ask me about captains, transfers, differentials, fixtures - anything FPL.`,
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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden devchat-root">
      <style>{`
        .devchat-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .devchat-root ::-webkit-scrollbar-track { background: transparent; }
        .devchat-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .devchat-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,200,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,180,255,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(122,92,255,0.12),transparent_30%)]" />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative flex h-screen">

        {/* ─── Left Sidebar ─── */}
        <aside className="w-[280px] shrink-0 border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 hidden lg:flex lg:flex-col">
          {/* Logo */}
          <div className="mb-8">
            <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL AI" width={140} height={40} className="h-9 w-auto" />
            <p className="text-[11px] text-white/40 mt-2">Fantasy Premier League copilot</p>
          </div>

          {/* New Chat */}
          <button
            onClick={startNewChat}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold px-4 py-3 mb-6 shadow-[0_0_30px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all text-sm"
          >
            + New Chat
          </button>

          {/* Conversation history */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-3 px-1">Recent chats</p>
            <div className="space-y-1.5">
              {conversations.length === 0 ? (
                <p className="text-sm text-white/35 px-2 py-2">No conversations yet</p>
              ) : (
                conversations.slice(0, 10).map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`rounded-xl p-3 border cursor-pointer transition-all ${
                      conv.id === conversationId
                        ? "border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="text-sm font-medium text-white truncate">
                      {conv.title || conv.messages[0]?.content?.substring(0, 42) || "New Chat"}
                    </div>
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
        <main className="flex-1 flex min-w-0 min-h-0">
          <section className="flex-1 min-w-0 px-4 md:px-5 py-4 flex flex-col gap-3">

            {/* Top bar */}
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl px-5 py-3.5 flex items-center justify-between shadow-[0_8px_40px_rgba(0,0,0,0.3)] shrink-0">
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
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-black font-bold flex items-center justify-center text-xs hover:brightness-110 transition-all"
                >
                  {userInitials}
                </button>
              </div>
            </div>

            {/* Chat window */}
            <div className="flex-1 min-h-0 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                {messages.map((message) => (
                  message.role === "user" ? (
                    <div key={message.id} className="max-w-[760px] rounded-[24px] border border-cyan-400/15 bg-cyan-400/[0.07] p-4 md:p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/70 mb-2">You</div>
                      <p className="text-sm md:text-base leading-7 text-white/90">{message.content}</p>
                    </div>
                  ) : (
                    <div key={message.id} className="max-w-[880px] rounded-[28px] border border-white/8 bg-black/30 p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-blue-500 flex items-center justify-center text-black font-black text-[10px] shrink-0">AI</div>
                        <div>
                          <div className="text-sm font-semibold text-white">ChatFPL Analyst</div>
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
                  <div className="max-w-[880px] rounded-[28px] border border-white/8 bg-black/30 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-blue-500 flex items-center justify-center text-black font-black text-[10px] shrink-0">AI</div>
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
              <div className="shrink-0 border-t border-white/[0.07] bg-black/20 p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTED_PROMPTS.map((prompt) => (
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
                    placeholder="Ask about captaincy, transfers, wildcards, fixtures..."
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
              </div>
            </div>
          </section>

          {/* ─── Right Sidebar ─── */}
          <aside className="w-[320px] xl:w-[340px] shrink-0 p-4 hidden xl:flex xl:flex-col gap-3">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-emerald-400/8 via-cyan-400/4 to-blue-500/8 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Live</div>
                  <h2 className="text-xl font-semibold mt-1 text-white">Gameweek Edge</h2>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55">Insights</div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Form", value: "+14%", desc: "Expected returns trend is up over the last 3 matches." },
                  { label: "Fixture Run", value: "A+", desc: "Strong next 4 with two high-upside home fixtures." },
                  { label: "Differential", value: "2.7%", desc: "Low ownership option with real upside this week." },
                ].map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-white/8 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50">{item.label}</div>
                      <div className="text-base font-semibold text-emerald-300">{item.value}</div>
                    </div>
                    <p className="text-xs text-white/60 mt-1.5 leading-5">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] border border-white/8 bg-black/25 p-4">
                <div className="text-xs text-white/50 mb-2.5">Trending — click to ask</div>
                <div className="flex flex-wrap gap-2">
                  {["Wildcard", "Salah captain", "Bench boost", "Cheap mids", "Fixture swing"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setInput(tag)}
                      className="rounded-full bg-white/[0.05] border border-white/8 px-3 py-1.5 text-xs text-white/75 hover:bg-white/[0.1] hover:text-white transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                <div className="text-xs text-cyan-300 mb-1.5">Dev build — admin only</div>
                <p className="text-white/75 leading-6 text-xs">Only you can see this page. Build and experiment freely — live users are completely unaffected.</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
