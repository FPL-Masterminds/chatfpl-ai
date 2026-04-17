"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

interface HubCardExpandProps {
  slug: string
  gw: number | string
  text: string
  promptLabel: string
}

export function HubCardExpand({ slug, gw, text, promptLabel }: HubCardExpandProps) {
  const [open, setOpen]         = useState(false)
  const [displayed, setDisplayd] = useState("")
  const intervalRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (!open) {
      setDisplayd("")
      return
    }

    setDisplayd("")
    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      setDisplayd(text.slice(0, i))
      if (i >= text.length) clearInterval(intervalRef.current!)
    }, 10)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, text])

  return (
    <div className="mt-2.5">
      {/* Trigger button — always visible when closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative w-full overflow-hidden text-left rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,135,0.3)]"
          style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a" }}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s linear infinite",
            }}
          />
          <span className="relative">{promptLabel} →</span>
        </button>
      )}

      {/* Expanded panel — slides in */}
      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0 }}
      >
        <div
          className="rounded-xl p-4 text-sm leading-relaxed text-white"
          style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.12)" }}
        >
          {/* Typewriter text */}
          <p className="mb-5 min-h-[4em]">
            {displayed}
            {displayed.length < text.length && (
              <span className="animate-pulse text-[#00FF87]">|</span>
            )}
          </p>

          {/* CTA — shimmer gradient button */}
          <Link
            href="/chat"
            className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-5 py-2.5 font-bold text-xs text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,135,0.35)]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.4s linear infinite",
              }}
            />
            <span className="relative">Ask ChatFPL AI about your squad →</span>
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="mt-3 block text-[10px] font-semibold text-white hover:text-[#00FF87] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
