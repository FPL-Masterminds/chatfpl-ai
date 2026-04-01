"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"
import { Footer } from "@/components/footer"

// ── Types ─────────────────────────────────────────────────────────────────────

interface RewardStatus {
  action_type: string
  status: string
  reward_messages: number
  created_at: string
}

interface UserData {
  totalEarned: number
  availableRewards: {
    twitter: boolean
    reddit: boolean
    facebook: boolean
    review: boolean
    referral: boolean
  }
  claimedRewards: RewardStatus[]
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function DarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

function GreenBtn({ children, onClick, disabled = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold text-[#08020E] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
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

function GhostBtn({ children, onClick, disabled = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border border-[#00FF87]/50 bg-[#00FF87]/10 px-5 py-2.5 text-sm font-semibold text-[#00FF87] transition-all duration-300 hover:bg-gradient-to-r hover:from-[#00FF87] hover:to-[#00FFFF] hover:text-[#1A0E24] hover:border-transparent hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  )
}

function ClaimedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/35 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      Already Claimed
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === "verified") return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Verified
    </span>
  )
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />Pending
    </span>
  )
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />Rejected
    </span>
  )
  return null
}

// ── Dark input ─────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-colors disabled:opacity-40"
const labelCls = "block text-xs uppercase tracking-[0.18em] text-emerald-400/70 mb-2"

// ── Gradient border modal wrapper ─────────────────────────────────────────────

function GradientModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <div
          className="rounded-2xl p-[1.5px]"
          style={{
            background: "linear-gradient(135deg,#00FF87,#00CFFF,#00FF87)",
            backgroundSize: "200% 200%",
            animation: "glow_scroll 3s linear infinite",
          }}
        >
          <div className="rounded-2xl bg-[#080808] p-6 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reward cards config ────────────────────────────────────────────────────────

const REWARDS = [
  {
    id: "twitter",
    label: "Post on X",
    desc: "Share ChatFPL on X (Twitter) and earn 5 free messages.",
    reward: "+5 messages",
    icon: (
      <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: "reddit",
    label: "Post on Reddit",
    desc: "Share ChatFPL on Reddit and earn 5 free messages.",
    reward: "+5 messages",
    icon: <Image src="/Reddit.png" alt="Reddit" width={28} height={28} className="h-7 w-7" />,
  },
  {
    id: "facebook",
    label: "Post on Facebook",
    desc: "Share ChatFPL on Facebook and earn 5 free messages.",
    reward: "+5 messages",
    icon: (
      <svg className="h-7 w-7 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "review",
    label: "Submit a Review",
    desc: "Write a review (5 messages) or let us use your X post (10 messages).",
    reward: "+5 or +10 messages",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#D4AF37">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EarnMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState("")
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [reviewType, setReviewType] = useState<"written" | "xpost">("written")
  const [writtenReview, setWrittenReview] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewDescription, setReviewDescription] = useState("")
  const [xConsentGiven, setXConsentGiven] = useState(false)
  const [resultModal, setResultModal] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false, success: false, message: "",
  })

  useEffect(() => {
    fetchRewardStatus()
    fetchReferralLink()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRewardStatus = async () => {
    try {
      const res = await fetch("/api/rewards/status")
      if (res.status === 401) { router.push("/login"); return }
      if (res.status === 403) {
        const data = await res.json()
        if (data.error.includes("paying member")) { router.push("/admin"); return }
        setError(data.error)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error()
      setUserData(await res.json())
    } catch { setError("Failed to load reward data") }
    finally { setLoading(false) }
  }

  const fetchReferralLink = async () => {
    try {
      const res = await fetch("/api/referral/generate")
      if (res.ok) { const d = await res.json(); setReferralLink(d.referralLink) }
    } catch {}
  }

  const openClaim = (type: string) => {
    setClaimingReward(type)
    setProofUrl(""); setReviewType("written"); setWrittenReview("")
    setReviewRating(5); setReviewDescription(""); setXConsentGiven(false)
  }

  const closeClaim = () => {
    setClaimingReward(null); setProofUrl(""); setWrittenReview("")
    setReviewRating(5); setReviewDescription(""); setXConsentGiven(false)
  }

  const submitClaim = async () => {
    if (!claimingReward) return
    if (claimingReward === "review") {
      if (reviewType === "written" && !writtenReview.trim())
        return setResultModal({ show: true, success: false, message: "Please write your review (max 280 characters)" })
      if (reviewType === "written" && writtenReview.length > 280)
        return setResultModal({ show: true, success: false, message: "Review must be 280 characters or less" })
      if (reviewType === "xpost" && !proofUrl.trim())
        return setResultModal({ show: true, success: false, message: "Please provide the link to your X post" })
      if (reviewType === "xpost" && !xConsentGiven)
        return setResultModal({ show: true, success: false, message: "Please confirm consent to use your X post" })
    }
    if (claimingReward !== "referral" && claimingReward !== "review" && !proofUrl.trim())
      return setResultModal({ show: true, success: false, message: "Please enter the URL to your post" })

    setSubmitting(true)
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: claimingReward,
          proof_url: claimingReward === "review" && reviewType === "written"
            ? `WRITTEN_REVIEW: ${writtenReview}`
            : proofUrl.trim() || null,
          metadata: claimingReward === "review" ? {
            reviewType, xConsent: reviewType === "xpost" ? xConsentGiven : false,
            rating: reviewType === "xpost" ? 5 : reviewRating,
            description: reviewDescription.trim() || "Subscriber",
            reviewText: reviewType === "written" ? writtenReview : null,
          } : null,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        closeClaim()
        setResultModal({ show: true, success: true, message: result.message })
        fetchRewardStatus()
      } else {
        setResultModal({ show: true, success: false, message: result.error })
      }
    } catch {
      setResultModal({ show: true, success: false, message: "Failed to submit claim. Please try again." })
    } finally { setSubmitting(false) }
  }

  const copyReferral = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="flex gap-1">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400" />
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────────────────

  if (error) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black px-4">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-8 max-w-sm w-full text-center space-y-4">
        <p className="text-white font-semibold">{error}</p>
        <GreenBtn onClick={() => router.push("/")} className="w-full">View Pricing Plans</GreenBtn>
      </div>
    </div>
  )

  // ── Available reward keys ─────────────────────────────────────────────────────

  const avail = userData?.availableRewards

  return (
    <div className="flex min-h-screen flex-col bg-black earn-root">
      <style>{`
        .earn-root ::-webkit-scrollbar { width: 4px; }
        .earn-root ::-webkit-scrollbar-track { background: transparent; }
        .earn-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
      `}</style>

      {/* Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{ backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.07) 0%, transparent 70%)" }} />

      <DevHeader />

      <main className="relative z-10 flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Heading */}
          <div className="text-center">
            <h1 className="mb-3 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
              <span className="text-white">Earn </span>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}>
                Free Messages
              </span>
            </h1>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              Share ChatFPL with others and earn bonus messages to keep your edge going.
            </p>
          </div>

          {/* Total earned banner */}
          <DarkPanel className="text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 mb-2">Total Messages Earned</p>
            <p className="text-5xl font-bold" style={{ color: "#00FF87" }}>
              {userData?.totalEarned ?? 0}
              <span className="text-2xl font-semibold text-white/40 ml-2">of 50</span>
            </p>
            <p className="mt-2 text-xs text-white/40">Lifetime cap of 50 bonus messages ensures fair usage for all free users</p>
            <p className="mt-2 text-xs text-amber-400/70 font-medium">Bonus messages expire on your renewal date - use them before then</p>
          </DarkPanel>

          {/* Reward cards */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 mb-4">Available Rewards</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {REWARDS.map((r) => {
                const available = avail?.[r.id as keyof typeof avail] ?? false
                return (
                  <DarkPanel key={r.id} className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">{r.icon}</div>
                        <div>
                          <p className="font-semibold text-white text-sm">{r.label}</p>
                          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{r.desc}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 whitespace-nowrap">
                        {r.reward}
                      </span>
                    </div>
                    <div>
                      {available
                        ? <GreenBtn onClick={() => openClaim(r.id)} className="w-full">Claim Reward</GreenBtn>
                        : <ClaimedPill />
                      }
                    </div>
                  </DarkPanel>
                )
              })}

              {/* Referral card — full width */}
              <DarkPanel className="md:col-span-2 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="h-7 w-7 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-white text-sm">Refer a Friend</p>
                      <p className="text-xs text-white/45 mt-0.5">Invite friends to sign up and verify their email. Earn 5 messages per referral, up to 3 referrals.</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 whitespace-nowrap">
                    +5 messages
                  </span>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-1.5">Your Referral Link</p>
                  <p className="text-sm text-emerald-300 break-all font-medium">{referralLink || "Generating..."}</p>
                </div>

                <GreenBtn onClick={copyReferral} disabled={!referralLink} className="w-full">
                  {copied ? "Copied!" : "Copy Referral Link"}
                </GreenBtn>
              </DarkPanel>
            </div>
          </div>

          {/* Claims history */}
          {userData && userData.claimedRewards.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 mb-4">Your Claims</p>
              <DarkPanel className="space-y-2">
                {userData.claimedRewards.map((reward, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-white/6 bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white capitalize">{reward.action_type}</p>
                      <p className="text-xs text-white/35">{new Date(reward.created_at).toLocaleDateString("en-GB")}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusPill status={reward.status} />
                      <p className="text-xs text-emerald-400 font-medium">+{reward.reward_messages} messages</p>
                    </div>
                  </div>
                ))}
              </DarkPanel>
            </div>
          )}

          {/* T&Cs */}
          <DarkPanel>
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 mb-3">Terms & Conditions</p>
            <ul className="space-y-1.5 text-xs text-white leading-relaxed">
              <li>Social rewards (X, Reddit, Facebook) can only be claimed once per account - 5 messages each</li>
              <li>Review reward can be claimed once per account - 5 or 10 messages depending on type</li>
              <li>Referral rewards: maximum 3 referrals per account, 5 messages each</li>
              <li>Email verification required before claiming rewards</li>
              <li>Social shares and reviews require admin verification within 24-48 hours</li>
              <li>Referral rewards are granted automatically after the referred user verifies their email</li>
              <li>Lifetime cap: 50 bonus messages total per account</li>
              <li>Bonus messages expire on your renewal date - use them before then</li>
              <li>Rewards are only available for Free tier users</li>
            </ul>
          </DarkPanel>

        </div>
      </main>

      <Footer />

      {/* ── Claim Modal ───────────────────────────────────────────────────────── */}
      {claimingReward && (
        <GradientModal onClose={closeClaim}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 mb-1">Claim Reward</p>
            <p className="font-semibold text-white text-base capitalize">
              {claimingReward === "twitter" ? "Post on X" :
               claimingReward === "reddit" ? "Post on Reddit" :
               claimingReward === "facebook" ? "Post on Facebook" :
               claimingReward === "review" ? "Submit a Review" : "Refer a Friend"}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {claimingReward === "referral" ? "Your referral is tracked automatically when your friend signs up." :
               claimingReward === "review" ? "Choose how you want to submit your review." :
               "Paste the URL to your post below."}
            </p>
          </div>

          {/* Review type toggle */}
          {claimingReward === "review" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewType("written")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${reviewType === "written" ? "bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#08020E]" : "border border-white/10 bg-white/[0.04] text-white/50 hover:text-white"}`}
                >
                  Write Review (+5)
                </button>
                <button
                  onClick={() => setReviewType("xpost")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${reviewType === "xpost" ? "bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#08020E]" : "border border-white/10 bg-white/[0.04] text-white/50 hover:text-white"}`}
                >
                  X Post (+10)
                </button>
              </div>

              {reviewType === "written" ? (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} disabled={submitting}
                          className="text-3xl transition-transform hover:scale-110">
                          <span style={{ color: star <= reviewRating ? "#FFD700" : "rgba(255,255,255,0.2)" }}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description (optional)</label>
                    <input type="text" placeholder="e.g. FPL Manager, Premium Subscriber"
                      value={reviewDescription} onChange={(e) => setReviewDescription(e.target.value)}
                      maxLength={50} disabled={submitting} className={inputCls}
                      style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
                    />
                    <p className="mt-1 text-[11px] text-white/25">Defaults to &quot;Subscriber&quot; if left blank</p>
                  </div>
                  <div>
                    <label className={labelCls}>Your Review (max 280 chars)</label>
                    <textarea placeholder="Share your experience with ChatFPL..."
                      value={writtenReview} onChange={(e) => setWrittenReview(e.target.value)}
                      maxLength={280} rows={4} disabled={submitting}
                      className={inputCls + " resize-none"} />
                    <p className="mt-1 text-[11px] text-white/25">{writtenReview.length}/280 - may appear on homepage</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Description (optional)</label>
                    <input type="text" placeholder="e.g. FPL Manager, Premium Subscriber"
                      value={reviewDescription} onChange={(e) => setReviewDescription(e.target.value)}
                      maxLength={50} disabled={submitting} className={inputCls}
                      style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>X Post URL</label>
                    <input type="url" placeholder="https://x.com/yourpost..."
                      value={proofUrl} onChange={(e) => setProofUrl(e.target.value)}
                      disabled={submitting} className={inputCls}
                      style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
                    />
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                    <p className="text-[10px] text-white/30 mb-1.5">Rating (auto-set for X posts)</p>
                    <div className="flex gap-1">{[1,2,3,4,5].map((s) => <span key={s} className="text-xl" style={{ color: "#FFD700" }}>★</span>)}</div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                    <input type="checkbox" checked={xConsentGiven}
                      onChange={(e) => setXConsentGiven(e.target.checked)} disabled={submitting}
                      className="mt-0.5 accent-emerald-400" />
                    <span className="text-xs text-white/60 leading-relaxed">
                      I consent to ChatFPL using my X post content and profile photo on the homepage testimonials (10 messages reward)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Standard URL input */}
          {claimingReward !== "referral" && claimingReward !== "review" && (
            <div>
              <label className={labelCls}>Post URL</label>
              <input type="url"
                placeholder={
                  claimingReward === "twitter" ? "https://x.com/yourpost..." :
                  claimingReward === "reddit" ? "https://reddit.com/r/.../comments/..." :
                  "https://facebook.com/..."
                }
                value={proofUrl} onChange={(e) => setProofUrl(e.target.value)}
                disabled={submitting} className={inputCls}
                style={{ WebkitBoxShadow: "0 0 0 1000px #080808 inset", WebkitTextFillColor: "white" }}
              />
              <p className="mt-1.5 text-[11px] text-white/25">We&apos;ll verify your post within 24-48 hours</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <GreenBtn onClick={submitClaim} disabled={submitting} className="flex-1">
              {submitting ? "Submitting..." : "Submit Claim"}
            </GreenBtn>
            <GhostBtn onClick={closeClaim} disabled={submitting} className="flex-1">Cancel</GhostBtn>
          </div>
        </GradientModal>
      )}

      {/* ── Result Modal ──────────────────────────────────────────────────────── */}
      {resultModal.show && (
        <GradientModal onClose={() => setResultModal({ show: false, success: false, message: "" })}>
          <p className="font-semibold text-base" style={{
            background: "linear-gradient(to right,#00FF87,#00CFFF)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            {resultModal.success ? "✓ Done" : "Unexpected Response"}
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            {resultModal.success
              ? resultModal.message
              : `${resultModal.message}${resultModal.message.endsWith(".") ? "" : "."} Please contact support if this continues.`}
          </p>
          <GreenBtn onClick={() => setResultModal({ show: false, success: false, message: "" })} className="w-full">OK</GreenBtn>
        </GradientModal>
      )}
    </div>
  )
}
