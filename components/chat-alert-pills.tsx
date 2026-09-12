"use client"

import { useEffect, useState } from "react"
import type { ChatAlert } from "@/lib/chat-alerts"

const EXIT_MS = 260
const DISMISS_KEY = "chatfpl-alert-dismissed"

function dismissedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function persistDismissed(ids: Set<string>) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]))
  } catch {
    /* ignore quota / private mode */
  }
}

function AlertAvatar({ alert }: { alert: ChatAlert }) {
  if (alert.avatar.kind === "player" && alert.avatar.photoUrl) {
    return (
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-black/40 ring-1 ring-white/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={alert.avatar.photoUrl}
          alt={alert.avatar.name}
          className="h-full w-full object-cover object-top"
        />
      </span>
    )
  }

  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[11px] font-black text-black"
      style={{ background: "linear-gradient(135deg,#00FF87,#00FFFF)" }}
    >
      CF
    </span>
  )
}

export function ChatAlertPills({
  alerts,
  onAsk,
}: {
  alerts: ChatAlert[]
  onAsk: (prompt: string) => void
}) {
  const [queue, setQueue] = useState<ChatAlert[]>([])
  const [phase, setPhase] = useState<"open" | "closing">("open")

  useEffect(() => {
    const gone = dismissedSet()
    setQueue(alerts.filter((alert) => !gone.has(alert.id)))
    setPhase("open")
  }, [alerts])

  const current = queue[0]
  if (!current) return null

  const dismiss = () => {
    if (phase !== "open") return
    setPhase("closing")
    window.setTimeout(() => {
      const gone = dismissedSet()
      gone.add(current.id)
      persistDismissed(gone)
      setQueue((prev) => prev.slice(1))
      setPhase("open")
    }, EXIT_MS)
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-end sm:inset-x-auto sm:right-4">
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
          style={{ background: "linear-gradient(90deg,#00FF87,#00FFFF)" }}
        />
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss alert"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            onAsk(current.prompt)
            dismiss()
          }}
          className="flex w-full items-start gap-3 px-3.5 py-3 pr-10 text-left"
        >
          <AlertAvatar alert={current} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-white">
              {current.title}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-white/70">
              {current.body}
            </span>
            <span className="mt-1.5 block text-[11px] font-medium text-[#00FF87]">
              Ask ChatFPL
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
