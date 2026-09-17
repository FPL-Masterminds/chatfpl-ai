"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChatToastDismiss } from "@/components/chat-toast-dismiss"

const EXIT_MS = 260

function isUnlimited(limit: number): boolean {
  return limit >= 999999
}

function messagesRemaining(used: number, limit: number): number {
  return Math.max(0, limit - used)
}

export function ChatUsageToast({
  messagesUsed,
  messagesLimit,
  userPlan,
  ready,
  fplAlertsQueued,
}: {
  messagesUsed: number
  messagesLimit: number
  userPlan: string
  ready: boolean
  /** True when squad/FPL alert pills may show below this toast. */
  fplAlertsQueued: boolean
}) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<"open" | "closing">("open")

  useEffect(() => {
    if (ready) {
      setOpen(true)
      setPhase("open")
    }
  }, [ready])

  const dismiss = () => {
    if (phase !== "open") return
    setPhase("closing")
    window.setTimeout(() => setOpen(false), EXIT_MS)
  }

  if (!open) return null

  const unlimited = isUnlimited(messagesLimit)
  const remaining = unlimited ? null : messagesRemaining(messagesUsed, messagesLimit)
  const low = remaining !== null && remaining > 0 && remaining <= 3
  const empty = remaining === 0

  const title = unlimited
    ? "Unlimited messages this month"
    : empty
      ? "No messages left this month"
      : remaining === 1
        ? "1 message left this month"
        : `${remaining} messages left this month`

  const body = unlimited
    ? `Your ${userPlan} plan includes unlimited ChatFPL messages.`
    : empty
      ? "Upgrade your plan to keep chatting with live FPL data."
      : low
        ? `You have used ${messagesUsed} of ${messagesLimit} on your ${userPlan} plan.`
        : `${messagesUsed} of ${messagesLimit} used on your ${userPlan} plan.`

  const accent = empty ? "#f97316" : low ? "#fbbf24" : "#00FF87"

  const badgeLabel =
    unlimited ? "∞" : remaining !== null && remaining >= 100 ? "99+" : String(remaining ?? 0)
  const badgeTextClass = unlimited
    ? "text-[1.75rem] leading-none tracking-tight"
    : badgeLabel.length >= 2
      ? "text-xl leading-none tabular-nums"
      : "text-2xl leading-none tabular-nums"

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-30 flex justify-end sm:inset-x-auto sm:right-4 ${
        fplAlertsQueued ? "bottom-[7.25rem]" : "bottom-3"
      }`}
    >
      <div
        role="status"
        data-phase={phase}
        className="pointer-events-auto relative block w-[min(100%,22rem)] overflow-hidden rounded-[1.25rem] border border-white/15 bg-black/80 p-0 text-left shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        style={{
          fontFamily: "inherit",
          transform: phase === "closing" ? "translateY(10px)" : "translateY(0)",
          opacity: phase === "closing" ? 0 : 1,
          transition: "transform 260ms cubic-bezier(0.4,0,0.6,1), opacity 260ms cubic-bezier(0.4,0,0.6,1)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: empty
              ? "linear-gradient(90deg,#f97316,#fb923c)"
              : low
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : "linear-gradient(90deg,#00FF87,#00FFFF)",
          }}
        />
        <div className="flex items-start gap-0.5 py-2 pl-3.5 pr-1">
          <div className="flex min-w-0 flex-1 items-start gap-3 py-1 pr-1 text-left">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] font-black text-black ${badgeTextClass}`}
              style={{ background: `linear-gradient(135deg,${accent},#00FFFF)` }}
              aria-hidden
            >
              {badgeLabel}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-snug text-white">{title}</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-white/70">{body}</span>
              {empty ? (
                <Link
                  href="/admin"
                  onClick={dismiss}
                  className="mt-1.5 inline-block text-[11px] font-medium text-[#00FF87] hover:underline"
                >
                  Upgrade plan
                </Link>
              ) : (
                <span className="mt-1.5 block text-[11px] text-white/45">Resets at the start of each month.</span>
              )}
            </span>
          </div>
          <ChatToastDismiss onDismiss={dismiss} label="Dismiss message allowance notice" />
        </div>
      </div>
    </div>
  )
}
