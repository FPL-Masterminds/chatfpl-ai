"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "chatfpl-voice-prefs"

export type ChatVoicePrefs = {
  readReplies: boolean
  voiceMode: boolean
}

const DEFAULT_PREFS: ChatVoicePrefs = {
  readReplies: false,
  voiceMode: false,
}

function loadPrefs(): ChatVoicePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<ChatVoicePrefs>
    return {
      readReplies: !!parsed.readReplies,
      voiceMode: !!parsed.voiceMode,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function useChatVoicePrefs() {
  const [prefs, setPrefsState] = useState<ChatVoicePrefs>(DEFAULT_PREFS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPrefsState(loadPrefs())
    setHydrated(true)
  }, [])

  const setPrefs = useCallback((patch: Partial<ChatVoicePrefs>) => {
    setPrefsState((prev) => {
      let next: ChatVoicePrefs = { ...prev, ...patch }
      if (next.voiceMode) next = { ...next, readReplies: true }
      if (!next.readReplies && next.voiceMode) next = { ...next, voiceMode: false }
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const setReadReplies = useCallback(
    (enabled: boolean) => setPrefs({ readReplies: enabled }),
    [setPrefs],
  )

  const setVoiceMode = useCallback(
    (enabled: boolean) => setPrefs({ voiceMode: enabled, readReplies: enabled ? true : prefs.readReplies }),
    [setPrefs, prefs.readReplies],
  )

  return { prefs, hydrated, setPrefs, setReadReplies, setVoiceMode }
}
