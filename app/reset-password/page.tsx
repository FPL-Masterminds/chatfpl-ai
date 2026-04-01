"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"

// ── Eye icon ──────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

// ── Password input ────────────────────────────────────────────────────────────

function PasswordInput({ id, placeholder, value, onChange, disabled }: {
  id: string; placeholder: string; value: string
  onChange: (v: string) => void; disabled: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-colors disabled:opacity-50"
        style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

// ── Shimmer button ────────────────────────────────────────────────────────────

function ShimmerBtn({ children, type = "button", disabled = false, onClick }: {
  children: React.ReactNode; type?: "button" | "submit"
  disabled?: boolean; onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
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
      {children}
    </button>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword]               = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState("")
  const [success, setSuccess]                 = useState(false)

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new link.")
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) return setError("Passwords do not match")
    if (password.length < 8)          return setError("Password must be at least 8 characters")
    if (!token)                        return setError("Invalid reset token")
    setLoading(true)
    try {
      const res  = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2500)
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
                  {/* Bot opener */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mt-0.5">
                      CF
                    </div>
                    <div className="rounded-[20px] rounded-tl-sm border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/80 leading-relaxed">
                      Let&apos;s get you back in. Choose a strong new password - at least 8 characters.
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
                      <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 mb-2">
                        New Password
                      </label>
                      <PasswordInput
                        id="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={setPassword}
                        disabled={loading || !token}
                      />
                    </div>

                    <div>
                      <label htmlFor="confirm" className="block text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 mb-2">
                        Confirm Password
                      </label>
                      <PasswordInput
                        id="confirm"
                        placeholder="Same again"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        disabled={loading || !token}
                      />
                    </div>

                    <ShimmerBtn type="submit" disabled={loading || !token}>
                      {loading ? "Resetting..." : "Reset Password"}
                    </ShimmerBtn>
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
                  {/* Success */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-black text-[10px] shrink-0 mt-0.5">
                      CF
                    </div>
                    <div className="rounded-[20px] rounded-tl-sm border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/80 leading-relaxed">
                      You&apos;re all set. Password updated. Taking you to login now.
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-3">
                    <div className="rounded-[20px] rounded-br-sm bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-sm font-medium text-black">
                      Let&apos;s go
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
                    Go to Login
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

// ── Page wrapper (Suspense required for useSearchParams) ──────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
