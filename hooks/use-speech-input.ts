"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechInput() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const sessionBaseRef = useRef("")

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-GB"
    recognitionRef.current = recognition
    setSupported(true)

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        // ignore teardown errors
      }
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try {
      recognition.stop()
    } catch {
      // ignore if already stopped
    }
    setListening(false)
  }, [])

  const toggle = useCallback(
    (currentValue: string, setValue: (value: string) => void) => {
      const recognition = recognitionRef.current
      if (!recognition) return

      if (listening) {
        stop()
        return
      }

      sessionBaseRef.current = currentValue.trimEnd()

      recognition.onresult = (event) => {
        let spoken = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          spoken += event.results[i][0].transcript
        }
        spoken = spoken.trim()
        if (!spoken) return

        const base = sessionBaseRef.current
        const merged = base ? `${base} ${spoken}` : spoken
        setValue(merged)

        const last = event.results[event.results.length - 1]
        if (last?.isFinal) {
          sessionBaseRef.current = merged
        }
      }

      recognition.onerror = () => {
        setListening(false)
      }

      recognition.onend = () => {
        setListening(false)
      }

      try {
        recognition.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    },
    [listening, stop],
  )

  return { supported, listening, toggle, stop }
}
