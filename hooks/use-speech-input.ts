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

type UseSpeechInputOptions = {
  onListenEnd?: (finalText: string) => void
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechInput(options: UseSpeechInputOptions = {}) {
  const { onListenEnd } = options
  const onListenEndRef = useRef(onListenEnd)
  onListenEndRef.current = onListenEnd

  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const sessionBaseRef = useRef("")
  const latestTextRef = useRef("")

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

  const start = useCallback(
    (currentValue: string, setValue: (value: string) => void) => {
      const recognition = recognitionRef.current
      if (!recognition || listening) return

      sessionBaseRef.current = currentValue.trimEnd()
      latestTextRef.current = sessionBaseRef.current

      recognition.onresult = (event) => {
        let sessionTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript
        }
        sessionTranscript = sessionTranscript.replace(/\s+/g, " ").trim()

        const base = sessionBaseRef.current
        const merged =
          base && sessionTranscript
            ? `${base} ${sessionTranscript}`
            : sessionTranscript || base

        latestTextRef.current = merged
        setValue(merged)
      }

      recognition.onerror = () => {
        setListening(false)
      }

      recognition.onend = () => {
        setListening(false)
        onListenEndRef.current?.(latestTextRef.current)
      }

      try {
        recognition.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    },
    [listening],
  )

  const toggle = useCallback(
    (currentValue: string, setValue: (value: string) => void) => {
      if (listening) {
        stop()
        return
      }
      start(currentValue, setValue)
    },
    [listening, start, stop],
  )

  return { supported, listening, toggle, start, stop }
}
