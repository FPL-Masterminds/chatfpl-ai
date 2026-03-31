"use client"

import { motion } from "framer-motion"

// A slowly drifting radial glow — GPU-accelerated via transform, no repaints
// Pass different waypoints + duration per section so they never move in sync

type Waypoint = { x: string; y: string }

interface AnimatedGlowProps {
  color?: string       // CSS colour for the glow centre
  size?: string        // ellipse size e.g. "65% 55%"
  waypoints: Waypoint[] // positions to drift between (as % of container)
  duration?: number    // seconds per leg
}

export function AnimatedGlow({
  color = "rgba(0,255,135,0.13)",
  size = "65% 55%",
  waypoints,
  duration = 14,
}: AnimatedGlowProps) {
  const xs = waypoints.map((w) => w.x)
  const ys = waypoints.map((w) => w.y)

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        // Oversized so the glow never clips when drifting to edges
        inset: "-30%",
        willChange: "transform",
      }}
      animate={{ x: xs, y: ys }}
      transition={{
        duration: duration * waypoints.length,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse ${size} at 50% 50%, ${color} 0%, transparent 65%)`,
        }}
      />
    </motion.div>
  )
}
