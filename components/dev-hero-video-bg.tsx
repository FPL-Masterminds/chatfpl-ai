"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

const SRC =
  "https://stream.mux.com/9njY8qDfS02Uvbll018C8CK39p5EksK7mn02DDC1zYvppI.m3u8"

export function DevHeroVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      // Chrome / Firefox / Android — hls.js takes over, remove the src attr
      video.removeAttribute("src")
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(SRC)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {})
      })
      return () => hls.destroy()
    }

    // iOS Safari — src is already set as an HTML attribute so the browser
    // handles HLS natively and respects muted+playsInline autoplay rules.
    // Just nudge play() to be safe.
    void video.play().catch(() => {})
  }, [])

  return (
    /*
     * src is set here as a React prop (= HTML attribute) so iOS Safari picks
     * it up immediately on mount and can autoplay without waiting for JS.
     * hls.js browsers strip it via removeAttribute() and take full control.
     */
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
