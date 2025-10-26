"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const HERO_IMAGES = [
  { src: "/Haaland_Hero.png", alt: "Erling Haaland" },
  { src: "/Salah_Hero.png", alt: "Mohamed Salah" },
]

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length)
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden pt-24">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-8 text-center md:text-left">
            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              Chat with Fantasy Premier League Data
            </h1>

            <p className="text-pretty text-lg text-white/90 md:text-xl">
              Ask live FPL questions. Get instant AI answers powered by real stats, expert knowledge, and natural
              conversation.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/#pricing">Start Chatting</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 bg-transparent text-white hover:bg-white/10">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Rotating Player Images */}
          <div className="relative flex items-center justify-center">
            {HERO_IMAGES.map((image, index) => (
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                width={600}
                height={600}
                className={`w-full max-w-lg h-auto transition-opacity duration-1000 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0 absolute inset-0"
                }`}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

