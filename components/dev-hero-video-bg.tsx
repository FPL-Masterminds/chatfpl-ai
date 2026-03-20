"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

/** Mux HLS asset — hero background on dev landing */
export const DEV_LANDING_HERO_VIDEO_SRC =
  "https://stream.mux.com/9njY8qDfS02Uvbll018C8CK39p5EksK7mn02DDC1zYvppI.m3u8"

export function DevHeroVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null

    const tryPlay = () => {
      void video.play().catch(() => {
        /* autoplay may be blocked until gesture; muted usually allows it */
      })
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })
      hls.loadSource(DEV_LANDING_HERO_VIDEO_SRC)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = DEV_LANDING_HERO_VIDEO_SRC
      video.addEventListener("loadedmetadata", tryPlay, { once: true })
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [])

  // Some HLS stacks ignore `loop`; restart playback when the asset ends
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnded = () => {
      video.currentTime = 0
      void video.play().catch(() => {})
    }
    video.addEventListener("ended", onEnded)
    return () => video.removeEventListener("ended", onEnded)
  }, [])

  return (
    <video
      ref={videoRef}
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
