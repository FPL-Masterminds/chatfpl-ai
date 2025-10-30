"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, MessageCircle, Star, Users, CheckCircle, Clock, XCircle } from "lucide-react"

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

export default function EarnMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState("")
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [reviewType, setReviewType] = useState<"written" | "xpost">("written")
  const [writtenReview, setWrittenReview] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewDescription, setReviewDescription] = useState("")
  const [xConsentGiven, setXConsentGiven] = useState(false)
  const [resultModal, setResultModal] = useState<{ show: boolean; success: boolean; message: string }>({ 
    show: false, 
    success: false, 
    message: "" 
  })

  useEffect(() => {
    fetchRewardStatus()
    fetchReferralLink()
  }, [])

  const fetchRewardStatus = async () => {
    try {
      const response = await fetch("/api/rewards/status")
      
      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (response.status === 403) {
        const data = await response.json()
        setError(data.error)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch reward status")
      }

      const data = await response.json()
      setUserData(data)
    } catch (err) {
      setError("Failed to load reward data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReferralLink = async () => {
    try {
      const response = await fetch("/api/referral/generate")
      if (response.ok) {
        const data = await response.json()
        setReferralLink(data.referralLink)
      }
    } catch (error) {
      console.error("Failed to fetch referral link:", error)
    }
  }

  const handleClaimReward = (rewardType: string) => {
    setClaimingReward(rewardType)
    setProofUrl("")
    setReviewType("written")
    setWrittenReview("")
    setReviewRating(5)
    setReviewDescription("")
    setXConsentGiven(false)
  }

  const submitClaim = async () => {
    if (!claimingReward) return

    // Special handling for review type
    if (claimingReward === "review") {
      if (reviewType === "written") {
        if (!writtenReview.trim()) {
          setResultModal({
            show: true,
            success: false,
            message: "Please write your review (max 280 characters)"
          })
          return
        }
        if (writtenReview.length > 280) {
          setResultModal({
            show: true,
            success: false,
            message: "Review must be 280 characters or less"
          })
          return
        }
      } else {
        // X post consent
        if (!proofUrl.trim()) {
          setResultModal({
            show: true,
            success: false,
            message: "Please provide the link to your X post"
          })
          return
        }
        if (!xConsentGiven) {
          setResultModal({
            show: true,
            success: false,
            message: "Please confirm consent to use your X post on the homepage"
          })
          return
        }
      }
    }

    // Validation for other reward types
    if (claimingReward !== "referral" && claimingReward !== "review" && !proofUrl.trim()) {
      setResultModal({
        show: true,
        success: false,
        message: "Please enter the URL to your post"
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: claimingReward,
          proof_url: claimingReward === "review" && reviewType === "written" 
            ? `WRITTEN_REVIEW: ${writtenReview}` 
            : proofUrl.trim() || null,
          metadata: claimingReward === "review" ? {
            reviewType,
            xConsent: reviewType === "xpost" ? xConsentGiven : false,
            rating: reviewType === "xpost" ? 5 : reviewRating,
            description: reviewDescription.trim() || "Subscriber",
            reviewText: reviewType === "written" ? writtenReview : null
          } : null
        })
      })

      const result = await response.json()

      if (response.ok) {
        setClaimingReward(null)
        setProofUrl("")
        setWrittenReview("")
        setReviewRating(5)
        setReviewDescription("")
        setXConsentGiven(false)
        setResultModal({
          show: true,
          success: true,
          message: result.message
        })
        // Refresh reward status
        fetchRewardStatus()
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
        message: "Failed to submit claim. Please try again."
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-600 text-white"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-600 text-white"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center pt-16">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[#1E1E1E]">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 pt-24">
          <Card className="w-full max-w-md border-red-600 bg-[#2A2A2A]/50">
            <CardHeader>
              <CardTitle className="text-red-400">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#EEEEEE]">{error}</p>
              <Button 
                className="mt-4 w-full bg-[#00FF87] text-[#1E1E1E] hover:bg-[#00FF87]/90"
                onClick={() => router.push("/")}
              >
                View Pricing Plans
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1E1E1E]">
      <Header />

      <main className="flex-1 px-4 pt-24 pb-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Gift className="h-16 w-16 text-[#00FF87]" />
            </div>
            <h1 className="text-4xl font-bold text-white">Earn Free Messages</h1>
            <p className="mt-2 text-lg text-[#EEEEEE]">
              Share ChatFPL with others and earn bonus messages!
            </p>
          </div>

          {/* Total Earned Banner */}
          <Card className="border-[#00FF87] bg-gradient-to-r from-[#2E0032] to-[#1E1E1E]">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-sm text-[#EEEEEE]">Total Messages Earned</p>
                <p className="text-5xl font-bold text-[#00FF87]">{userData?.totalEarned || 0} <span className="text-2xl text-gray-400">of 50</span></p>
                <p className="mt-2 text-xs text-gray-400">Lifetime cap ensures fair usage for all free users</p>
                <p className="mt-3 text-xs text-yellow-300">
                  ⚠️ Bonus messages expire on your renewal date - use them or lose them!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-white">Available Rewards</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* X (Twitter) */}
              <Card className="border-[#000000] bg-[#2A2A2A]/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <Badge className="bg-[#00FF87] text-[#2E0032]">+5 messages</Badge>
                  </div>
                  <CardTitle className="text-white">Post on X</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Share ChatFPL on X (Twitter) and earn 5 free messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-black text-white hover:bg-black/90"
                    onClick={() => handleClaimReward("twitter")}
                    disabled={!userData?.availableRewards.twitter}
                  >
                    {userData?.availableRewards.twitter ? "Claim Reward" : "Already Claimed"}
                  </Button>
                </CardContent>
              </Card>

              {/* Reddit */}
              <Card className="border-[#FF4500] bg-[#2A2A2A]/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <MessageCircle className="h-8 w-8 text-[#FF4500]" />
                    <Badge className="bg-[#00FF87] text-[#2E0032]">+5 messages</Badge>
                  </div>
                  <CardTitle className="text-white">Post on Reddit</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Share ChatFPL on Reddit and earn 5 free messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[#FF4500] text-white hover:bg-[#FF4500]/90"
                    onClick={() => handleClaimReward("reddit")}
                    disabled={!userData?.availableRewards.reddit}
                  >
                    {userData?.availableRewards.reddit ? "Claim Reward" : "Already Claimed"}
                  </Button>
                </CardContent>
              </Card>

              {/* Facebook */}
              <Card className="border-[#1877F2] bg-[#2A2A2A]/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <svg className="h-8 w-8 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <Badge className="bg-[#00FF87] text-[#2E0032]">+5 messages</Badge>
                  </div>
                  <CardTitle className="text-white">Post on Facebook</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Share ChatFPL on Facebook and earn 5 free messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
                    onClick={() => handleClaimReward("facebook")}
                    disabled={!userData?.availableRewards.facebook}
                  >
                    {userData?.availableRewards.facebook ? "Claim Reward" : "Already Claimed"}
                  </Button>
                </CardContent>
              </Card>

              {/* Review */}
              <Card className="border-[#FFD700] bg-[#2A2A2A]/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Star className="h-8 w-8 text-[#FFD700]" />
                    <Badge className="bg-[#00FF87] text-[#2E0032]">+5 or +10 messages</Badge>
                  </div>
                  <CardTitle className="text-white">Submit a Review</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Write a review (5 messages) or let us use your X post (10 messages!)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-[#FFD700] text-[#2E0032] hover:bg-[#FFD700]/90"
                    onClick={() => handleClaimReward("review")}
                    disabled={!userData?.availableRewards.review}
                  >
                    {userData?.availableRewards.review ? "Claim Reward" : "Already Claimed"}
                  </Button>
                </CardContent>
              </Card>

              {/* Referral */}
              <Card className="border-[#00FF87] bg-[#2A2A2A]/50 md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-[#00FF87]" />
                    <Badge className="bg-[#00FF87] text-[#2E0032]">+5 messages</Badge>
                  </div>
                  <CardTitle className="text-white">Refer a Friend</CardTitle>
                  <CardDescription className="text-[#EEEEEE]">
                    Invite friends who sign up and verify their email - earn 5 messages per referral! (Maximum 3 referrals)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-[#1E1E1E] p-3">
                    <p className="text-xs text-gray-400 mb-2">Your Referral Link</p>
                    <p className="text-sm text-[#00FF87] break-all">
                      {referralLink || "Loading..."}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-[#00FF87] text-[#2E0032] hover:bg-[#00FF87]/90"
                    onClick={() => {
                      if (referralLink) {
                        navigator.clipboard.writeText(referralLink)
                        setResultModal({
                          show: true,
                          success: true,
                          message: "Referral link copied to clipboard!"
                        })
                      }
                    }}
                    disabled={!referralLink}
                  >
                    Copy Referral Link
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Claimed Rewards History */}
          {userData && userData.claimedRewards.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-white">Your Claims</h2>
              <Card className="border-[#2A2A2A] bg-[#2A2A2A]/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {userData.claimedRewards.map((reward, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-[#1E1E1E] bg-[#1E1E1E] p-4"
                      >
                        <div>
                          <p className="font-semibold capitalize text-white">{reward.action_type}</p>
                          <p className="text-sm text-gray-400">
                            Claimed {new Date(reward.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(reward.status)}
                          <p className="mt-1 text-sm text-[#00FF87]">+{reward.reward_messages} messages</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Terms */}
          <Card className="border-[#2A2A2A] bg-[#2A2A2A]/30">
            <CardContent className="py-6">
              <h3 className="mb-2 font-semibold text-white">Terms & Conditions</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Social rewards (X, Reddit, Facebook) can only be claimed once per account (5 messages each)</li>
                <li>• Review reward can be claimed once per account (5 or 10 messages depending on type)</li>
                <li>• Referral rewards: maximum 3 referrals per account (5 messages each)</li>
                <li>• Email verification required before claiming rewards</li>
                <li>• Social shares and reviews require admin verification (allow 24-48 hours)</li>
                <li>• Referral rewards granted automatically after referred user verifies email</li>
                <li>• Lifetime cap: 50 bonus messages total per account</li>
                <li>• <span className="font-semibold text-yellow-300">⚠️ Bonus messages expire on your renewal date</span> - use them or lose them!</li>
                <li>• Rewards only available for Free tier users</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Claim Reward Modal */}
      {claimingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <Card className="w-full max-w-md border-[#00FF87] bg-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white">
                Claim {claimingReward.charAt(0).toUpperCase() + claimingReward.slice(1)} Reward
              </CardTitle>
              <CardDescription className="text-[#EEEEEE]">
                {claimingReward === "referral"
                  ? "Your referral will be tracked automatically when your friend signs up."
                  : claimingReward === "review"
                  ? "Choose how you want to submit your review"
                  : claimingReward === "twitter"
                  ? "Paste the URL to your X post"
                  : claimingReward === "reddit"
                  ? "Paste the URL to your Reddit post"
                  : claimingReward === "facebook"
                  ? "Paste the URL to your Facebook post"
                  : "Paste the URL to your post to claim your reward."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review Type Selection */}
              {claimingReward === "review" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={reviewType === "written" ? "default" : "outline"}
                      className={reviewType === "written" ? "flex-1 bg-[#FFD700] text-[#2E0032]" : "flex-1"}
                      onClick={() => setReviewType("written")}
                    >
                      Write Review (5 msgs)
                    </Button>
                    <Button
                      type="button"
                      variant={reviewType === "xpost" ? "default" : "outline"}
                      className={reviewType === "xpost" ? "flex-1 bg-[#00FF87] text-[#2E0032]" : "flex-1"}
                      onClick={() => setReviewType("xpost")}
                    >
                      Use X Post (10 msgs)
                    </Button>
                  </div>

                  {reviewType === "written" ? (
                    <div className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <label className="text-sm font-medium text-[#EEEEEE] mb-2 block">
                          Rating *
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-3xl transition-all hover:scale-110"
                              disabled={submitting}
                            >
                              {star <= reviewRating ? (
                                <span className="text-[#FFD700]">★</span>
                              ) : (
                                <span className="text-gray-600">☆</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description/Role */}
                      <div>
                        <label htmlFor="review-description" className="text-sm font-medium text-[#EEEEEE]">
                          Description (optional)
                        </label>
                        <input
                          id="review-description"
                          type="text"
                          placeholder="e.g., FPL Manager, Premium Subscriber (defaults to 'Subscriber')"
                          value={reviewDescription}
                          onChange={(e) => setReviewDescription(e.target.value)}
                          maxLength={50}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
                          disabled={submitting}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Will default to "Subscriber" if left blank
                        </p>
                      </div>

                      {/* Review Text */}
                      <div>
                        <label htmlFor="written-review" className="text-sm font-medium text-[#EEEEEE]">
                          Your Review (max 280 chars) *
                        </label>
                        <textarea
                          id="written-review"
                          placeholder="Share your experience with ChatFPL..."
                          value={writtenReview}
                          onChange={(e) => setWrittenReview(e.target.value)}
                          maxLength={280}
                          rows={4}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
                          disabled={submitting}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          {writtenReview.length}/280 characters • May appear on homepage
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Description/Role */}
                      <div>
                        <label htmlFor="xpost-description" className="text-sm font-medium text-[#EEEEEE]">
                          Description (optional)
                        </label>
                        <input
                          id="xpost-description"
                          type="text"
                          placeholder="e.g., FPL Manager, Premium Subscriber (defaults to 'Subscriber')"
                          value={reviewDescription}
                          onChange={(e) => setReviewDescription(e.target.value)}
                          maxLength={50}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
                          disabled={submitting}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Will default to "Subscriber" if left blank
                        </p>
                      </div>

                      {/* X Post URL */}
                      <div>
                        <label htmlFor="x-post-url" className="text-sm font-medium text-[#EEEEEE]">
                          X Post URL *
                        </label>
                        <input
                          id="x-post-url"
                          type="url"
                          placeholder="https://x.com/yourpost..."
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
                          disabled={submitting}
                        />
                      </div>

                      {/* Rating Display */}
                      <div className="rounded-lg bg-[#1E1E1E] p-3">
                        <p className="text-xs text-gray-400 mb-1">Rating (auto-set for X posts)</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-xl text-[#FFD700]">★</span>
                          ))}
                        </div>
                      </div>

                      {/* Consent Checkbox */}
                      <div className="flex items-start gap-2 rounded-lg bg-[#1E1E1E] p-3">
                        <input
                          type="checkbox"
                          id="x-consent"
                          checked={xConsentGiven}
                          onChange={(e) => setXConsentGiven(e.target.checked)}
                          className="mt-1"
                          disabled={submitting}
                        />
                        <label htmlFor="x-consent" className="text-sm text-[#EEEEEE]">
                          I consent to ChatFPL using my X post content and profile photo on the homepage testimonials (10 messages reward)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard URL Input for Social Posts */}
              {claimingReward !== "referral" && claimingReward !== "review" && (
                <div>
                  <label htmlFor="proof-url" className="text-sm font-medium text-[#EEEEEE]">
                    Post URL *
                  </label>
                  <input
                    id="proof-url"
                    type="url"
                    placeholder={
                      claimingReward === "twitter" ? "https://x.com/yourpost..." :
                      claimingReward === "reddit" ? "https://reddit.com/r/.../comments/..." :
                      claimingReward === "facebook" ? "https://facebook.com/..." :
                      "https://..."
                    }
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    We'll verify your post within 24-48 hours
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#00FF87] text-[#2E0032] hover:bg-[#00FF87]/90"
                  onClick={submitClaim}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Claim"}
                </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    onClick={() => {
                      setClaimingReward(null)
                      setProofUrl("")
                      setWrittenReview("")
                      setReviewRating(5)
                      setReviewDescription("")
                      setXConsentGiven(false)
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <Card className={`w-full max-w-md ${resultModal.success ? 'border-[#00FF87]' : 'border-red-600'} bg-[#2A2A2A]`}>
            <CardHeader>
              <CardTitle className={resultModal.success ? 'text-[#00FF87]' : 'text-red-400'}>
                {resultModal.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Success
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    Error
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#EEEEEE]">{resultModal.message}</p>
              <Button
                className="w-full bg-[#00FF87] text-[#2E0032] hover:bg-[#00FF87]/90"
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

