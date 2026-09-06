"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Mic, Volume2, VolumeX } from "lucide-react"
import type { VoiceboxConnectionStatus } from "@/lib/voicebox-client"
import type { VoiceboxSpeechPhase } from "@/hooks/use-voicebox"

type ChatVoiceControlsProps = {
  readReplies: boolean
  voiceMode: boolean
  useVoicebox: boolean
  showVoicebox: boolean
  voiceboxStatus: VoiceboxConnectionStatus
  voiceboxPhase: VoiceboxSpeechPhase
  speechOutSupported: boolean
  speaking: boolean
  listening: boolean
  onReadRepliesChange: (enabled: boolean) => void
  onVoiceModeChange: (enabled: boolean) => void
  onUseVoiceboxChange: (enabled: boolean) => void
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
          : "border-white/60 bg-transparent text-white hover:border-white hover:bg-white/[0.04]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function voiceboxStatusLabel(status: VoiceboxConnectionStatus, enabled: boolean): string {
  if (!enabled) return "Voicebox off"
  if (status === "checking" || status === "unknown") return "Checking Voicebox..."
  if (status === "connected") return "Voicebox connected"
  if (status === "blocked") {
    return "Voicebox blocked. Run Voicebox locally and set VOICEBOX_CORS_ORIGINS=https://www.chatfpl.ai"
  }
  return "Voicebox not found. Install and run Voicebox on this machine."
}

function voiceboxStatusColor(status: VoiceboxConnectionStatus, enabled: boolean): string {
  if (!enabled) return "bg-white/25"
  if (status === "connected") return "bg-[#00FF87]"
  if (status === "checking" || status === "unknown") return "bg-amber-400 animate-pulse"
  return "bg-red-400"
}

export function ChatVoiceControls({
  readReplies,
  voiceMode,
  useVoicebox,
  showVoicebox,
  voiceboxStatus,
  voiceboxPhase,
  speechOutSupported,
  speaking,
  listening,
  onReadRepliesChange,
  onVoiceModeChange,
  onUseVoiceboxChange,
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

  const voiceboxHint = voiceboxStatusLabel(voiceboxStatus, useVoicebox)

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
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

        {showVoicebox && speechOutSupported ? (
          <TogglePill
            active={useVoicebox}
            onClick={() => onUseVoiceboxChange(!useVoicebox)}
            icon={
              <span
                className={`h-2 w-2 rounded-full ${voiceboxStatusColor(voiceboxStatus, useVoicebox)}`}
                aria-hidden
              />
            }
            label="Voicebox"
            hint={voiceboxHint}
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

        {useVoicebox && voiceboxPhase === "generating" ? (
          <span className="text-[11px] text-amber-300/90">Generating speech in Voicebox...</span>
        ) : null}

        {useVoicebox && voiceboxPhase === "playing" ? (
          <span className="text-[11px] text-[#00FF87]/80">Playing reply...</span>
        ) : null}
      </div>

      {showVoicebox && useVoicebox && voiceboxStatus !== "connected" && voiceboxStatus !== "checking" ? (
        <p className="text-[10px] leading-relaxed text-white/45">
          {voiceboxStatus === "blocked" ? (
            <>
              Voicebox is running but the browser blocked the connection. In Voicebox, set{" "}
              <code className="text-white/60">VOICEBOX_CORS_ORIGINS=https://www.chatfpl.ai</code> and restart.
            </>
          ) : (
            <>
              Install Voicebox on this PC, open the app, then set a default voice for client id{" "}
              <code className="text-white/60">chatfpl</code> under Settings → MCP.
            </>
          )}
          <a
            href="https://voicebox.sh/download/windows"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-0.5 text-[#00FF87]/70 hover:text-[#00FF87]"
          >
            Download
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </p>
      ) : null}
    </div>
  )
}
