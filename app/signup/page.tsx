"use client"

import { useState, useRef, useEffect, KeyboardEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Eye, EyeOff } from "lucide-react"

type SignupStep = "name" | "email" | "password" | "confirm" | "terms" | "submitting" | "done"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  masked?: boolean
}

const SPRING = { type: "spring" as const, stiffness: 120, damping: 20 }

function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0">
        <Image src="/ChatFPL_AI_Logo.png" alt="CF" width={16} height={16} className="w-4 h-4 object-contain" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/[0.08] px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-[#00FF87]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<SignupStep>("name")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Let's get you set up. You'll get 20 free messages - no card needed. What's your name?",
    },
  ])
  const [typing, setTyping] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setReferralCode(ref)
  }, [searchParams])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  useEffect(() => {
    if (
      step !== "terms" &&
      step !== "submitting" &&
      step !== "done"
    ) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [step])

  function botSay(text: string, id: string, then?: () => void) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(p => [...p, { id, role: "assistant", text }])
      then?.()
    }, 800)
  }

  function handleSend() {
    const val = inputVal.trim()
    if (!val || typing || step === "terms" || step === "submitting" || step === "done") return
    setInputVal("")

    if (step === "name") {
      setName(val)
      setMessages(p => [...p, { id: `u-name`, role: "user", text: val }])
      setStep("email")
      botSay(`Good to meet you, ${val.split(" ")[0]}. What email address do you want to use?`, "ask-email")
    } else if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        botSay("That doesn't look like a valid email - give it another go.", `invalid-email-${Date.now()}`)
        return
      }
      setEmail(val)
      setMessages(p => [...p, { id: `u-email`, role: "user", text: val }])
      setStep("password")
      botSay("Got it. Choose a password - at least 8 characters.", "ask-password")
    } else if (step === "password") {
      if (val.length < 8) {
        botSay("That's under 8 characters - try a longer one.", `short-pw-${Date.now()}`)
        return
      }
      setPassword(val)
      setMessages(p => [...p, { id: `u-password`, role: "user", text: val, masked: true }])
      setStep("confirm")
      botSay("Now confirm that password.", "ask-confirm")
    } else if (step === "confirm") {
      if (val !== password) {
        botSay("Those passwords don't match - try again.", `mismatch-${Date.now()}`)
        return
      }
      setMessages(p => [...p, { id: `u-confirm`, role: "user", text: val, masked: true }])
      setStep("terms")
      botSay(
        "Last step. To create your account you'll need to agree to our Terms of Service and Privacy Policy.",
        "ask-terms",
      )
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend()
  }

  async function handleAgreeAndCreate() {
    setStep("submitting")
    setMessages(p => [...p, { id: "u-agree", role: "user", text: "I agree - create my account" }])
    setTyping(true)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          ...(referralCode && { referralCode }),
        }),
      })
      const data = await res.json()
      setTyping(false)
      if (!res.ok) {
        setMessages(p => [
          ...p,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: data.error || "Something went wrong - please try again.",
          },
        ])
        setStep("terms")
        return
      }
      setStep("done")
      setMessages(p => [
        ...p,
        {
          id: "success",
          role: "assistant",
          text: `Done! Your account is created. Check your inbox to verify your email and you're good to go.`,
        },
      ])
      setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(email)}`), 1800)
    } catch {
      setTyping(false)
      setMessages(p => [
        ...p,
        { id: `catch-${Date.now()}`, role: "assistant", text: "Something went wrong. Please try again." },
      ])
      setStep("terms")
    }
  }

  const isPasswordStep = step === "password" || step === "confirm"
  const showInput = step === "name" || step === "email" || step === "password" || step === "confirm"

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Green glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl p-[1px]"
        style={{
          background: "linear-gradient(135deg, rgba(0,255,135,0.35) 0%, rgba(0,207,255,0.15) 50%, rgba(0,255,135,0.1) 100%)",
        }}
      >
        <div
          className="bg-[#080808] rounded-2xl flex flex-col overflow-hidden"
          style={{ minHeight: "560px", maxHeight: "88vh" }}
        >
          {/* Logo */}
          <div className="flex justify-center pt-6 pb-3 shrink-0">
            <Link href="/">
              <Image
                src="/ChatFPL_AI_Logo.png"
                alt="ChatFPL AI"
                width={40}
                height={40}
                className="h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Chat scroll window */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
            }}
          >
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0">
                      <Image
                        src="/ChatFPL_AI_Logo.png"
                        alt="CF"
                        width={16}
                        height={16}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#00FF87] to-[#00CFFF] text-black font-medium rounded-br-sm"
                        : "bg-white/[0.07] border border-white/[0.08] text-white rounded-bl-sm"
                    }`}
                  >
                    {msg.masked ? "••••••••" : msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
              >
                <TypingDots />
              </motion.div>
            )}
          </div>

          {/* Input / Actions */}
          <div className="px-4 pb-5 pt-3 border-t border-white/[0.06] shrink-0 space-y-3">
            <AnimatePresence mode="wait">
              {showInput && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-2.5"
                >
                  <input
                    ref={inputRef}
                    type={isPasswordStep && !showPassword ? "password" : "text"}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={
                      step === "name"
                        ? "Your full name..."
                        : step === "email"
                        ? "your@email.com"
                        : step === "password"
                        ? "At least 8 characters..."
                        : "Same password again..."
                    }
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30 min-w-0"
                    autoComplete={isPasswordStep ? "new-password" : step === "email" ? "email" : "name"}
                  />
                  {isPasswordStep && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-white/40 hover:text-white transition-colors shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputVal.trim() || typing}
                    className="shrink-0 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00CFFF] px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </motion.div>
              )}

              {step === "terms" && (
                <motion.div
                  key="terms"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <button
                    onClick={handleAgreeAndCreate}
                    className="w-full rounded-[20px] bg-gradient-to-r from-[#00FF87] to-[#00CFFF] py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
                  >
                    I agree - create my account
                  </button>
                  <p className="text-center text-xs text-white/30">
                    By clicking above you agree to our{" "}
                    <Link href="/terms" className="text-[#00FF87] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#00FF87] hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-[#00FF87]" />
                    Redirecting...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-xs text-white/25">
              Already have an account?{" "}
              <Link href="/login" className="text-[#00FF87] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#00FF87]" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
