"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const WORD_GAP_MS = 42
const WORD_FADE_MS = 320

function splitWords(text: string): string[] {
  const parts = text.split(/(\s+)/)
  const words: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      if (words.length > 0) words[words.length - 1] += part
      continue
    }
    words.push(part)
  }
  return words.length > 0 ? words : [text]
}

interface StreamingTextProps {
  text: string
  /** When false, render full text immediately. */
  active?: boolean
  className?: string
  onComplete?: () => void
}

export function StreamingText({
  text,
  active = true,
  className,
  onComplete,
}: StreamingTextProps) {
  const words = useMemo(() => splitWords(text), [text])
  const [visibleCount, setVisibleCount] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current?.()
  }, [])

  useEffect(() => {
    completedRef.current = false
    setSkipped(false)

    if (!active || reducedMotion) {
      setVisibleCount(words.length)
      finish()
      return
    }

    setVisibleCount(0)
    let i = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      i += 1
      setVisibleCount(i)
      if (i >= words.length) {
        finish()
        return
      }
      timer = window.setTimeout(tick, WORD_GAP_MS)
    }

    timer = window.setTimeout(tick, WORD_GAP_MS)
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [active, reducedMotion, words, finish])

  useEffect(() => {
    if (skipped) finish()
  }, [skipped, finish])

  const showAll = !active || reducedMotion || skipped || visibleCount >= words.length
  const count = showAll ? words.length : visibleCount

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${index}-${word}`}
          className="inline"
          style={
            index < count
              ? {
                  opacity: 1,
                  filter: "blur(0)",
                  transition: `opacity ${WORD_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${WORD_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }
              : {
                  opacity: 0,
                  filter: "blur(1px)",
                  transition: `opacity ${WORD_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${WORD_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }
          }
        >
          {word}
        </span>
      ))}
      {!showAll && (
        <button
          type="button"
          onClick={() => {
            setSkipped(true)
            setVisibleCount(words.length)
          }}
          className="ml-2 text-[11px] font-medium text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
        >
          Skip
        </button>
      )}
    </span>
  )
}
