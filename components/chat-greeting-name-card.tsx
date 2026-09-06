"use client"

import { useEffect, useState } from "react"

type ChatGreetingNameCardProps = {
  name: string
  onSaved: (name: string) => void
  style?: React.CSSProperties
}

function chatFirstName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0] || "there"
}

export function ChatGreetingNameCard({ name, onSaved, style }: ChatGreetingNameCardProps) {
  const [draft, setDraft] = useState(name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(name)
  }, [name])

  const previewName = chatFirstName(draft)
  const trimmedDraft = draft.trim()
  const unchanged = trimmedDraft === name.trim()

  const handleSave = async () => {
    if (!trimmedDraft || unchanged) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedDraft }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save your name")
        return
      }
      onSaved(data.name ?? trimmedDraft)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("Could not save your name. Try again in a moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
      style={style}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-sm font-semibold text-white">Your chat greeting</h2>
          <p className="text-xs leading-relaxed text-white/60">
            This is how ChatFPL addresses you in chat. We use your first name only when we say hi.
            Your FPL team name is linked separately from your dashboard data.
          </p>
          <div className="rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white/75">
            <span className="text-white/45">Preview: </span>
            Hi <span className="font-semibold text-white">{previewName}</span>! What FPL question can I help with today?
          </div>
        </div>

        <div className="w-full md:max-w-sm space-y-2">
          <label htmlFor="chat-greeting-name" className="block text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            Name
          </label>
          <div className="flex gap-2">
            <input
              id="chat-greeting-name"
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(null)
                setSaved(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave()
              }}
              autoComplete="name"
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/50 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#00FF87]/40"
              placeholder="e.g. John"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !trimmedDraft || unchanged}
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#00FF87] to-[#00CFFF] px-4 py-2 text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
          {saved ? <p className="text-xs text-[#00FF87]/90">Saved. Chat will greet you as {previewName}.</p> : null}
        </div>
      </div>
    </div>
  )
}
