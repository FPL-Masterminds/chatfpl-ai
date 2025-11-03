"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"account" | "rewards" | "admin">("account")
  const [vipEmail, setVipEmail] = useState("")
  const [vipLoading, setVipLoading] = useState(false)
  const [vipMessage, setVipMessage] = useState("")
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [resultModal, setResultModal] = useState<{ show: boolean; success: boolean; message: string }>({ 
    show: false, 
    success: false, 
    message: "" 
  })
  const [billingLoading, setBillingLoading] = useState(false)
  const [cancellationDate, setCancellationDate] = useState<string | null>(null)

  useEffect(() => {
    fetchAccountData()
  }, [])

  useEffect(() => {
    // If user is admin, fetch pending claims and analytics
    if (data?.user.role === "admin") {
      fetchPendingClaims()
      fetchAnalytics()
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

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch("/api/admin/analytics")
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true)
      
      // Open Stripe Customer Portal for cancellation
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      })

      const result = await response.json()

      if (response.ok && result.url) {
        // Open portal in new window
        window.open(result.url, '_blank')
        
        // Refresh account data after a short delay to catch any changes
        setTimeout(() => {
          fetchAccountData()
        }, 2000)
      } else {
        setResultModal({
          show: true,
          success: false,
          message: result.error || "Failed to open billing portal"
        })
      }
    } catch (error) {
      setResultModal({
        show: true,
        success: false,
        message: "An error occurred. Please try again."
      })
    } finally {
      setBillingLoading(false)
    }
  }

  const handleVerifyClaim = async (claimId: string, action: "approve" | "reject", displayOnHomepage: boolean = false) => {
    try {
      const response = await fetch("/api/rewards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_id: claimId, action, displayOnHomepage })
      })

      const result = await response.json()

      if (response.ok) {
        setResultModal({
          show: true,
          success: true,
          message: result.message
        })
        // Refresh pending claims
        fetchPendingClaims()
      } else {
        setResultModal({
          show: true,
          success: false,
          message: result.error
        })
      }
    } catch (error) {
      setResultModal({
        show: true,
        success: false,
        message: "Failed to process claim. Please try again."
      })
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
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center pt-16">
          <p className="text-lg text-gray-600">Loading your account...</p>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center pt-16">
          <Card className="w-full max-w-md border-red-600 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{error || "Failed to load account data"}</p>
              <Button className="mt-4 w-full bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold" onClick={() => router.push("/login")}>
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
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 px-4 pt-24 pb-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Account Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your ChatFPL.ai subscription, usage, and settings
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "account"
                  ? "border-b-2 border-[#00FF87] text-[#00FF87]"
                  : "text-gray-600 hover:text-[#00FF87]"
              }`}
            >
              My Account
            </button>
            {data.user.role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("rewards")}
                  className={`relative px-6 py-3 text-sm font-semibold transition-all ${
                    activeTab === "rewards"
                      ? "border-b-2 border-[#00FF87] text-[#00FF87]"
                      : "text-gray-600 hover:text-[#00FF87]"
                  }`}
                >
                  Reward Management
                  {pendingClaims.length > 0 && (
                    <span className="ml-2 rounded-full bg-[#00FF87] px-2 py-0.5 text-xs font-bold text-[#2E0032]">
                      {pendingClaims.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-6 py-3 text-sm font-semibold transition-all ${
                    activeTab === "admin"
                      ? "border-b-2 border-[#00FF87] text-[#00FF87]"
                      : "text-gray-600 hover:text-[#00FF87]"
                  }`}
                >
                  Administration
                </button>
              </>
            )}
          </div>

          {/* Account Tab */}
          {activeTab === "account" && (
            <>
              {/* User Summary */}
              <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900">{data.user.name}</CardTitle>
                  <CardDescription className="text-gray-600">{data.user.email}</CardDescription>
                  <p className="mt-2 text-sm text-gray-600">
                    Member since {formatDate(data.user.created_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Navigation Shortcuts */}
          <Card className="border-[#00FF87]/30 bg-gradient-to-br from-[#00FF87]/5 to-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link href="/chat" className="w-full">
                <Button className="w-full bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold">
                  ChatFPL AI
                </Button>
              </Link>
              
              <Link href="/contact" className="w-full">
                <Button
                  className="w-full border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-gray-900 font-semibold"
                  variant="outline"
                >
                  Support
                </Button>
              </Link>
              
              {data.subscription.plan.toLowerCase() !== "free" && (
                <Button
                  className="w-full bg-[#2E0032] text-[#00FF87] hover:bg-[#2E0032]/90 font-semibold"
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                >
                  {billingLoading ? "Loading..." : "Manage Subscription"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Grid Layout for Main Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Subscription Details */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Plan</p>
                  <p className="text-2xl font-bold text-[#00FF87]">{data.subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
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
                
                {data.subscription.cancel_at_period_end && data.subscription.current_period_end && (
                  <div className="rounded-lg border border-yellow-400 bg-yellow-50 p-3">
                    <p className="text-sm font-semibold text-yellow-900">
                      ⚠️ Subscription Cancelled
                    </p>
                    <p className="mt-1 text-xs text-yellow-800">
                      Your subscription will end on {formatDate(data.subscription.current_period_end)}. You will retain access until this date, and your billing will not be renewed.
                    </p>
                  </div>
                )}
                {data.subscription.plan.toLowerCase() !== "free" && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Renewal Date</p>
                    <p className="text-lg text-gray-900">
                      {data.subscription.current_period_end ? formatDate(data.subscription.current_period_end) : "Not available"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages Remaining</p>
                  <p className="text-3xl font-bold text-[#00FF87]">
                    {messagesRemaining.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Usage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">
                      {data.subscription.plan.toLowerCase() === "free" ? "Trial Messages" : "Monthly Messages"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.usage.messages_used} / {data.usage.messages_limit.toLocaleString()}
                    </p>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className="h-3 bg-gray-100"
                  />
                </div>
                <div className="rounded-lg border border-[#00FF87]/30 bg-[#00FF87]/5 p-4">
                  <p className="text-center text-lg text-gray-900">
                    You've used <span className="font-bold text-[#00FF87]">{data.usage.messages_used}</span> of{" "}
                    <span className="font-bold text-[#00FF87]">{data.usage.messages_limit.toLocaleString()}</span>{" "}
                    {data.subscription.plan.toLowerCase() === "free" ? "trial messages" : "messages this month"}
                  </p>
                </div>
                {data.subscription.plan.toLowerCase() === "free" && data.usage.messages_limit > 5 && (
                  <div className="rounded-lg border border-yellow-400 bg-yellow-50 p-3">
                    <p className="text-center text-xs text-yellow-900">
                      ⚠️ <span className="font-semibold">
                        Bonus messages expire on {data.subscription.current_period_end ? formatDate(data.subscription.current_period_end) : "30 days from first bonus"}
                      </span>
                    </p>
                    <p className="mt-1 text-center text-xs text-yellow-800">
                      Use them or lose them! Your 5 trial messages never reset.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Earn Bonus Messages Section */}
          <Card className="border-[#00FF87]/30 bg-gradient-to-br from-[#00FF87]/5 to-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">🎁 Earn Bonus Messages</CardTitle>
              <CardDescription className="text-gray-600">
                Share ChatFPL AI and earn extra messages!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Twitter/X Share */}
                <Link href="/earn-messages" className="block">
                  <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#00FF87] hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="h-8 w-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <p className="font-semibold text-gray-900">Share on X</p>
                      </div>
                      <Badge className="bg-[#00FF87] text-gray-900 font-semibold">+5 msgs</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Post about ChatFPL AI on X (Twitter)</p>
                  </div>
                </Link>

                {/* Facebook Share */}
                <Link href="/earn-messages" className="block">
                  <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#00FF87] hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="h-8 w-8 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <p className="font-semibold text-gray-900">Share on Facebook</p>
                      </div>
                      <Badge className="bg-[#00FF87] text-gray-900 font-semibold">+5 msgs</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Share ChatFPL AI with your friends</p>
                  </div>
                </Link>

                {/* Reddit Share */}
                <Link href="/earn-messages" className="block">
                  <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#00FF87] hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image 
                          src="/Reddit.png"
                          alt="Reddit"
                          width={32}
                          height={32}
                          className="h-8 w-8"
                        />
                        <p className="font-semibold text-gray-900">Share on Reddit</p>
                      </div>
                      <Badge className="bg-[#00FF87] text-gray-900 font-semibold">+5 msgs</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Post to FPL communities</p>
                  </div>
                </Link>

                {/* Leave a Review */}
                <Link href="/earn-messages" className="block">
                  <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#2E0032] hover:shadow-md">
                    <div className="mb-2 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-8 w-8"
                        fill="#D4AF37"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <p className="font-semibold text-gray-900">Leave a Review</p>
                    </div>
                    <p className="text-sm text-gray-600">Write a review and get featured</p>
                  </div>
                </Link>
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-center text-sm text-blue-900">
                  💡 <span className="font-semibold">Pro Tip:</span> Complete all social sharing tasks to earn bonus messages!
                </p>
              </div>
            </CardContent>
          </Card>
            </>
          )}

          {/* Rewards Management Tab */}
          {activeTab === "rewards" && data.user.role === "admin" && (
            <>
              {/* Pending Reward Claims */}
              <Card className="border-[#00FF87] bg-gradient-to-br from-purple-50 to-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#00FF87]">🎁 Pending Reward Claims</CardTitle>
                      <CardDescription className="text-gray-600">
                        Verify user social shares & referrals
                      </CardDescription>
                    </div>
                    {pendingClaims.length > 0 && (
                      <Badge className="bg-[#00FF87] text-gray-900 font-semibold">
                        {pendingClaims.length} pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {claimsLoading ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                      <p className="text-lg text-gray-600">Loading claims...</p>
                    </div>
                  ) : pendingClaims.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                      <p className="text-lg text-gray-900">No pending claims</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Claims will appear here when users submit them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{claim.user_name || claim.user_email}</p>
                              <p className="text-sm text-gray-600">{claim.user_email}</p>
                              <p className="mt-1 text-sm text-[#00FF87] font-semibold">
                                {claim.action_type.charAt(0).toUpperCase() + claim.action_type.slice(1)} - {claim.reward_messages} messages
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(claim.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Review Preview for Review Type Claims */}
                          {claim.action_type === "review" && claim.metadata && (
                            <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                              <p className="text-xs font-semibold uppercase text-yellow-700 mb-2">Review Preview</p>
                              
                              {/* Star Rating */}
                              <div className="mb-2 flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={`text-lg ${star <= (claim.metadata?.rating || 5) ? 'text-[#FFD700]' : 'text-gray-400'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>

                              {/* Description */}
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                {claim.metadata.description || "Subscriber"}
                              </p>

                              {/* Review Text */}
                              {claim.metadata.reviewText && (
                                <p className="text-sm text-gray-700 italic">
                                  "{claim.metadata.reviewText}"
                                </p>
                              )}

                              {/* Review Type Badge */}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={claim.metadata.reviewType === 'xpost' ? 'bg-black text-white' : 'bg-[#FFD700] text-gray-900'}>
                                  {claim.metadata.reviewType === 'xpost' ? 'X Post' : 'Written Review'}
                                </Badge>
                                {claim.metadata.xConsent && (
                                  <Badge className="bg-green-600 text-white">
                                    Homepage Consent Given
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {claim.proof_url && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Proof URL:</p>
                              <a
                                href={claim.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#00FF87] hover:underline break-all font-medium"
                              >
                                {claim.proof_url}
                              </a>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {claim.action_type === "review" ? (
                              <>
                                <Button
                                  size="sm"
                                  className="w-full bg-[#FFD700] text-[#2E0032] hover:bg-[#FFD700]/90 font-semibold"
                                  onClick={() => handleVerifyClaim(claim.id, "approve", true)}
                                >
                                  ⭐ Approve & Add to Homepage
                                </Button>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                    onClick={() => handleVerifyClaim(claim.id, "approve", false)}
                                  >
                                    Approve Only
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
                              </>
                            ) : (
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
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Administration Tab */}
          {activeTab === "admin" && data.user.role === "admin" && (
            <>
              {/* Make VIP Form */}
              <Card className="border-yellow-400 bg-gradient-to-br from-yellow-50 to-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-yellow-600">👑 Grant VIP Access</CardTitle>
                  <CardDescription className="text-gray-600">
                    Give friends & family 100 free messages per month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleMakeVIP}>
                    <div>
                      <label htmlFor="vip-email" className="text-sm font-medium text-gray-700">
                        User Email
                      </label>
                      <input
                        id="vip-email"
                        type="email"
                        placeholder="friend@example.com"
                        value={vipEmail}
                        onChange={(e) => setVipEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                        required
                        disabled={vipLoading}
                      />
                    </div>
                    {vipMessage && (
                      <div className={`rounded-lg p-3 text-sm ${vipMessage.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {vipMessage}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-gray-900 hover:opacity-90 font-semibold"
                      disabled={vipLoading}
                    >
                      {vipLoading ? "Processing..." : "Make VIP"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* System Analytics */}
              <Card className="border-[#00FF87] bg-gradient-to-br from-green-50 to-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-[#00FF87]">📊 System Analytics</CardTitle>
                  <CardDescription className="text-gray-600">
                    Real-time system metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analyticsLoading ? "..." : analytics?.totalUsers.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analyticsLoading ? "..." : analytics?.activeSubscriptions.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Messages Today</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analyticsLoading ? "..." : analytics?.messagesToday.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">All Time Messages</p>
                    <p className="text-3xl font-bold text-[#00FF87]">
                      {analyticsLoading ? "..." : analytics?.allTimeMessages.toLocaleString() || "0"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Result Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className={`w-full max-w-md ${resultModal.success ? 'border-[#00FF87]' : 'border-red-600'} bg-white shadow-2xl`}>
            <CardHeader>
              <CardTitle className={resultModal.success ? 'text-[#00FF87]' : 'text-red-600'}>
                {resultModal.success ? (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Success
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Error
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{resultModal.message}</p>
              <Button
                className="w-full bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                onClick={() => setResultModal({ show: false, success: false, message: "" })}
              >
                OK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

