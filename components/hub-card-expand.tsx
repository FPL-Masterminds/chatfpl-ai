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
  const [open, setOpen]          = useState(false)
  const [visible, setVisible]    = useState(false)
  const [displayed, setDisplayed] = useState("")
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)

  // Step 1: mount the panel (open=true), then on next frame flip visible for CSS transition
  function handleOpen() {
    setOpen(true)
    setDisplayed("")
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }

  // Close: fade + slide out, then unmount after transition
  function handleClose() {
    setVisible(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeout(() => {
      setOpen(false)
      setDisplayed("")
    }, 320)
  }

  // Typewriter — starts after panel is fully faded in (300ms)
  useEffect(() => {
    if (!visible) return
    if (intervalRef.current) clearInterval(intervalRef.current)

    let i = 0
    const timer = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(intervalRef.current!)
      }, 10)
    }, 300)

    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [visible, text])

  return (
    <div className="mt-2.5">
      {/* Trigger pill */}
      {!open && (
        <button
          onClick={handleOpen}
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

      {/* Panel — always full height, animated via opacity + translateY only */}
      {open && (
        <div
          style={{
            opacity:    visible ? 1 : 0,
            transform:  visible ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <div
            className="rounded-xl p-4 text-sm leading-relaxed text-white"
            style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.12)" }}
          >
            {/* Typewriter text — min-height prevents layout shift while typing */}
            <p className="mb-5" style={{ minHeight: "5.5em" }}>
              {displayed}
              {displayed.length < text.length && (
                <span className="animate-pulse" style={{ color: "#00FF87" }}>|</span>
              )}
            </p>

            {/* CTA */}
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
              onClick={handleClose}
              className="mt-3 block text-[10px] font-semibold text-white hover:text-[#00FF87] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
