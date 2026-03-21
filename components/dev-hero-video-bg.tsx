"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"

const BACKGROUNDS = [
  "https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8",   // 1
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8",   // 5
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4", // 9
  "https://stream.mux.com/Gs3wZfrtz6ZfqZqQ02c02Z7lugV00FGZvRpcqFTel66r3g.m3u8",   // 10
  "https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8",  // 12
  "https://stream.mux.com/4IMYGcL01xjs7ek5ANO17JC4VQVUTsojZlnw4fXzwSxc.m3u8",    // 15
  "https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8",    // 18
  "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8",    // 19
  "https://stream.mux.com/00qQnfNo7sSpn3pB1hYKkyeSDvxs01NxiQ3sr29uL3e028.m3u8",  // 20
  "https://stream.mux.com/Si6ej2ZRrxRCnTYBXSScDRCdd7CGnyTqiPszZcw3z4I.m3u8",     // 21
  "https://stream.mux.com/JNJEOYI6B3EffB9f5ZhpGbuxzc6gSyJcXaCBbCgZKRg.m3u8",     // 24
  "https://stream.mux.com/PkFsoKeakRLgL01gjf02CRcSbsJ600Z00NvLr9eRZ92pLbA.m3u8", // 28
  "https://stream.mux.com/9njY8qDfS02Uvbll018C8CK39p5EksK7mn02DDC1zYvppI.m3u8",  // 34
  "https://stream.mux.com/r6pXRAJb3005XEEbl1hYU1x01RFJDSn7KQApwNGgAHHbU.m3u8",   // 37
]

function pickRandom(): string {
  return BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
}

function isHls(url: string): boolean {
  return url.includes(".m3u8")
}

export function DevHeroVideoBg() {
  // Stable per page load — picked once on first render, never changes mid-session
  const [src] = useState<string>(pickRandom)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // MP4 — browser handles it natively, src already set as HTML attr
    if (!isHls(src)) {
      void video.play().catch(() => {})
      return
    }

    // HLS (Mux streams)
    if (Hls.isSupported()) {
      video.removeAttribute("src")
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {})
      })
      return () => hls.destroy()
    }

    // iOS Safari — native HLS via src attr, nudge play
    void video.play().catch(() => {})
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      muted
      playsInline
      loop
      autoPlay
      preload="auto"
      aria-hidden
    />
  )
}
