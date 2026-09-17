"use client"

import type { ReactNode } from "react"

type ChatToastSurfaceProps = {
  phase: "open" | "closing"
  children: ReactNode
  className?: string
  role?: "status" | "alert"
}

/**
 * Wrapper for chat notifications. On dismiss, uses smoky dissolve motion
 * (inspired by transitions.dev delete-with-smoky-dissolve, tuned for ChatFPL).
 */
export function ChatToastSurface({
  phase,
  children,
  className = "",
  role = "status",
}: ChatToastSurfaceProps) {
  return (
    <div
      role={role}
      data-phase={phase}
      className={`chatfpl-toast-surface relative overflow-hidden ${phase === "closing" ? "is-dissolving" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
