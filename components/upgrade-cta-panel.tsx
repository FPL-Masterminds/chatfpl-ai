"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

/**
 * The green-bordered call-to-action panel used at the bottom of every
 * programmatic pSEO page. Four variants:
 *
 *   Logged out       -> "Try ChatFPL AI for free"               -> /signup
 *   Free             -> "Upgrade to Premium - £7.99/month"       -> Stripe
 *   Premium (£7.99)  -> "Upgrade to Elite - £14.99/month"        -> Stripe
 *   Elite            -> "Ask ChatFPL AI"                         -> /chat
 *
 * The heading is always page-specific and passed in.  `subline` and
 * `chatQuery` are optional and useful for pages that already have a
 * smart context-aware CTA (individual compare / transfer-trends pages)
 * where we want to keep the tailored subline and pass a pre-filled
 * prompt into the chat for paid users.
 *
 * Both upgrades hit /api/stripe/create-checkout-session directly, which
 * already handles the "user already has an active sub" case with Stripe
 * proration - so a Premium → Elite click updates the subscription in
 * place rather than starting a fresh checkout.
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

type Plan = "unknown" | "free" | "premium" | "elite"

export interface UpgradeCTAPanelProps {
  heading: React.ReactNode
  /** Page-specific body copy. Overrides the state-based default subline. */
  subline?: React.ReactNode
  /** Pre-filled chat prompt. If set, paid users go to /chat?q=<query>. */
  chatQuery?: string
}

export function UpgradeCTAPanel({ heading, subline, chatQuery }: UpgradeCTAPanelProps) {
  const { status } = useSession()
  const [plan, setPlan] = useState<Plan>("unknown")
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Only hit /api/account once we know the user is authenticated. During SSR
  // and before hydration `status` is "loading" - we render the safe default
  // (the signup CTA) until we know better.
  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        const raw = (d?.subscription?.plan || "Free").toString().toLowerCase()
        setPlan(raw === "elite" ? "elite" : raw === "premium" ? "premium" : "free")
      })
      .catch(() => !cancelled && setPlan("free"))
    return () => {
      cancelled = true
    }
  }, [status])

  async function startCheckout(targetPlan: "Premium" | "Elite") {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
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

  const isLoggedIn = status === "authenticated"
  const chatHref = chatQuery ? `/chat?q=${encodeURIComponent(chatQuery)}` : "/chat"

  let defaultSubline: string
  let buttonNode: React.ReactNode

  if (isLoggedIn && plan === "elite") {
    defaultSubline = "Continue the conversation in the chat - your Elite plan covers it."
    buttonNode = (
      <Link href={chatHref} className={BUTTON_CLASS} style={BUTTON_STYLE}>
        <ShimmerAndArrow />
        Ask ChatFPL AI
      </Link>
    )
  } else if (isLoggedIn && plan === "premium") {
    defaultSubline =
      "Upgrade to Elite for 500 messages a month, priority AI and everything in Premium. Cancel anytime."
    buttonNode = (
      <button
        type="button"
        onClick={() => startCheckout("Elite")}
        disabled={checkoutLoading}
        className={BUTTON_CLASS}
        style={BUTTON_STYLE}
      >
        <ShimmerAndArrow />
        {checkoutLoading ? "Loading..." : "Upgrade to Elite - £14.99/month"}
      </button>
    )
  } else if (isLoggedIn && plan === "free") {
    defaultSubline =
      "Upgrade to Premium for 100 messages a month, live FPL data and dashboard access. Cancel anytime."
    buttonNode = (
      <button
        type="button"
        onClick={() => startCheckout("Premium")}
        disabled={checkoutLoading}
        className={BUTTON_CLASS}
        style={BUTTON_STYLE}
      >
        <ShimmerAndArrow />
        {checkoutLoading ? "Loading..." : "Upgrade to Premium - £7.99/month"}
      </button>
    )
  } else if (isLoggedIn) {
    // Session is confirmed but /api/account hasn't returned yet. Never fall
    // through to the /signup CTA in this state - it would misroute paying
    // users away from Stripe. Neutral chat link is safe for all tiers.
    defaultSubline = "Continue the conversation in the chat."
    buttonNode = (
      <Link href={chatHref} className={BUTTON_CLASS} style={BUTTON_STYLE}>
        <ShimmerAndArrow />
        Ask ChatFPL AI
      </Link>
    )
  } else {
    defaultSubline = "Get 20 free messages. No credit card required."
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
      <p className="text-sm text-white/70 mb-7">{subline ?? defaultSubline}</p>
      {buttonNode}
    </div>
  )
}
