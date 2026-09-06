"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  playVoiceboxBlob,
  probeVoicebox,
  synthesizeVoiceboxSpeech,
  type VoiceboxConnectionStatus,
} from "@/lib/voicebox-client"

export function useVoicebox(enabled: boolean) {
  const [status, setStatus] = useState<VoiceboxConnectionStatus>("unknown")
  const [speaking, setSpeaking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus("unknown")
      return
    }

    let cancelled = false

    const check = async () => {
      setStatus("checking")
      const next = await probeVoicebox()
      if (!cancelled) setStatus(next)
    }

    void check()
    const intervalId = window.setInterval(() => {
      void check()
    }, 15_000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [enabled])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string, profile?: string): Promise<boolean> => {
      if (!enabled || status !== "connected" || !text.trim()) return false

      cancel()
      const controller = new AbortController()
      abortRef.current = controller
      setSpeaking(true)

      try {
        const blob = await synthesizeVoiceboxSpeech(text, controller.signal, profile)
        await playVoiceboxBlob(blob, controller.signal)
        setSpeaking(false)
        abortRef.current = null
        return true
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.warn("[voicebox] speak failed:", err)
        }
        setSpeaking(false)
        abortRef.current = null
        return false
      }
    },
    [enabled, status, cancel],
  )

  return {
    status,
    speaking,
    available: enabled && status === "connected",
    speak,
    cancel,
  }
}
