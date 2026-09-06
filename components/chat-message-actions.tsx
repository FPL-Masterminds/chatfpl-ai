"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy, Share2, ThumbsDown, ThumbsUp, Volume2 } from "lucide-react"
import { textForShare } from "@/lib/chat-share-text"
import { textForSpeech } from "@/lib/chat-speech-text"

type ChatMessageActionsProps = {
  messageId: string
  conversationId: string | null
  content: string
  userPrompt: string | null
  onReadAloud: (text: string) => void
  speaking: boolean
}

function ActionButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
      }`}
    >
      {children}
    </button>
  )
}

export function ChatMessageActions({
  messageId,
  conversationId,
  content,
  userPrompt,
  onReadAloud,
  speaking,
}: ChatMessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState<"positive" | "negative" | null>(null)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const ratingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ratingOpen) return
    const onDocClick = (event: MouseEvent) => {
      if (!ratingRef.current?.contains(event.target as Node)) {
        setRatingOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [ratingOpen])

  const shareText = textForShare(content)
  const speechText = textForSpeech(content)

  const handleCopy = useCallback(async () => {
    if (!shareText) return
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [shareText])

  const handleShare = useCallback(async () => {
    if (!shareText) return
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareText, title: "ChatFPL AI reply" })
        return
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return
    }
    await handleCopy()
  }, [shareText, handleCopy])

  const submitRating = useCallback(
    async (next: "positive" | "negative") => {
      if (ratingBusy) return
      setRatingBusy(true)
      setRatingError(null)
      try {
        const res = await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message_id: messageId,
            conversation_id: conversationId,
            rating: next,
            assistant_content: content,
            user_prompt: userPrompt,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setRatingError(typeof data.error === "string" ? data.error : "Could not save feedback")
          return
        }
        setRating(next)
        setRatingOpen(false)
      } catch {
        setRatingError("Could not save feedback")
      } finally {
        setRatingBusy(false)
      }
    },
    [ratingBusy, messageId, conversationId, content, userPrompt],
  )

  if (!content.trim()) return null

  const canRate = messageId !== "welcome"

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-white/[0.06] pt-3">
      <ActionButton label="Copy reply" onClick={() => void handleCopy()} active={copied}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </ActionButton>

      {canRate ? (
      <div className="relative" ref={ratingRef}>
        <ActionButton
          label="Rate response"
          onClick={() => setRatingOpen((open) => !open)}
          active={rating !== null || ratingOpen}
        >
          <span className="flex items-center gap-0.5">
            <ThumbsUp className={`h-3.5 w-3.5 ${rating === "positive" ? "text-[#00FF87]" : ""}`} />
            <ThumbsDown className={`h-3.5 w-3.5 ${rating === "negative" ? "text-red-300" : ""}`} />
          </span>
        </ActionButton>

        {ratingOpen ? (
          <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#111] py-1 shadow-xl">
            <button
              type="button"
              disabled={ratingBusy}
              onClick={() => void submitRating("positive")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <ThumbsUp className="h-4 w-4 shrink-0" />
              Good response
            </button>
            <button
              type="button"
              disabled={ratingBusy}
              onClick={() => void submitRating("negative")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <ThumbsDown className="h-4 w-4 shrink-0" />
              Bad response
            </button>
          </div>
        ) : null}
      </div>
      ) : null}

      <ActionButton label="Share reply" onClick={() => void handleShare()}>
        <Share2 className="h-4 w-4" />
      </ActionButton>

      {speechText ? (
        <ActionButton
          label="Read aloud"
          onClick={() => onReadAloud(speechText)}
          active={speaking}
        >
          <Volume2 className="h-4 w-4" />
        </ActionButton>
      ) : null}

      {rating === "positive" ? (
        <span className="ml-1 text-[10px] text-white/35">Thanks for the feedback</span>
      ) : null}
      {rating === "negative" ? (
        <span className="ml-1 text-[10px] text-white/35">Feedback recorded</span>
      ) : null}
      {ratingError ? <span className="ml-1 text-[10px] text-red-300/80">{ratingError}</span> : null}
    </div>
  )
}
