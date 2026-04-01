"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res  = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{ backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,255,135,0.07) 0%, transparent 70%)" }} />

      <DevHeader />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image src="/ChatFPL_AI_Logo.png" alt="ChatFPL" width={48} height={48} className="h-10 w-auto" />
            </Link>
          </div>

          {/* Panel */}
          <div
            className="rounded-[28px] p-[1.5px]"
            style={{
              background: "linear-gradient(135deg,rgba(0,255,135,0.35),rgba(255,255,255,0.06),rgba(0,207,255,0.35))",
              boxShadow: "0 0 80px rgba(0,255,135,0.08), 0 32px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div className="rounded-[26px] bg-[#080808] px-6 py-8 space-y-6">

              {!success ? (
                <>
                  {/* CF bot opener */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mt-0.5">
                      CF
                    </div>
                    <div className="rounded-[20px] rounded-tl-sm border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/80 leading-relaxed">
                      No problem - happens to the best of us. What&apos;s the email address on your account?
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-colors disabled:opacity-50"
                        style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full overflow-hidden rounded-full py-3 text-sm font-bold text-[#08020E] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
                    >
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2.4s linear infinite",
                        }}
                      />
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <p className="text-center text-xs text-white/30">
                    Remember it?{" "}
                    <Link href="/login" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">
                      Back to login
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  {/* Success state */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mt-0.5">
                      CF
                    </div>
                    <div className="rounded-[20px] rounded-tl-sm border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/80 leading-relaxed">
                      Done. Check your inbox - we&apos;ve sent a reset link to{" "}
                      <span className="font-semibold" style={{ color: "#00FF87" }}>{email}</span>.
                      The link expires in 1 hour.
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-3">
                    <div className="rounded-[20px] rounded-br-sm bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-sm font-medium text-black">
                      Got it, checking now
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="relative block w-full overflow-hidden rounded-full py-3 text-center text-sm font-bold text-[#08020E] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2.4s linear infinite",
                      }}
                    />
                    Back to Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
