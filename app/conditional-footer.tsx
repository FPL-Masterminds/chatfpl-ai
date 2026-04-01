"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on app-like pages
  const noFooter = ["/chat", "/devchat", "/admin", "/dashboard"]
  if (noFooter.includes(pathname)) {
    return null
  }
  
  return <Footer />
}

