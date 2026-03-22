"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on chat or dev chat pages
  if (pathname === "/chat" || pathname === "/devchat") {
    return null
  }
  
  return <Footer />
}

