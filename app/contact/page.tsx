"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DevHeader } from "@/components/dev-header"
import { Send } from "lucide-react"

type Step = "name" | "email" | "message" | "confirm" | "done"

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

const PLACEHOLDERS: Record<Step, string> = {
  name: "Your name...",
  email: "your@email.com",
  message: "Your message...",
  confirm: "",
  done: "",
}

export default function ContactPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "Hey - got a question, a bug to report, or just something to say? We read every message." },
  ])
  const [step, setStep] = useState<Step>("name")
  const [typing, setTyping] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  // Kick off the first bot question after mount
  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages((p) => [...p, { id: "ask-name", role: "assistant", text: "What's your name?" }])
        inputRef.current?.focus()
      }, 900)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  function botSay(text: string, id: string, then?: () => void) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((p) => [...p, { id, role: "assistant", text }])
      then?.()
    }, 1000)
  }

  function handleSend() {
    const val = inputVal.trim()
    if (!val || typing) return
    setInputVal("")

    if (step === "name") {
      setName(val)
      setMessages((p) => [...p, { id: "u-name", role: "user", text: val }])
      setStep("email")
      botSay(`Good to meet you, ${val}. What's your email address?`, "ask-email", () => inputRef.current?.focus())
    } else if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        botSay("That doesn't look like a valid email - try again.", "invalid-email")
        return
      }
      setEmail(val)
      setMessages((p) => [...p, { id: "u-email", role: "user", text: val }])
      setStep("message")
      botSay("Got it. What would you like to say?", "ask-message", () => inputRef.current?.focus())
    } else if (step === "message") {
      setMessage(val)
      setMessages((p) => [...p, { id: "u-message", role: "user", text: val }])
      setStep("confirm")
      botSay("Got it - hit Send and I'll pass that on.", "ask-confirm")
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend()
  }

  async function handleConfirm() {
    setSubmitStatus("submitting")
    const fd = new FormData()
    fd.append("name", name)
    fd.append("email", email)
    fd.append("message", message)
    try {
      const res = await fetch("https://formspree.io/f/mwpwpolb", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      })
      if (res.ok) {
        setStep("done")
        setSubmitStatus("idle")
        botSay(`Done - message sent. We'll come back to you at ${email} shortly.`, "success")
      } else {
        setSubmitStatus("error")
        botSay("Something went wrong on our end. Try again or email us directly at support@chatfpl.ai", "send-error")
        setStep("confirm")
      }
    } catch {
      setSubmitStatus("error")
      botSay("Something went wrong. You can email us directly at support@chatfpl.ai", "send-error")
      setStep("confirm")
    }
  }

  function handleStartOver() {
    setMessages([
      { id: "welcome-2", role: "assistant", text: "No problem - let's start again. What's your name?" },
    ])
    setName("")
    setEmail("")
    setMessage("")
    setInputVal("")
    setStep("name")
    setSubmitStatus("idle")
    inputRef.current?.focus()
  }

  const showInput = step === "name" || step === "email" || step === "message"
  const showConfirm = step === "confirm"
  const showDone = step === "done"

  return (
    <div className="flex min-h-screen flex-col bg-black contact-root">
      <style>{`
        .contact-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .contact-root ::-webkit-scrollbar-track { background: transparent; }
        .contact-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .contact-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      {/* Grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial green glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 pb-12">

        {/* Heading */}
        <div className="text-center mb-10 max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
            <span className="text-white">Get </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              In Touch
            </span>
          </h1>
          <p className="text-lg text-gray-300">We usually respond within a few hours.</p>
        </div>

        {/* Chat window */}
        <div
          className="w-full max-w-6xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <div className="flex flex-col h-full">

            {/* Messages */}
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

            {/* Bottom bar */}
            <div className="px-4 md:px-6 pb-6 pt-3 border-t border-white/6">
              <AnimatePresence mode="wait">

                {showInput && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3"
                  >
                    <input
                      ref={inputRef}
                      type={step === "email" ? "email" : "text"}
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={PLACEHOLDERS[step]}
                      disabled={typing}
                      className="flex-1 bg-transparent text-white placeholder:text-white/35 outline-none text-sm disabled:opacity-40"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputVal.trim() || typing}
                      className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold text-sm shadow-[0_0_24px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </button>
                  </motion.div>
                )}

                {showConfirm && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div
                      className="inline-block rounded-full p-[3px] transition-all duration-300 hover:scale-105"
                      style={{
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 0 30px rgba(0,255,135,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
                      }}
                    >
                      <button
                        onClick={handleConfirm}
                        disabled={submitStatus === "submitting"}
                        className="relative block overflow-hidden rounded-full px-8 py-3 font-bold text-sm text-[#08020E] disabled:opacity-60"
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
                        {submitStatus === "submitting" ? "Sending..." : "Send message"}
                      </button>
                    </div>
                    <button
                      onClick={handleStartOver}
                      className="text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                      Start over
                    </button>
                  </motion.div>
                )}

                {showDone && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
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
                      <a
                        href="/"
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
                        Back to ChatFPL AI
                      </a>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
