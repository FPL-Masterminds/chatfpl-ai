"use client"

import { useState, useEffect, useRef } from "react"
import { FPL_PLAYER_PHOTO_SILHOUETTE, fplPlayerPhotoUrl } from "@/lib/fpl-player-photo"

const SILHOUETTE = FPL_PLAYER_PHOTO_SILHOUETTE

export function HubPlayerPhoto({
  code,
  name,
}: {
  code: number
  name: string
}) {
  const [errored, setErrored] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Catch images that fail before React hydration attaches onError
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) {
      setErrored(true)
    }
  }, [])

  const src = errored ? SILHOUETTE : fplPlayerPhotoUrl(code)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
        opacity: errored ? 0.4 : 1,
      }}
    />
  )
}
