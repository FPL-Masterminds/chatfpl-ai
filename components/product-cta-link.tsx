"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { resolveProductCta } from "@/lib/cta-copy"

const SHIMMER_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 2.4s linear infinite",
}

const HERO_FRAME_CLASS =
  "inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105"

const HERO_FRAME_STYLE: React.CSSProperties = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow:
    "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
}

type ProductCtaVariant = "hero" | "panel" | "plain"

interface ProductCtaLinkProps {
  chatQuery?: string
  variant?: ProductCtaVariant
  showArrow?: boolean
  className?: string
  textClassName?: string
}

export function ProductCtaLink({
  chatQuery,
  variant = "hero",
  showArrow = false,
  className = "",
  textClassName = "",
}: ProductCtaLinkProps) {
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"
  const { label, href } = resolveProductCta(isAuthenticated, chatQuery)

  const linkClass =
    variant === "hero"
      ? `relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-[#08020E] ${textClassName}`
      : variant === "panel"
        ? `relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)] ${textClassName}`
        : `relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-4 font-bold text-base text-black ${textClassName}`

  const link = (
    <Link
      href={href}
      className={`${linkClass} ${className}`}
      style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={SHIMMER_STYLE}
      />
      <span className="relative">{label}</span>
      {showArrow ? (
        <svg
          className="relative h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      ) : null}
    </Link>
  )

  if (variant === "hero") {
    return (
      <div className={HERO_FRAME_CLASS} style={HERO_FRAME_STYLE}>
        {link}
      </div>
    )
  }

  return link
}
