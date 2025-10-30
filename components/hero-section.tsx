"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import TiltedCard from "@/components/tilted-card"

const HERO_IMAGES = [
  { src: "/Haaland_Hero.png", alt: "Erling Haaland" },
  { src: "/Salah_Hero.png", alt: "Mohamed Salah" },
  { src: "/Fernandes_Hero.png", alt: "Bruno Fernandes" },
  { src: "/Pickford_Hero.png", alt: "Jordan Pickford" },
  { src: "/Gabriel_Hero.png", alt: "Gabriel" },
  { src: "/Welbeck_Hero.png", alt: "Danny Welbeck" },
  { src: "/Semenyo_Hero.png", alt: "Antoine Semenyo" },
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
      <div className="container relative mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-balance font-bold leading-[1.1] tracking-tighter text-white" style={{ fontSize: '60px' }}>
              Chat with your Fantasy Premier League AI Assistant
            </h1>

            <p className="text-pretty text-lg text-white/90 md:text-xl">
              Ask live FPL questions. Get instant AI answers powered by real stats and natural conversation.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/#pricing">Start your 5-message free trial today</Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Rotating Player Images with Tilt Effect (Hidden on Mobile/Tablet) */}
          <div className="hidden lg:flex relative items-center justify-center w-full max-w-md mx-auto aspect-square">
            {HERO_IMAGES.map((image, index) => (
              <div
                key={image.src}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <TiltedCard
                  imageSrc={image.src}
                  altText={image.alt}
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

