"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"

interface HubCardExpandProps {
  slug: string
  gw: number | string
  text: string
  promptLabel: string
}

export function HubCardExpand({ slug, gw, text, promptLabel }: HubCardExpandProps) {
  const [open, setOpen]           = useState(false)
  const [displayed, setDisplayed] = useState("")
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleOpen() {
    setOpen(true)
    setDisplayed("")
  }

  function handleClose() {
    setOpen(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayed("")
  }

  // Typewriter starts after panel spring settles (~350ms)
  useEffect(() => {
    if (!open) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    let i = 0
    const timer = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(intervalRef.current!)
      }, 10)
    }, 350)
    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, text])

  return (
    <div className="mt-2.5">
      {/* Trigger pill */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.28, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
            onClick={handleOpen}
            className="relative w-full overflow-hidden text-left rounded-full px-4 py-2 text-xs font-semibold hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,135,0.3)] transition-shadow"
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
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1,  transition: { type: "spring", stiffness: 260, damping: 30 } }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.28, ease: "easeInOut" } }}
            className="relative rounded-xl p-4 text-sm leading-relaxed text-white"
            style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.12)" }}
          >
            {/* Ghost text locks height — typewriter sits on top */}
            <div className="relative mb-5">
              {/* invisible full text — establishes container height immediately */}
              <p className="invisible select-none" aria-hidden="true">{text}</p>
              {/* typewriter layer */}
              <p className="absolute inset-0">
                {displayed}
                {displayed.length < text.length && (
                  <span className="animate-pulse" style={{ color: "#00FF87" }}>|</span>
                )}
              </p>
            </div>

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

            {/* Close button — absolutely positioned bottom-right with padding */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute bottom-4 right-4 flex items-center justify-center rounded-full font-bold text-[13px] text-black transition-transform hover:scale-110"
              style={{
                width: 28,
                height: 28,
                background: "linear-gradient(135deg,#00FF87,#00FFFF)",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
