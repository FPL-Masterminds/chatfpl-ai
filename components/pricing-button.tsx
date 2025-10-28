"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

interface PricingButtonProps {
  href: string
  children: React.ReactNode
  variant?: "default" | "outline"
  hoverBg?: string
  hoverColor?: string
  defaultBg?: string
  defaultColor?: string
  border?: string
}

export function PricingButton({
  href,
  children,
  variant = "outline",
  hoverBg = "#00FF86",
  hoverColor = "#2E0032",
  defaultBg = "transparent",
  defaultColor,
  border,
}: PricingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      variant={variant}
      className="w-full bg-transparent transition-all"
      style={{
        backgroundColor: isHovered ? hoverBg : defaultBg,
        color: isHovered ? hoverColor : defaultColor,
        border: border || '2px solid hsl(var(--border))',
        borderColor: isHovered && hoverBg !== "transparent" ? hoverBg : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}

