/** Local Voicebox TTS bridge (http://127.0.0.1:17493). */

export const VOICEBOX_BASE_URL = "http://127.0.0.1:17493"
export const VOICEBOX_CLIENT_ID = "chatfpl"

export type VoiceboxConnectionStatus =
  | "unknown"
  | "checking"
  | "connected"
  | "offline"
  | "blocked"

type GenerationRecord = {
  id: string
  status: string
  error?: string | null
}

const DEFAULT_POLL_INTERVAL_MS = 500
const DEFAULT_POLL_TIMEOUT_MS = 120_000

export async function probeVoicebox(): Promise<VoiceboxConnectionStatus> {
  try {
    const res = await fetch(`${VOICEBOX_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return "connected"
    return "offline"
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : ""
    if (message.includes("failed to fetch") || message.includes("network")) {
      return "blocked"
    }
    return "offline"
  }
}

async function pollGeneration(
  generationId: string,
  signal: AbortSignal,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  pollTimeoutMs = DEFAULT_POLL_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + pollTimeoutMs

  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError")

    const res = await fetch(`${VOICEBOX_BASE_URL}/history/${generationId}`, {
      signal,
    })
    if (!res.ok) {
      throw new Error(`Voicebox status check failed (${res.status})`)
    }

    const data = (await res.json()) as GenerationRecord
    if (data.status === "completed") return
    if (data.status === "failed") {
      throw new Error(data.error || "Voicebox generation failed")
    }

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, pollIntervalMs)
      const onAbort = () => {
        window.clearTimeout(timer)
        reject(new DOMException("Aborted", "AbortError"))
      }
      signal.addEventListener("abort", onAbort, { once: true })
    })
  }

  throw new Error("Voicebox generation timed out")
}

export async function fetchVoiceboxAudio(
  generationId: string,
  signal: AbortSignal,
): Promise<Blob> {
  const res = await fetch(`${VOICEBOX_BASE_URL}/audio/${generationId}`, { signal })
  if (!res.ok) {
    throw new Error(`Voicebox audio fetch failed (${res.status})`)
  }
  return res.blob()
}

export async function queueVoiceboxSpeech(
  text: string,
  signal: AbortSignal,
  profile?: string,
): Promise<string> {
  const payload: { text: string; profile?: string } = { text }
  if (profile) payload.profile = profile

  const res = await fetch(`${VOICEBOX_BASE_URL}/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Voicebox-Client-Id": VOICEBOX_CLIENT_ID,
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok) {
    let detail = `Voicebox speak failed (${res.status})`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail)
  }

  const data = (await res.json()) as GenerationRecord
  if (!data.id) throw new Error("Voicebox did not return a generation id")
  return data.id
}

export async function synthesizeVoiceboxSpeech(
  text: string,
  signal: AbortSignal,
  profile?: string,
): Promise<Blob> {
  const generationId = await queueVoiceboxSpeech(text, signal, profile)
  await pollGeneration(generationId, signal)
  return fetchVoiceboxAudio(generationId, signal)
}

export function playVoiceboxBlob(
  blob: Blob,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    const cleanup = () => {
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
      URL.revokeObjectURL(url)
    }

    const onEnded = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new Error("Voicebox audio playback failed"))
    }

    const onAbort = () => {
      audio.pause()
      cleanup()
      reject(new DOMException("Aborted", "AbortError"))
    }

    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)
    signal.addEventListener("abort", onAbort, { once: true })

    void audio.play().catch((err) => {
      cleanup()
      reject(err)
    })
  })
}
