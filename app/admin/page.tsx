"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { DevHeader } from "@/components/dev-header"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountData {
  user: {
    id: number
    name: string
    email: string
    role: string
    created_at: string
    fpl_team_id: number | null
  }
  subscription: {
    plan: string
    status: string
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean | null
  }
  usage: {
    messages_used: number
    messages_limit: number
  }
}

interface PendingClaim {
  id: string
  user_name: string
  user_email: string
  action_type: string
  reward_messages: number
  proof_url: string | null
  created_at: string
  metadata?: {
    reviewType?: string
    rating?: number
    description?: string
    reviewText?: string
    xConsent?: boolean
  }
}

interface Analytics {
  totalUsers: number
  activeSubscriptions: number
  messagesToday: number
  chatSessionsToday: number
  allTimeMessages: number
}

interface CustomerEvent {
  id: string
  type: "signup" | "subscription"
  title: string
  detail: string
  timestamp: string
}

interface DailyStat {
  date: string
  messages: number
  signups: number
  paid: number
}

interface TopUser {
  userId: string
  name: string
  email: string
  messages: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 mb-3">{children}</p>
}

function GreenBtn({ onClick, disabled, children, className = "" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2 text-sm font-bold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5 active:scale-[0.98] ${className}`}
      style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
    >
      {children}
    </button>
  )
}

function GhostBtn({ onClick, disabled, children, className = "" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2 text-sm font-semibold text-[#00FF87] border border-[#00FF87]/50 bg-[#00FF87]/10 hover:bg-gradient-to-r hover:from-[#00FF87] hover:to-[#00FFFF] hover:text-black hover:border-transparent hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"account" | "rewards" | "admin" | "archive">("account")
  const [archivedConversations, setArchivedConversations] = useState<any[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [vipEmail, setVipEmail] = useState("")
  const [vipLoading, setVipLoading] = useState(false)
  const [vipMessage, setVipMessage] = useState("")
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [customerEvents, setCustomerEvents] = useState<CustomerEvent[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsRange, setEventsRange] = useState<"today" | "7d" | "14d" | "30d" | "60d" | "120d" | "365d">("14d")
  const [eventsType, setEventsType] = useState<"all" | "signup" | "subscription">("all")
  const [resultModal, setResultModal] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: "" })
  const [billingLoading, setBillingLoading] = useState(false)
  const [fplTeamInput, setFplTeamInput] = useState("")
  const [fplTeamSaving, setFplTeamSaving] = useState(false)
  const [fplFeedback, setFplFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [fplVerifiedName, setFplVerifiedName] = useState<string | null>(null)

  useEffect(() => { fetchAccountData() }, [])

  useEffect(() => {
    if (data?.user.role === "admin") {
      fetchPendingClaims()
      fetchAnalytics()
      fetchCustomerEvents(eventsRange, eventsType)
    }
  }, [data?.user.role])

  useEffect(() => {
    if (data?.user.role === "admin") fetchCustomerEvents(eventsRange, eventsType)
  }, [eventsRange, eventsType])

  const fetchAccountData = async () => {
    try {
      const response = await fetch("/api/account")
      if (response.status === 401) { router.push("/login"); return }
      if (!response.ok) throw new Error("Failed to fetch account data")
      const accountData = await response.json()
      setData(accountData)
      if (accountData.user?.fpl_team_id) setFplTeamInput(String(accountData.user.fpl_team_id))
    } catch (err) {
      setError("Failed to load account data")
    } finally {
      setLoading(false)
    }
  }

  const handleMakeVIP = async (e: React.FormEvent) => {
    e.preventDefault()
    setVipLoading(true)
    setVipMessage("")
    try {
      const response = await fetch("/api/admin/make-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vipEmail }),
      })
      const result = await response.json()
      setVipMessage(response.ok ? `✅ ${result.message}` : `❌ ${result.error}`)
      if (response.ok) { setVipEmail(""); setTimeout(() => setVipMessage(""), 5000) }
    } catch { setVipMessage("❌ Failed to grant VIP access.") } finally { setVipLoading(false) }
  }

  const fetchArchivedConversations = async () => {
    try {
      setArchiveLoading(true)
      const res = await fetch("/api/chat/conversations?archived=true")
      if (res.ok) { const d = await res.json(); setArchivedConversations(d.conversations || []) }
    } catch (err) { console.error(err) } finally { setArchiveLoading(false) }
  }

  const handleUnarchive = async (convId: string) => {
    await fetch("/api/chat/conversations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: convId, archived: false }) })
    setArchivedConversations((prev) => prev.filter((c) => c.id !== convId))
  }

  const handleDeleteArchived = async (convId: string) => {
    await fetch("/api/chat/conversations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: convId }) })
    setArchivedConversations((prev) => prev.filter((c) => c.id !== convId))
  }

  const fetchPendingClaims = async () => {
    try {
      setClaimsLoading(true)
      const response = await fetch("/api/rewards/verify")
      if (response.ok) { const d = await response.json(); setPendingClaims(d.claims) }
    } catch (err) { console.error(err) } finally { setClaimsLoading(false) }
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch("/api/admin/analytics")
      if (response.ok) { const d = await response.json(); setAnalytics(d) }
    } catch (err) { console.error(err) } finally { setAnalyticsLoading(false) }
  }

  const fetchCustomerEvents = async (range: typeof eventsRange, type: typeof eventsType) => {
    try {
      setEventsLoading(true)
      const response = await fetch(`/api/admin/customer-events?range=${range}&type=${type}`)
      if (response.ok) {
        const payload = await response.json()
        setCustomerEvents(payload.events || [])
        setDailyStats(payload.dailyStats || [])
        setTopUsers(payload.topUsers || [])
      }
    } catch (err) { console.error(err) } finally { setEventsLoading(false) }
  }

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url; link.setAttribute("download", filename)
    document.body.appendChild(link); link.click()
    document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true)
      const response = await fetch("/api/stripe/create-portal-session", { method: "POST" })
      const result = await response.json()
      if (response.ok && result.url) { window.open(result.url, "_blank"); setTimeout(() => fetchAccountData(), 2000) }
      else setResultModal({ show: true, success: false, message: result.error || "Failed to open billing portal" })
    } catch { setResultModal({ show: true, success: false, message: "An error occurred. Please try again." }) }
    finally { setBillingLoading(false) }
  }

  const handleVerifyClaim = async (claimId: string, action: "approve" | "reject", displayOnHomepage = false) => {
    try {
      const response = await fetch("/api/rewards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_id: claimId, action, displayOnHomepage }),
      })
      const result = await response.json()
      setResultModal({ show: true, success: response.ok, message: response.ok ? result.message : result.error })
      if (response.ok) fetchPendingClaims()
    } catch { setResultModal({ show: true, success: false, message: "Failed to process claim." }) }
  }

  const handleSaveFplTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setFplTeamSaving(true)
    setFplFeedback(null)
    setFplVerifiedName(null)
    try {
      const res = await fetch("/api/account/fpl-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fpl_team_id: fplTeamInput.trim() || null }),
      })
      const result = await res.json()
      if (res.ok) { setFplFeedback({ type: "success", text: "Saved!" }); if (result.team_name) setFplVerifiedName(result.team_name) }
      else setFplFeedback({ type: "error", text: result.error || "Failed to save." })
    } catch { setFplFeedback({ type: "error", text: "Network error. Please try again." }) }
    finally { setFplTeamSaving(false) }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available"
    return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  }

  const planColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "admin": return "text-purple-300"
      case "vip": return "text-yellow-300"
      case "elite": return "text-cyan-300"
      case "premium": return "text-emerald-300"
      default: return "text-white/60"
    }
  }

  // ── Loading ──
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,255,135,0.12) 0%, transparent 70%)" }} />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#00FF87]"
              style={{ animationDelay: `${i * -0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-white/40">Loading your account...</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error || !data) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative rounded-2xl border border-red-500/30 bg-white/[0.04] p-8 max-w-sm w-full text-center space-y-4">
        <p className="text-white font-semibold">{error || "Failed to load account data"}</p>
        <GreenBtn onClick={() => router.push("/login")} className="w-full">Back to Login</GreenBtn>
      </div>
    </div>
  )

  const messagesRemaining = data.usage.messages_limit - data.usage.messages_used
  const usagePct = data.usage.messages_limit > 0 ? Math.min((data.usage.messages_used / data.usage.messages_limit) * 100, 100) : 0
  const isFree = data.subscription.plan.toLowerCase() === "free"
  const isAdmin = data.user.role === "admin"

  const TABS = [
    { id: "account", label: "My Account" },
    { id: "archive", label: "Archive" },
    ...(isAdmin ? [
      { id: "rewards", label: `Reward Management${pendingClaims.length > 0 ? ` (${pendingClaims.length})` : ""}` },
      { id: "admin", label: "Administration" },
    ] : []),
  ] as const

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,255,135,0.13) 0%, transparent 65%)" }}
      />

      <DevHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-28 pb-16 space-y-6">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-white">Account Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Manage your ChatFPL subscription, usage, and settings</p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-2 flex-wrap"
          style={{
            padding: "6px 8px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            width: "fit-content",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return active ? (
              <div
                key={tab.id}
                style={{
                  padding: "1.5px",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
                  backgroundSize: "200% 200%",
                  animation: "glow_scroll 3.5s linear infinite",
                }}
              >
                <button
                  onClick={() => { setActiveTab(tab.id as typeof activeTab); if (tab.id === "archive") fetchArchivedConversations() }}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold focus:outline-none whitespace-nowrap"
                  style={{ background: "rgba(0,0,0,0.9)", display: "block" }}
                >
                  <span style={{ background: "linear-gradient(to right,#00FFFF,#00FF87)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {tab.label}
                  </span>
                </button>
              </div>
            ) : (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as typeof activeTab); if (tab.id === "archive") fetchArchivedConversations() }}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-white hover:text-white transition-all whitespace-nowrap focus:outline-none"
                style={{ border: "1.5px solid transparent" }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── My Account Tab ── */}
        {activeTab === "account" && (
          <div className="space-y-5">

            {/* User summary */}
            <DarkCard>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xl font-bold text-white">{data.user.name}</p>
                  <p className="text-sm text-white mt-0.5">{data.user.email}</p>
                  <p className="text-xs text-white/50 mt-1">Member since {formatDate(data.user.created_at)}</p>
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                  data.user.role === "admin"
                    ? "border-purple-400/30 bg-purple-400/10 text-purple-300"
                    : data.subscription.plan.toLowerCase() === "vip"
                    ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                    : data.subscription.plan.toLowerCase() !== "free"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.04] text-white/50"
                }`}>
                  {data.subscription.plan}
                </span>
              </div>
            </DarkCard>

            {/* Quick actions */}
            <DarkCard>
              <SectionLabel>Quick Actions</SectionLabel>
              <div className="flex flex-wrap gap-3">
                <Link href="/chat">
                  <GreenBtn>ChatFPL AI</GreenBtn>
                </Link>
                <Link href="/contact">
                  <GhostBtn>Support</GhostBtn>
                </Link>
                {!isFree && (
                  <GhostBtn onClick={handleManageBilling} disabled={billingLoading}>
                    {billingLoading ? "Loading..." : "Manage Subscription"}
                  </GhostBtn>
                )}
              </div>
            </DarkCard>

            {/* FPL Settings */}
            <DarkCard>
              <SectionLabel>FPL Settings</SectionLabel>
              <p className="text-sm text-white mb-4">Link your public FPL Team ID so ChatFPL can reference your squad, rank, and mini-league data in conversations.</p>
              <form onSubmit={handleSaveFplTeam} className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1234567"
                  value={fplTeamInput}
                  onChange={(e) => { setFplTeamInput(e.target.value); setFplFeedback(null) }}
                  disabled={fplTeamSaving}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#00FF87]/50 focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <GreenBtn disabled={fplTeamSaving} className="shrink-0">
                  {fplTeamSaving ? "Saving..." : "Save"}
                </GreenBtn>
              </form>
              {fplFeedback && (
                <p className={`mt-2 text-sm ${fplFeedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {fplFeedback.type === "success" ? "✓" : "✕"} {fplFeedback.text}
                  {fplVerifiedName && <span className="ml-1 text-white"> - <span className="font-semibold">{fplVerifiedName}</span></span>}
                </p>
              )}
              {!fplFeedback && data.user.fpl_team_id && (
                <p className="mt-2 text-xs text-white/70">Currently saved: Team ID <span className="font-semibold text-white">{data.user.fpl_team_id}</span></p>
              )}
              <p className="mt-3 text-xs text-white/60">
                Your Team ID appears in your FPL URL:{" "}
                <span className="font-mono text-white/70">fantasy.premierleague.com/entry/<strong>XXXXXXX</strong>/event/...</span>{" "}
                -{" "}
                <a href="https://fantasy.premierleague.com/" target="_blank" rel="noopener noreferrer" className="text-[#00FF87]/70 hover:text-[#00FF87] underline underline-offset-2">
                  Open FPL
                </a>
              </p>
            </DarkCard>

            {/* Subscription + Usage */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Subscription */}
              <DarkCard>
                <SectionLabel>Subscription Status</SectionLabel>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-emerald-400/70 mb-0.5 uppercase tracking-widest">Current Plan</p>
                    <p className={`text-2xl font-bold ${planColor(data.subscription.plan)}`}>{data.subscription.plan}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${data.subscription.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-sm text-white capitalize">{data.subscription.status}</span>
                  </div>
                  {data.subscription.cancel_at_period_end && data.subscription.current_period_end && (
                    <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-3">
                      <p className="text-xs font-semibold text-yellow-300">Subscription Cancelled</p>
                      <p className="mt-1 text-xs text-yellow-200">Access continues until {formatDate(data.subscription.current_period_end)}.</p>
                    </div>
                  )}
                  {!isFree && (
                    <div>
                      <p className="text-xs text-emerald-400/70 mb-0.5 uppercase tracking-widest">Renewal Date</p>
                      <p className="text-sm text-white">{formatDate(data.subscription.current_period_end)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-emerald-400/70 mb-0.5 uppercase tracking-widest">Messages Remaining</p>
                    <p className="text-3xl font-bold text-[#00FF87]">{messagesRemaining.toLocaleString()}</p>
                  </div>
                </div>
              </DarkCard>

              {/* Usage */}
              <DarkCard>
                <SectionLabel>Usage Overview</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white">{isFree ? "Trial Messages" : "Monthly Messages"}</p>
                    <p className="text-xs text-white">{data.usage.messages_used} / {data.usage.messages_limit.toLocaleString()}</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${usagePct}%`,
                          background: usagePct > 80 ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#00FF87,#00CFFF)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-center text-sm text-white">
                    You've used <span className="font-bold text-[#00FF87]">{data.usage.messages_used}</span> of{" "}
                    <span className="font-bold text-[#00FF87]">{data.usage.messages_limit.toLocaleString()}</span>{" "}
                    {isFree ? "trial messages" : "messages this month"}
                  </div>
                  {isFree && data.usage.messages_limit > 5 && data.subscription.current_period_end && (
                    <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.05] px-4 py-3">
                      <p className="text-xs text-yellow-200 text-center">
                        Bonus messages expire on <span className="font-semibold">{formatDate(data.subscription.current_period_end)}</span>. Use them or lose them! Your 20 trial messages never reset.
                      </p>
                    </div>
                  )}
                </div>
              </DarkCard>
            </div>

            {/* Earn Bonus Messages - free users only */}
            {isFree && (
              <DarkCard>
                <SectionLabel>Earn Bonus Messages</SectionLabel>
                <p className="text-sm text-white mb-4">Share ChatFPL AI and earn extra messages!</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: (
                        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      ),
                      label: "Share on X",
                      sub: "Post about ChatFPL AI on X (Twitter)",
                    },
                    {
                      icon: (
                        <svg className="h-7 w-7 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ),
                      label: "Share on Facebook",
                      sub: "Share ChatFPL AI with your friends",
                    },
                    {
                      icon: <Image src="/Reddit.png" alt="Reddit" width={28} height={28} className="h-7 w-7" />,
                      label: "Share on Reddit",
                      sub: "Post to FPL communities",
                    },
                    {
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7" fill="#D4AF37">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ),
                      label: "Leave a Review",
                      sub: "Write a review and get featured",
                    },
                  ].map((item) => (
                    <Link key={item.label} href="/earn-messages" className="block">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-[#00FF87]/30 hover:bg-[#00FF87]/[0.03] transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            {item.icon}
                            <p className="font-semibold text-sm text-white">{item.label}</p>
                          </div>
                          <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}>+5 msgs</span>
                        </div>
                        <p className="text-xs text-white/70">{item.sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-center text-xs text-white">
                  Complete all social sharing tasks to earn bonus messages.
                </div>
              </DarkCard>
            )}
          </div>
        )}

        {/* ── Archive Tab ── */}
        {activeTab === "archive" && (
          <DarkCard>
            <SectionLabel>Archived Conversations</SectionLabel>
            <p className="text-sm text-white mb-4">Conversations you've archived from the chat. Unarchive to restore them to your sidebar.</p>
            {archiveLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#00FF87]" />
                <p className="mt-3 text-sm text-white/60">Loading archive...</p>
              </div>
            ) : archivedConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-14 text-center">
                <p className="text-white font-medium">No archived conversations</p>
                <p className="text-xs text-white/50 mt-1">Right-click any conversation in the chat to archive it.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivedConversations.map((conv) => {
                  const preview = conv.title || conv.messages?.[0]?.content?.substring(0, 80) || "Untitled conversation"
                  const date = new Date(conv.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  const msgCount = conv.messages?.length || 0
                  return (
                    <div key={conv.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-white truncate">{preview}</p>
                        <p className="text-xs text-white/60 mt-0.5">{date} · {msgCount} message{msgCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <GhostBtn onClick={() => handleUnarchive(conv.id)} className="text-xs px-3 py-1.5 text-emerald-400 border-emerald-400/20">Unarchive</GhostBtn>
                        <GhostBtn onClick={() => handleDeleteArchived(conv.id)} className="text-xs px-3 py-1.5 text-red-400 border-red-400/20">Delete</GhostBtn>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </DarkCard>
        )}

        {/* ── Rewards Tab (admin) ── */}
        {activeTab === "rewards" && isAdmin && (
          <DarkCard>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <SectionLabel>Pending Reward Claims</SectionLabel>
                <p className="text-sm text-white">Verify user social shares and referrals</p>
              </div>
              {pendingClaims.length > 0 && (
                <span className="text-xs font-bold text-black px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}>
                  {pendingClaims.length} pending
                </span>
              )}
            </div>
            {claimsLoading ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#00FF87]" />
              </div>
            ) : pendingClaims.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                <p className="text-white">No pending claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                    <p className="font-semibold text-white">{claim.user_name || claim.user_email}</p>
                      <p className="text-sm text-white/70">{claim.user_email}</p>
                        <p className="text-sm text-[#00FF87] font-semibold mt-1">
                          {claim.action_type.charAt(0).toUpperCase() + claim.action_type.slice(1)} - {claim.reward_messages} messages
                        </p>
                      </div>
                      <p className="text-xs text-white/30">{new Date(claim.created_at).toLocaleDateString()}</p>
                    </div>
                    {claim.action_type === "review" && claim.metadata && (
                      <div className="rounded-xl border border-yellow-400/15 bg-yellow-400/[0.05] p-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-300">Review Preview</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={s <= (claim.metadata?.rating || 5) ? "text-yellow-300" : "text-white/20"}>★</span>
                          ))}
                        </div>
                        {claim.metadata.description && <p className="text-sm font-semibold text-white">{claim.metadata.description}</p>}
                        {claim.metadata.reviewText && <p className="text-sm text-white italic">"{claim.metadata.reviewText}"</p>}
                        <div className="flex gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${claim.metadata.reviewType === "xpost" ? "bg-white/10 text-white" : "bg-yellow-400/20 text-yellow-300"}`}>
                            {claim.metadata.reviewType === "xpost" ? "X Post" : "Written Review"}
                          </span>
                          {claim.metadata.xConsent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300">Homepage Consent</span>}
                        </div>
                      </div>
                    )}
                    {claim.proof_url && (
                      <div>
                        <p className="text-xs text-white/30 mb-1">Proof URL:</p>
                        <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00FF87] hover:underline break-all">{claim.proof_url}</a>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {claim.action_type === "review" ? (
                        <>
                          <button
                            className="w-full rounded-xl py-2 text-sm font-semibold text-black transition hover:brightness-110"
                            style={{ background: "linear-gradient(90deg,#FFD700,#FFA500)" }}
                            onClick={() => handleVerifyClaim(claim.id, "approve", true)}
                          >
                            ⭐ Approve & Add to Homepage
                          </button>
                          <div className="flex gap-2">
                            <button className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/[0.15] transition" onClick={() => handleVerifyClaim(claim.id, "approve", false)}>Approve Only</button>
                            <button className="flex-1 rounded-xl border border-red-400/30 bg-red-400/[0.08] py-2 text-sm font-semibold text-red-400 hover:bg-red-400/[0.15] transition" onClick={() => handleVerifyClaim(claim.id, "reject")}>Reject</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <button className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/[0.15] transition" onClick={() => handleVerifyClaim(claim.id, "approve")}>Approve</button>
                          <button className="flex-1 rounded-xl border border-red-400/30 bg-red-400/[0.08] py-2 text-sm font-semibold text-red-400 hover:bg-red-400/[0.15] transition" onClick={() => handleVerifyClaim(claim.id, "reject")}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DarkCard>
        )}

        {/* ── Administration Tab (admin) ── */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-5">

            {/* Grant VIP */}
            <DarkCard>
              <SectionLabel>Grant VIP Access</SectionLabel>
              <p className="text-sm text-white mb-4">Give friends and family 100 free messages per month.</p>
              <form className="space-y-3" onSubmit={handleMakeVIP}>
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#00FF87]/50 focus:outline-none disabled:opacity-50"
                  required
                  disabled={vipLoading}
                />
                {vipMessage && (
                  <p className={`text-sm ${vipMessage.includes("✅") ? "text-emerald-400" : "text-red-400"}`}>{vipMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={vipLoading}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
                  style={{ background: "linear-gradient(90deg,#FFD700,#FFA500)" }}
                >
                  {vipLoading ? "Processing..." : "👑 Make VIP"}
                </button>
              </form>
            </DarkCard>

            {/* Analytics */}
            <DarkCard>
              <SectionLabel>System Analytics</SectionLabel>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Total Users", value: analytics?.totalUsers, accent: "#00FF87" },
                  { label: "Active Subscriptions", value: analytics?.activeSubscriptions, accent: "#00CFFF" },
                  { label: "Messages Today", value: analytics?.messagesToday, accent: "#a78bfa" },
                  { label: "All Time Messages", value: analytics?.allTimeMessages, accent: "#fbbf24" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.accent }}>
                      {analyticsLoading ? "..." : (stat.value?.toLocaleString() ?? "0")}
                    </p>
                  </div>
                ))}
              </div>
            </DarkCard>

            {/* Customer Events */}
            <DarkCard>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <SectionLabel>Customer Events</SectionLabel>
                <GhostBtn onClick={() => fetchCustomerEvents(eventsRange, eventsType)} disabled={eventsLoading} className="text-xs px-3 py-1.5">
                  {eventsLoading ? "Refreshing..." : "Refresh"}
                </GhostBtn>
              </div>

              {/* Range chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(["today","7d","14d","30d","60d","120d","365d"] as const).map((r) => (
                  <button key={r} onClick={() => setEventsRange(r)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${eventsRange === r ? "text-black" : "bg-white/[0.06] text-white/50 hover:text-white"}`} style={eventsRange === r ? { background: "linear-gradient(90deg,#00FF87,#00CFFF)" } : {}}>
                    {r === "today" ? "Today" : r}
                  </button>
                ))}
              </div>

              {/* Type chips */}
              <div className="flex gap-1.5 mb-4">
                {(["all","signup","subscription"] as const).map((t) => (
                  <button key={t} onClick={() => setEventsType(t)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${eventsType === t ? "text-black" : "bg-white/[0.06] text-white/50 hover:text-white"}`} style={eventsType === t ? { background: "linear-gradient(90deg,#00FF87,#00CFFF)" } : {}}>
                    {t === "all" ? "All events" : t === "signup" ? "Signups" : "Paid"}
                  </button>
                ))}
              </div>

              {/* Export + Totals */}
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <GhostBtn onClick={() => downloadCSV("customer-events.csv", [["Event Type","Title","Detail","Timestamp"], ...customerEvents.map((e) => [e.type,e.title,e.detail,e.timestamp])])} disabled={customerEvents.length === 0} className="w-full text-xs">Export Events CSV</GhostBtn>
                <GhostBtn onClick={() => downloadCSV("daily-stats.csv", [["Date","Messages","Signups","Paid"], ...dailyStats.map((d) => [d.date,String(d.messages),String(d.signups),String(d.paid)])])} disabled={dailyStats.length === 0} className="w-full text-xs">Export Daily Stats CSV</GhostBtn>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Range totals</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {dailyStats.reduce((a,d) => a+d.messages,0)} msgs · {dailyStats.reduce((a,d) => a+d.signups,0)} signups · {dailyStats.reduce((a,d) => a+d.paid,0)} paid
                  </p>
                </div>
              </div>

              {/* Top users table */}
              <div className="rounded-xl border border-white/8 overflow-hidden mb-4">
                <div className="grid grid-cols-3 bg-emerald-400/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
                  <span>User</span><span className="text-center">Messages</span><span className="text-right">Type</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {topUsers.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-white/30">No message activity yet in this range.</p>
                  ) : topUsers.map((u, i) => (
                    <div key={u.userId} className="grid grid-cols-3 border-t border-white/5 px-3 py-2 text-sm">
                      <span className="text-white">{i+1}. {u.name} <span className="text-xs text-white/60">({u.email})</span></span>
                      <span className="text-center font-semibold text-[#00FF87]">{u.messages}</span>
                      <span className="text-right text-xs text-white/50">Top user</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily stats table */}
              <div className="rounded-xl border border-white/8 overflow-hidden mb-4">
                <div className="grid grid-cols-4 bg-emerald-400/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
                  <span>Date</span><span className="text-center">Messages</span><span className="text-center">Signups</span><span className="text-center">Paid</span>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {dailyStats.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-white/30">No daily activity for this filter.</p>
                  ) : dailyStats.map((s) => (
                    <div key={s.date} className="grid grid-cols-4 border-t border-white/5 px-3 py-2 text-sm">
                      <span className="text-white">{new Date(s.date).toLocaleDateString("en-GB")}</span>
                      <span className="text-center font-semibold text-[#00FF87]">{s.messages}</span>
                      <span className="text-center text-white">{s.signups}</span>
                      <span className="text-center text-white">{s.paid}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events feed */}
              {eventsLoading ? (
                <p className="text-sm text-white/30">Loading events...</p>
              ) : customerEvents.length === 0 ? (
                <p className="text-sm text-white/30">No recent customer events found.</p>
              ) : (
                <div className="space-y-2">
                  {customerEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.type === "signup" ? "bg-blue-400/15 text-blue-300" : "text-black"}`} style={event.type === "subscription" ? { background: "linear-gradient(90deg,#00FF87,#00CFFF)" } : {}}>
                            {event.type === "signup" ? "Signup" : "Paid"}
                          </span>
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                        </div>
                        <p className="text-xs text-white/30">{new Date(event.timestamp).toLocaleString("en-GB")}</p>
                      </div>
                      <p className="mt-1 text-sm text-white">{event.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </DarkCard>
          </div>
        )}
      </main>

      {/* Result Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 space-y-4 bg-[#080808] ${resultModal.success ? "border-emerald-400/30" : "border-red-400/30"}`}>
            <p className={`font-semibold ${resultModal.success ? "text-emerald-300" : "text-red-400"}`}>
              {resultModal.success ? "✓ Success" : "✕ Error"}
            </p>
              <p className="text-sm text-white">{resultModal.message}</p>
            <GreenBtn onClick={() => setResultModal({ show: false, success: false, message: "" })} className="w-full">OK</GreenBtn>
          </div>
        </div>
      )}
    </div>
  )
}
