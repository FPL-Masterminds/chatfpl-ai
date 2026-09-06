"use client"

import type { CSSProperties } from "react"
import { Copy, Mic, Share2, ThumbsDown, ThumbsUp, Volume2 } from "lucide-react"

export const SHOWCASE_PROMPTS = [
  "Give me a differential captain option under 10% owned",
  "Should I use my wildcard now?",
]

export const RECENT_CHAT_TITLES = [
  "Who are the top three scori...",
  "Give me three midfield differ...",
  "Analyse my team",
  "Best captain this gameweek?",
  "Which defenders have the bes...",
  "Compare Haaland vs Fernandes",
  "Show me the top price risers",
  "Compare Mbeumo vs Watkins",
  "Who has the best fixtures?",
  "Wildcard options under £6m",
]

export const RECENT_CHAT_DAY_OFFSETS = [1, 2, 2, 3, 4, 5, 6, 7, 9, 10]

const SUGGESTION_GLOW_STYLE: CSSProperties = {
  padding: "1.5px",
  borderRadius: "9999px",
  background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
  backgroundSize: "200% 200%",
  animation: "glow_scroll 4s linear infinite",
}

export function formatRecentChatDate(daysAgo: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function ShowcaseRefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      style={{ transform: spinning ? "rotate(360deg)" : "rotate(0deg)", transition: "transform 0.5s ease" }}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

export function ShowcaseSuggestionPill({
  prompt,
  showRefresh,
  onRefresh,
  spinning,
}: {
  prompt: string
  showRefresh: boolean
  onRefresh: () => void
  spinning: boolean
}) {
  return (
    <div className="rounded-full" style={SUGGESTION_GLOW_STYLE}>
      <div className="flex items-stretch overflow-hidden rounded-full bg-black">
        <span className="min-w-0 flex-1 truncate px-3 py-1.5 text-[11px] md:text-xs font-medium text-center text-[#00FF87]">
          {prompt}
        </span>
        {showRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh suggestions"
            aria-label="Refresh suggestions"
            className="flex shrink-0 items-center border-l border-white/10 px-2.5 text-white/80 transition-opacity hover:opacity-80"
          >
            <ShowcaseRefreshIcon spinning={spinning} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ShowcaseVoicePills() {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 md:gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00FF87]/50 bg-[#00FF87]/10 px-2.5 py-1 text-[10px] font-medium text-[#00FF87] md:px-3 md:py-1.5 md:text-[11px]">
        <Volume2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
        Read replies
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-2.5 py-1 text-[10px] font-medium text-white md:px-3 md:py-1.5 md:text-[11px]">
        <Mic className="h-3 w-3 md:h-3.5 md:w-3.5" />
        Voice mode
      </span>
      <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-2.5 py-1 text-[10px] font-medium text-white md:px-3 md:py-1.5 md:text-[11px]">
        <span className="h-2 w-2 rounded-full bg-[#00FF87]" aria-hidden />
        Voicebox
      </span>
    </div>
  )
}

export function ShowcaseMessageActions() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-0.5 border-t border-white/[0.06] pt-2.5">
      {[
        { label: "Copy reply", icon: <Copy className="h-3.5 w-3.5" /> },
        {
          label: "Rate response",
          icon: (
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3" />
              <ThumbsDown className="h-3 w-3" />
            </span>
          ),
        },
        { label: "Share reply", icon: <Share2 className="h-3.5 w-3.5" /> },
        { label: "Read aloud", icon: <Volume2 className="h-3.5 w-3.5" /> },
      ].map((action) => (
        <span
          key={action.label}
          title={action.label}
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/45"
        >
          {action.icon}
        </span>
      ))}
    </div>
  )
}
