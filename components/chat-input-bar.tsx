"use client"

import { Mic } from "lucide-react"
import { Send } from "lucide-react"
import { useSpeechInput } from "@/hooks/use-speech-input"

type ChatInputBarProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask your FPL question...",
}: ChatInputBarProps) {
  const { supported, listening, toggle, stop } = useSpeechInput()

  const handleSend = () => {
    stop()
    onSend()
  }

  return (
    <div className="rounded-[20px] border border-white/25 bg-white/[0.04] p-3 flex items-end gap-2 sm:gap-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder:text-white/55 resize-none outline-none text-sm leading-6 max-h-[140px] min-h-[36px] pt-1"
        rows={1}
        disabled={disabled}
        aria-label="Chat message"
      />

      {supported ? (
        <button
          type="button"
          onClick={() => toggle(value, onChange)}
          disabled={disabled}
          title={listening ? "Stop listening" : "Speak your question"}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          aria-pressed={listening}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
            listening
              ? "border-[#00FF87]/60 bg-[#00FF87]/15 text-[#00FF87] shadow-[0_0_20px_rgba(0,255,135,0.25)]"
              : "border-white/15 bg-white/[0.03] text-white/70 hover:border-[#00FF87]/35 hover:text-[#00FF87]"
          }`}
        >
          <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold text-sm shadow-[0_0_24px_rgba(0,255,200,0.2)] hover:brightness-110 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
      >
        <Send className="h-3.5 w-3.5" />
        <span>Send</span>
      </button>
    </div>
  )
}
