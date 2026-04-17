"use client"

import { useState } from "react"
import Link from "next/link"

interface HubCardExpandProps {
  playerName: string
  slug: string
  gw: number | string
  text: string
  promptLabel: string
}

export function HubCardExpand({ playerName, slug, gw, text, promptLabel }: HubCardExpandProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2.5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,135,0.3)]"
          style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a" }}
        >
          {promptLabel} →
        </button>
      ) : (
        <div
          className="rounded-xl p-4 text-sm leading-relaxed text-white/75"
          style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.12)" }}
        >
          <p className="mb-4">{text}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/fpl/${slug}`}
              className="rounded-full px-4 py-2 text-xs font-bold transition-all hover:shadow-[0_0_16px_rgba(0,255,135,0.3)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#0a0a0a" }}
            >
              Full {playerName} analysis →
            </Link>
            <Link
              href="/chat"
              className="rounded-full px-4 py-2 text-xs font-bold border transition-all hover:border-[#00FF87] hover:text-[#00FF87]"
              style={{ borderColor: "rgba(0,255,135,0.3)", color: "rgba(255,255,255,0.6)" }}
            >
              Ask ChatFPL AI about your squad →
            </Link>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
