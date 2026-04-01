"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const SPRING = { type: "spring" as const, stiffness: 120, damping: 20 }

function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0 text-black font-black text-[9px]">
        CF
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/[0.08] px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-white/50"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleResend = async () => {
    if (!email || isResending) return
    setIsResending(true)
    setResendStatus("sending")
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setResendStatus(response.ok ? "sent" : "error")
    } catch {
      setResendStatus("error")
    } finally {
      setIsResending(false)
    }
  }

  const messages = [
    {
      id: "intro",
      role: "assistant" as const,
      text: email
        ? `Almost there. We've sent a verification link to **${email}** - click it to activate your account and you're good to go.`
        : "Almost there. We've sent a verification link to your email - click it to activate your account.",
    },
    {
      id: "steps",
      role: "assistant" as const,
      text: "Check your inbox (and spam just in case). Once you've clicked the link, head back here to log in.",
    },
  ]

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
        <div className="bg-[#080808] rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: "480px" }}>

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

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...SPRING, delay: idx * 0.3 }}
                  className="flex items-end gap-2"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0 text-black font-black text-[9px]">
                    CF
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/[0.08] px-4 py-3 text-sm text-white leading-relaxed">
                    {msg.text.split(/\*\*(.+?)\*\*/).map((part, i) =>
                      i % 2 === 1
                        ? <span key={i} className="font-semibold text-[#00FF87]">{part}</span>
                        : <span key={i}>{part}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Resend status message */}
            <AnimatePresence>
              {resendStatus === "sent" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0 text-black font-black text-[9px]">
                    CF
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/[0.08] px-4 py-3 text-sm text-white leading-relaxed flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#00FF87] shrink-0" />
                    Sent - check your inbox again.
                  </div>
                </motion.div>
              )}
              {resendStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00FF87] to-[#00CFFF] flex items-center justify-center shrink-0 text-black font-black text-[9px]">
                    CF
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/[0.08] px-4 py-3 text-sm text-white leading-relaxed flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    Something went wrong - please try again.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="shrink-0 px-4 pb-6 pt-3 space-y-2">
            {/* Resend button */}
            {email && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={handleResend}
                disabled={isResending || resendStatus === "sent"}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.07] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isResending ? "Sending..." : resendStatus === "sent" ? "Email sent ✓" : "Resend verification email"}
              </motion.button>
            )}

            {/* Go to Login - shimmer button */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="relative overflow-hidden rounded-xl"
            >
              <Link href="/login">
                <button className="shimmer-btn relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-black transition-transform active:scale-[0.98]"
                  style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
                >
                  <span className="relative z-10">Go to Login</span>
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center text-[11px] text-white/30 pt-1"
            >
              Check your spam folder if you don't see it.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#00FF87]" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
