"use client"

import { useState, useRef, MouseEvent } from "react"
import Image from "next/image"

interface TiltedCardProps {
  imageSrc: string
  altText: string
  containerHeight?: string
  containerWidth?: string
  imageHeight?: string
  imageWidth?: string
  rotateAmplitude?: number
  scaleOnHover?: number
  className?: string
}

export default function TiltedCard({
  imageSrc,
  altText,
  containerHeight = "500px",
  containerWidth = "500px",
  imageHeight = "500px",
  imageWidth = "500px",
  rotateAmplitude = 15,
  scaleOnHover = 1.05,
  className = ""
}: TiltedCardProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    const rotateX = (mouseY / (rect.height / 2)) * rotateAmplitude
    const rotateY = (mouseX / (rect.width / 2)) * rotateAmplitude
    
    setRotation({ x: -rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        width: containerWidth,
        height: containerHeight,
        perspective: "1000px",
        cursor: "pointer"
      }}
      className={className}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transition: "transform 0.1s ease-out",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovered ? scaleOnHover : 1})`,
          transformStyle: "preserve-3d"
        }}
      >
        <Image
          src={imageSrc}
          alt={altText}
          width={parseInt(imageWidth)}
          height={parseInt(imageHeight)}
          className="rounded-lg object-cover"
          style={{
            width: "100%",
            height: "100%",
            boxShadow: isHovered 
              ? "0 20px 40px rgba(0, 0, 0, 0.3)" 
              : "0 10px 20px rgba(0, 0, 0, 0.2)",
            transition: "box-shadow 0.3s ease"
          }}
        />
      </div>
    </div>
  )
}

