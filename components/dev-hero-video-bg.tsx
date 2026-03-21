"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

const SRC = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8"


export function DevHeroVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      video.removeAttribute("src")
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(SRC)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {})
      })
      return () => hls.destroy()
    }

    // iOS Safari — native HLS via src attr, nudge play
    void video.play().catch(() => {})
  }, [])

  return (
    <video
      ref={videoRef}
      src={SRC}
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
