"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleResend = async () => {
    if (!email) return

    setIsResending(true)
    setResendMessage("")

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setResendMessage("Verification email sent! Check your inbox.")
      } else {
        const data = await response.json()
        setResendMessage(data.error || "Failed to resend email. Please try again.")
      }
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Image 
            src="/ChatFPL_AI_Logo.png" 
            alt="ChatFPL AI" 
            width={200} 
            height={100}
            className="h-auto w-auto max-w-[200px]"
            priority
          />
        </div>

        <h1 className="mb-4 text-2xl font-bold text-foreground">Check Your Email</h1>

        <p className="mb-6 text-muted-foreground">
          {email ? (
            <>
              We've sent a verification link to <strong className="text-foreground">{email}</strong>
            </>
          ) : (
            "We've sent a verification link to your email address."
          )}
        </p>

        <div className="mb-6 rounded-lg bg-accent/5 p-4 text-left">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle className="h-5 w-5 text-accent" />
            Next Steps:
          </h3>
          <ol className="ml-7 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Check your inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return here to log in</li>
          </ol>
        </div>

        {resendMessage && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${resendMessage.includes("sent") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <div className="flex items-center gap-2">
              {resendMessage.includes("sent") ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {resendMessage}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {email && (
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          )}

          <Link href="/login">
            <Button variant="default" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Go to Login
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or click "Resend" above.
        </p>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

