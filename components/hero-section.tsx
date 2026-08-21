"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import TiltedCard from "@/components/tilted-card"

type HeroPlayer = {
  name: string
  team?: string
  photoUrl: string
}

const SILHOUETTE =
  "https://resources.premierleague.com/premierleague25/photos/players/110x140/Photo-Missing.png"

export function HeroSection() {
  const [players, setPlayers] = useState<HeroPlayer[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    let alive = true
    fetch("/api/hero-players")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`hero-players ${r.status}`))))
      .then((data: HeroPlayer[]) => {
        if (!alive) return
        if (Array.isArray(data) && data.length > 0) setPlayers(data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (players.length <= 1) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % players.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [players.length])

  const displayed = players.length > 0 ? players : [{ name: "Fantasy Premier League", photoUrl: SILHOUETTE }]

  return (
    <section className="relative overflow-hidden pt-24">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      <div className="container relative mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-balance font-bold leading-[1.1] tracking-tighter text-white" style={{ fontSize: "60px" }}>
              Chat with your Fantasy Premier League AI Assistant
            </h1>

            <p className="text-pretty text-lg text-white/90 md:text-xl">
              Ask live FPL questions. Get instant AI answers powered by real stats and natural conversation.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/#pricing">Start your 20-message free trial today</Link>
              </Button>
            </div>
          </div>

          <div
            className="hidden lg:flex relative items-center justify-center w-full max-w-md mx-auto"
            style={{ minHeight: "500px" }}
          >
            {displayed.map((image, index) => (
              <div
                key={`${image.photoUrl}-${index}`}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <TiltedCard
                  imageSrc={image.photoUrl}
                  altText={image.name}
                  containerHeight="500px"
                  containerWidth="500px"
                  imageHeight="500"
                  imageWidth="500"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
