"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on app-like pages
  const noFooter = [
    "/chat",
    "/devchat",
    "/dashboard",
    "/admin",
    "/earn-messages",
    "/devemails",
    "/devboard",
  ]
  if (
    noFooter.includes(pathname) ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/dashboard/owner")
  ) {
    return null
  }
  
  return <Footer />
}

