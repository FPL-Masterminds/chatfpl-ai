"use client"

import { useEffect, useState } from "react"
import { Mic, Volume2, VolumeX } from "lucide-react"

type ChatVoiceControlsProps = {
  readReplies: boolean
  voiceMode: boolean
  speechOutSupported: boolean
  speaking: boolean
  listening: boolean
  onReadRepliesChange: (enabled: boolean) => void
  onVoiceModeChange: (enabled: boolean) => void
  onStopSpeaking: () => void
}

function TogglePill({
  active,
  disabled,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={hint}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[#00FF87]/50 bg-[#00FF87]/10 text-[#00FF87]"
          : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/75"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function ChatVoiceControls({
  readReplies,
  voiceMode,
  speechOutSupported,
  speaking,
  listening,
  onReadRepliesChange,
  onVoiceModeChange,
  onStopSpeaking,
}: ChatVoiceControlsProps) {
  const [speechInSupported, setSpeechInSupported] = useState(false)

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: unknown
      webkitSpeechRecognition?: unknown
    }
    setSpeechInSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])

  if (!speechInSupported && !speechOutSupported) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {speechOutSupported ? (
        <TogglePill
          active={readReplies}
          onClick={() => onReadRepliesChange(!readReplies)}
          icon={readReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          label="Read replies"
          hint="Read assistant answers aloud when they finish"
        />
      ) : null}

      {speechInSupported && speechOutSupported ? (
        <TogglePill
          active={voiceMode}
          onClick={() => onVoiceModeChange(!voiceMode)}
          icon={<Mic className={`h-3.5 w-3.5 ${listening ? "animate-pulse" : ""}`} />}
          label="Voice mode"
          hint="Speak your question, hear the answer, then speak again without typing"
        />
      ) : null}

      {speaking ? (
        <button
          type="button"
          onClick={onStopSpeaking}
          className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/70 hover:border-white/25 hover:text-white"
        >
          Stop speaking
        </button>
      ) : null}

      {voiceMode && listening ? (
        <span className="text-[11px] text-[#00FF87]/80">Listening...</span>
      ) : null}
    </div>
  )
}
