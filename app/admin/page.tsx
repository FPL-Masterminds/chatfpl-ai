"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"

interface AccountData {
  user: {
    id: number
    name: string
    email: string
    role: string
    created_at: string
  }
  subscription: {
    plan: string
    status: string
    current_period_start: string | null
    current_period_end: string | null
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
}

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [vipEmail, setVipEmail] = useState("")
  const [vipLoading, setVipLoading] = useState(false)
  const [vipMessage, setVipMessage] = useState("")
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(false)

  useEffect(() => {
    fetchAccountData()
  }, [])

  useEffect(() => {
    // If user is admin, fetch pending claims
    if (data?.user.role === "admin") {
      fetchPendingClaims()
    }
  }, [data?.user.role])

  const fetchAccountData = async () => {
    try {
      const response = await fetch("/api/account")
      
      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch account data")
      }

      const accountData = await response.json()
      setData(accountData)
    } catch (err) {
      setError("Failed to load account data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  const handleMakeVIP = async (e: React.FormEvent) => {
    e.preventDefault()
    setVipLoading(true)
    setVipMessage("")

    try {
      const response = await fetch("/api/admin/make-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vipEmail })
      })

      const result = await response.json()

      if (response.ok) {
        setVipMessage(`✅ ${result.message}`)
        setVipEmail("") // Clear input
        setTimeout(() => setVipMessage(""), 5000) // Clear message after 5s
      } else {
        setVipMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setVipMessage("❌ Failed to grant VIP access. Please try again.")
    } finally {
      setVipLoading(false)
    }
  }

  const fetchPendingClaims = async () => {
    try {
      setClaimsLoading(true)
      const response = await fetch("/api/rewards/verify")
      
      if (response.ok) {
        const data = await response.json()
        setPendingClaims(data.claims)
      }
    } catch (error) {
      console.error("Failed to fetch pending claims:", error)
    } finally {
      setClaimsLoading(false)
    }
  }

  const handleVerifyClaim = async (claimId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch("/api/rewards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_id: claimId, action })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ ${result.message}`)
        // Refresh pending claims
        fetchPendingClaims()
      } else {
        alert(`❌ ${result.error}`)
      }
    } catch (error) {
      alert("❌ Failed to process claim. Please try again.")
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "admin":
        return "bg-purple-600 text-white border-[#00FF87]"
      case "vip":
        return "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#2E0032] border-[#FFD700]"
      case "premium":
      case "elite":
        return "bg-[#2E0032] text-[#00FF87] border-[#00FF87]"
      default:
        return "bg-[#2A2A2A] text-[#EEEEEE]"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const calculateUsagePercentage = () => {
    if (!data) return 0
    const { messages_used, messages_limit } = data.usage
    if (messages_limit === 0) return 0
    return Math.min((messages_used / messages_limit) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center pt-16">
          <p className="text-lg text-muted-foreground">Loading your account...</p>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center pt-16">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error || "Failed to load account data"}</p>
              <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const messagesRemaining = data.usage.messages_limit - data.usage.messages_used
  const usagePercentage = calculateUsagePercentage()

  return (
    <div className="flex min-h-screen flex-col bg-[#1E1E1E]">
      <Header />

      <main className="flex-1 px-4 pt-24 pb-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Your Account</h1>
              <p className="mt-2 text-lg text-[#EEEEEE]">
                Manage your ChatFPL.ai subscription, usage, and settings
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-[#1E1E1E]"
            >
              Logout
            </Button>
          </div>

          {/* User Summary */}
          <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">{data.user.name}</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">{data.user.email}</CardDescription>
                </div>
                <Badge className={`${getPlanBadgeColor(data.subscription.plan)} border px-4 py-2 text-lg font-semibold`}>
                  {data.subscription.plan}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#EEEEEE]">
                Member since {formatDate(data.user.created_at)}
              </p>
            </CardContent>
          </Card>

          {/* Grid Layout for Main Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Subscription Details */}
            <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#EEEEEE]">Current Plan</p>
                  <p className="text-2xl font-bold text-[#00FF87]">{data.subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#EEEEEE]">Status</p>
                  <Badge
                    className={
                      data.subscription.status === "active"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {data.subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#EEEEEE]">Renewal Date</p>
                  <p className="text-lg text-white">
                    {formatDate(data.subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#EEEEEE]">Messages Remaining</p>
                  <p className="text-3xl font-bold text-[#00FF87]">
                    {messagesRemaining.toLocaleString()}
                  </p>
                </div>
                {data.subscription.plan.toLowerCase() === "free" ? (
                  <Button
                    className="w-full bg-[#00FF87] text-[#1E1E1E] hover:bg-[#00FF87]/90"
                    onClick={() => router.push("/pricing")}
                  >
                    Upgrade to Premium
                  </Button>
                ) : (
                  <Button
                    className="w-full border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-[#1E1E1E]"
                    variant="outline"
                  >
                    Manage Billing
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white">Usage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#EEEEEE]">
                      {data.subscription.plan.toLowerCase() === "free" ? "Trial Messages" : "Monthly Messages"}
                    </p>
                    <p className="text-sm text-[#EEEEEE]">
                      {data.usage.messages_used} / {data.usage.messages_limit.toLocaleString()}
                    </p>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className="h-3 bg-[#1E1E1E]"
                  />
                </div>
                <div className="rounded-lg border border-[#00FF87]/20 bg-[#2E0032]/20 p-4">
                  <p className="text-center text-lg text-white">
                    You've used <span className="font-bold text-[#00FF87]">{data.usage.messages_used}</span> of{" "}
                    <span className="font-bold text-[#00FF87]">{data.usage.messages_limit.toLocaleString()}</span>{" "}
                    {data.subscription.plan.toLowerCase() === "free" ? "trial messages" : "messages this month"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start border-[#2A2A2A] text-white hover:border-[#00FF87]"
                  variant="outline"
                  disabled
                >
                  Change Password
                </Button>
                <Button
                  className="w-full justify-start border-[#2A2A2A] text-white hover:border-[#00FF87]"
                  variant="outline"
                  disabled
                >
                  Change Email
                </Button>
                <Button
                  className="w-full justify-start border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  variant="outline"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white">Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start border-[#2A2A2A] text-white hover:border-[#00FF87]"
                  variant="outline"
                  disabled
                >
                  Change Payment Method
                </Button>
                <Button
                  className="w-full justify-start border-[#2A2A2A] text-white hover:border-[#00FF87]"
                  variant="outline"
                  disabled
                >
                  Download Latest Invoice
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Shortcuts */}
          <Card className="border-[#00FF87]/30 bg-gradient-to-br from-[#2E0032]/50 to-[#2A2A2A]/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
              <Link href="/chat" className="w-full">
                <Button className="w-full bg-[#00FF87] text-[#1E1E1E] hover:bg-[#00FF87]/90">
                  Go to Chat
                </Button>
              </Link>
              {data.subscription.plan.toLowerCase() === "free" && (
                <Link href="/earn-messages" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#2E0032] hover:opacity-90">
                    Earn Messages
                  </Button>
                </Link>
              )}
              <Link href="/pricing" className="w-full">
                <Button
                  className="w-full border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-[#1E1E1E]"
                  variant="outline"
                >
                  Upgrade Plan
                </Button>
              </Link>
              <Link href="/contact" className="w-full">
                <Button
                  className="w-full border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-[#1E1E1E]"
                  variant="outline"
                >
                  Support
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Only Sections */}
          {data.user.role === "admin" && (
            <>
              {/* Make VIP Form */}
              <Card className="border-[#FFD700] bg-gradient-to-br from-[#2E0032]/50 to-[#1E1E1E]/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-[#FFD700]">👑 Grant VIP Access</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Give friends & family 100 free messages per month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleMakeVIP}>
                    <div>
                      <label htmlFor="vip-email" className="text-sm font-medium text-[#EEEEEE]">
                        User Email
                      </label>
                      <input
                        id="vip-email"
                        type="email"
                        placeholder="friend@example.com"
                        value={vipEmail}
                        onChange={(e) => setVipEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                        required
                        disabled={vipLoading}
                      />
                    </div>
                    {vipMessage && (
                      <div className={`rounded-lg p-3 text-sm ${vipMessage.includes("✅") ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {vipMessage}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#2E0032] hover:opacity-90"
                      disabled={vipLoading}
                    >
                      {vipLoading ? "Processing..." : "Make VIP"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Pending Reward Claims */}
              <Card className="border-[#00FF87] bg-gradient-to-br from-purple-900/50 to-[#2E0032]/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#00FF87]">🎁 Pending Reward Claims</CardTitle>
                      <CardDescription className="text-[#EEEEEE]">
                        Verify user social shares & referrals
                      </CardDescription>
                    </div>
                    {pendingClaims.length > 0 && (
                      <Badge className="bg-[#00FF87] text-[#2E0032]">
                        {pendingClaims.length} pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {claimsLoading ? (
                    <div className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-8 text-center">
                      <p className="text-lg text-[#EEEEEE]">Loading claims...</p>
                    </div>
                  ) : pendingClaims.length === 0 ? (
                    <div className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-8 text-center">
                      <p className="text-lg text-[#EEEEEE]">No pending claims</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Claims will appear here when users submit them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-white">{claim.user_name || claim.user_email}</p>
                              <p className="text-sm text-gray-400">{claim.user_email}</p>
                              <p className="mt-1 text-sm text-[#00FF87]">
                                {claim.action_type.charAt(0).toUpperCase() + claim.action_type.slice(1)} - {claim.reward_messages} messages
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(claim.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {claim.proof_url && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-400 mb-1">Proof URL:</p>
                              <a
                                href={claim.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#00FF87] hover:underline break-all"
                              >
                                {claim.proof_url}
                              </a>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 text-white hover:bg-green-700"
                              onClick={() => handleVerifyClaim(claim.id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              onClick={() => handleVerifyClaim(claim.id, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Analytics */}
              <Card className="border-[#00FF87] bg-gradient-to-br from-purple-900/50 to-[#2E0032]/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-[#00FF87]">📊 System Analytics</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    System overview and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-4">
                    <p className="text-sm text-[#EEEEEE]">Total Users</p>
                    <p className="text-3xl font-bold text-white">-</p>
                  </div>
                  <div className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-4">
                    <p className="text-sm text-[#EEEEEE]">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-white">-</p>
                  </div>
                  <div className="rounded-lg border border-[#00FF87]/30 bg-[#1E1E1E]/50 p-4">
                    <p className="text-sm text-[#EEEEEE]">Chat Sessions Today</p>
                    <p className="text-3xl font-bold text-white">-</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

