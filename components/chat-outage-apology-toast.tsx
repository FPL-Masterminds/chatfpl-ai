"use client"

import { useEffect, useState } from "react"
import { ChatToastDismiss } from "@/components/chat-toast-dismiss"
import { isOutageApologyWindowActive } from "@/lib/chat-outage-apology-window"

const EXIT_MS = 260
const DISMISS_KEY = "chatfpl-outage-apology-sep-2026-v2-dismissed"

/**
 * Full-width service banner on /chat during the 24h post-outage window.
 */
export function ChatOutageApologyToast() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<"open" | "closing">("open")

  useEffect(() => {
    if (!isOutageApologyWindowActive()) {
      setOpen(false)
      return
    }
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setOpen(false)
        return
      }
    } catch {
      /* private mode */
    }
    setOpen(true)
    setPhase("open")
  }, [])

  const dismiss = () => {
    if (phase !== "open") return
    setPhase("closing")
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setOpen(false), EXIT_MS)
  }

  if (!open || !isOutageApologyWindowActive()) return null

  return (
    <div
      role="status"
      data-phase={phase}
      className="shrink-0 border-b border-emerald-400/25 bg-emerald-950/90 px-3 py-2.5 sm:px-4"
      style={{
        opacity: phase === "closing" ? 0 : 1,
        transition: "opacity 260ms ease",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-start gap-2 sm:gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-wide text-black"
          style={{ background: "linear-gradient(135deg,#00FF87,#00FFFF)" }}
          aria-hidden
        >
          Live
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[13px] font-semibold text-white">We&apos;re back online</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-white/75">
            Sorry FPL chat was down for a few days. Full answers are working again as of 6pm on 17
            September 2026.
          </p>
        </div>
        <ChatToastDismiss onDismiss={dismiss} label="Dismiss service update" />
      </div>
    </div>
  )
}
