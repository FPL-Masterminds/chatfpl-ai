"use client"

import { useEffect, useState } from "react"
import type { ChatAlert } from "@/lib/chat-alerts"
import { CTA_ASK } from "@/lib/cta-copy"
import { ChatToastDismiss } from "@/components/chat-toast-dismiss"
import { ChatToastSurface } from "@/components/chat-toast-surface"
import { CHAT_TOAST_DISSOLVE_MS } from "@/lib/chat-toast-motion"
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
    }, CHAT_TOAST_DISSOLVE_MS)
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-end sm:inset-x-auto sm:right-4">
      <ChatToastSurface
        phase={phase}
        className="pointer-events-auto block w-[min(100%,22rem)] rounded-[1.25rem] border border-white/15 bg-black/80 p-0 text-left font-[inherit] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg,#00FF87,#00FFFF)" }}
        />
        <div className="flex items-start gap-0.5 py-2 pl-3.5 pr-1">
          <button
            type="button"
            onClick={() => {
              onAsk(current.prompt)
              dismiss()
            }}
            className="flex min-w-0 flex-1 items-start gap-3 py-1 pr-1 text-left touch-manipulation"
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
                {CTA_ASK}
              </span>
            </span>
          </button>
          <ChatToastDismiss onDismiss={dismiss} label="Dismiss alert" />
        </div>
      </ChatToastSurface>
    </div>
  )
}
