"use client"

import { useCallback, useEffect, useRef, useState } from "react"

function pickBritishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en-GB")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  )
}

export function useSpeechOutput() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    setSupported(true)

    const syncVoices = () => {
      voiceRef.current = pickBritishVoice()
    }
    syncVoices()
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices)
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!supported || !text.trim()) return

      cancel()
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "en-GB"
        if (voiceRef.current) utterance.voice = voiceRef.current
        utterance.rate = 1
        utterance.pitch = 1

        utterance.onend = () => {
          setSpeaking(false)
          resolve()
        }
        utterance.onerror = () => {
          setSpeaking(false)
          resolve()
        }

        setSpeaking(true)
        window.speechSynthesis.speak(utterance)
      })
    },
    [supported, cancel],
  )

  return { supported, speaking, speak, cancel }
}
