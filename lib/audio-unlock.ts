/** Unlock browser audio during a user gesture so later TTS can play. */
export function unlockAudioPlayback(): void {
  if (typeof window === "undefined") return

  try {
    const silent =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    const audio = new Audio(silent)
    audio.volume = 0.01
    void audio.play().catch(() => {})
  } catch {
    /* ignore */
  }

  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      const ctx = new Ctx()
      void ctx.resume()
    }
  } catch {
    /* ignore */
  }
}
