"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

/**
 * The green-bordered call-to-action panel that appears at the bottom of every
 * programmatic pSEO page. Three variants:
 *
 *   Logged out       -> "Try ChatFPL AI for free"           -> /signup
 *   Logged in, Free  -> "Upgrade to Premium - £7.99/month"  -> Stripe checkout
 *   Logged in, paid  -> "Ask ChatFPL AI"                    -> /chat
 *
 * The heading is page-specific (e.g. "Want to know if Riccardo Calafiori fits
 * your specific squad?") and passed in as a prop. Everything below the heading
 * is state-aware.
 *
 * The upgrade CTA hits /api/stripe/create-checkout-session directly, matching
 * the flow used by the admin dashboard's upgrade card and the homepage
 * pricing slider - so a click here goes straight to Stripe.
 */

const PANEL_STYLE: React.CSSProperties = {
  border: "1px solid rgba(0,255,135,0.18)",
  borderLeft: "4px solid #00FF87",
  background: "rgba(0,255,135,0.04)",
}

const BUTTON_CLASS =
  "relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)] disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100"

const BUTTON_STYLE: React.CSSProperties = {
  background: "linear-gradient(to right,#00FF87,#00FFFF)",
}

function ShimmerAndArrow() {
  return (
    <>
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2.4s linear infinite",
        }}
      />
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </>
  )
}

export function UpgradeCTAPanel({ heading }: { heading: React.ReactNode }) {
  const { status } = useSession()
  const [plan, setPlan] = useState<"unknown" | "free" | "paid">("unknown")
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Only hit /api/account once we know the user is authenticated. During SSR
  // and before hydration `status` is "loading" - we render the safe default
  // (the free/signup CTA) until we know better.
  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        const raw = (d?.subscription?.plan || "Free").toString().toLowerCase()
        setPlan(raw === "premium" || raw === "elite" ? "paid" : "free")
      })
      .catch(() => !cancelled && setPlan("free"))
    return () => {
      cancelled = true
    }
  }, [status])

  async function startCheckout() {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "Premium" }),
      })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.url) {
        window.location.href = j.url as string
        return
      }
    } catch {
      // Fall through to reset button state so user can retry
    }
    setCheckoutLoading(false)
  }

  // Decide which of the three CTAs to render. Treat "loading" and
  // "unauthenticated" the same at the button level - the safest default
  // when we don't yet know is the signup CTA, which is what a logged-out
  // user should see.
  const isLoggedIn = status === "authenticated"
  const isFreePaid = isLoggedIn && plan === "free"
  const isPaidUser = isLoggedIn && plan === "paid"

  let subline: string
  let buttonNode: React.ReactNode

  if (isPaidUser) {
    subline = "Continue the conversation in the chat - your plan covers it."
    buttonNode = (
      <Link href="/chat" className={BUTTON_CLASS} style={BUTTON_STYLE}>
        <ShimmerAndArrow />
        Ask ChatFPL AI
      </Link>
    )
  } else if (isFreePaid) {
    subline =
      "Upgrade to Premium for 100 messages a month, live FPL data and dashboard access. Cancel anytime."
    buttonNode = (
      <button
        type="button"
        onClick={startCheckout}
        disabled={checkoutLoading}
        className={BUTTON_CLASS}
        style={BUTTON_STYLE}
      >
        <ShimmerAndArrow />
        {checkoutLoading ? "Loading..." : "Upgrade to Premium - £7.99/month"}
      </button>
    )
  } else {
    subline = "Get 20 free messages. No credit card required."
    buttonNode = (
      <Link href="/signup" className={BUTTON_CLASS} style={BUTTON_STYLE}>
        <ShimmerAndArrow />
        Try ChatFPL AI for free
      </Link>
    )
  }

  return (
    <div className="rounded-2xl px-8 py-10" style={PANEL_STYLE}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">
        ChatFPL AI
      </p>
      <h3 className="text-xl font-bold text-white mb-3 leading-tight">
        {heading}
      </h3>
      <p className="text-sm text-white/70 mb-7">{subline}</p>
      {buttonNode}
    </div>
  )
}
