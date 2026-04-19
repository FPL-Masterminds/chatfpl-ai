"use client"

import { useState, useEffect, useRef } from "react"

const SILHOUETTE = "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png"

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

  const src = errored
    ? SILHOUETTE
    : `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`

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
