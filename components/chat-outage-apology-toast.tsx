"use client"

import { useEffect, useState } from "react"
import { ChatToastDismiss } from "@/components/chat-toast-dismiss"
import { isOutageApologyWindowActive } from "@/lib/chat-outage-apology-window"
import { chatToastBottomClass } from "@/lib/chat-toast-stack"

const EXIT_MS = 260
const DISMISS_KEY = "chatfpl-outage-apology-sep-2026-dismissed"

export function ChatOutageApologyToast({
  usageToastVisible,
  fplAlertsQueued,
}: {
  usageToastVisible: boolean
  fplAlertsQueued: boolean
}) {
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

  let stackIndex = 0
  if (usageToastVisible) stackIndex += 1
  if (fplAlertsQueued) stackIndex += 1

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-[35] flex justify-end sm:inset-x-auto sm:right-4 ${chatToastBottomClass(stackIndex)}`}
    >
      <div
        role="status"
        data-phase={phase}
        className="pointer-events-auto relative block w-[min(100%,22rem)] overflow-hidden rounded-[1.25rem] border border-white/15 bg-black/80 p-0 text-left shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        style={{
          fontFamily: "inherit",
          transform: phase === "closing" ? "translateY(10px)" : "translateY(0)",
          opacity: phase === "closing" ? 0 : 1,
          transition:
            "transform 260ms cubic-bezier(0.4,0,0.6,1), opacity 260ms cubic-bezier(0.4,0,0.6,1)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg,#00FF87,#00FFFF)" }}
        />
        <div className="flex items-start gap-0.5 py-2 pl-3.5 pr-1">
          <div className="flex min-w-0 flex-1 items-start gap-3 py-1 pr-1 text-left">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[10px] font-black uppercase tracking-wide text-black"
              style={{ background: "linear-gradient(135deg,#00FF87,#00FFFF)" }}
              aria-hidden
            >
              Live
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-snug text-white">
                We&apos;re back online
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-white/70">
                Sorry FPL chat was down for a few days. Full answers are working again as of 6pm on
                17 September 2026.
              </span>
            </span>
          </div>
          <ChatToastDismiss onDismiss={dismiss} label="Dismiss service update" />
        </div>
      </div>
    </div>
  )
}
