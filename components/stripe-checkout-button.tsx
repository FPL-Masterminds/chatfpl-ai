"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface StripeCheckoutButtonProps {
  plan: "Premium" | "Elite"
  className?: string
  style?: React.CSSProperties
}

export function StripeCheckoutButton({ plan, className, style }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    setLoading(true)
    
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      alert(error.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Loading..." : "Subscribe"}
    </Button>
  )
}

