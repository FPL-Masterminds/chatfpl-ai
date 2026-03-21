"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"

const BACKGROUNDS = [
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8",  // 5  - KEEP
  "https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8", // 12 - KEEP
  "https://stream.mux.com/JNJEOYI6B3EffB9f5ZhpGbuxzc6gSyJcXaCBbCgZKRg.m3u8",    // 24 - KEEP
  "https://stream.mux.com/9njY8qDfS02Uvbll018C8CK39p5EksK7mn02DDC1zYvppI.m3u8", // 34 - KEEP
  "https://stream.mux.com/r6pXRAJb3005XEEbl1hYU1x01RFJDSn7KQApwNGgAHHbU.m3u8",  // 37 - KEEP
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
