"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("submitting")

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch("https://formspree.io/f/mwpwpolb", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        setStatus("success")
        form.reset()
      } else {
        setStatus("error")
      }
    } catch (error) {
      setStatus("error")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 pt-20 pb-6">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h1 
              className="mb-6 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Get </span>
              <span style={{ color: '#00FFFF' }}>In </span>
              <span style={{ color: '#00FF86' }}>Touch</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              {status === "success" && (
                <div className="mb-4 rounded-md bg-accent/10 p-3 text-sm text-accent">
                  Thank you! Your message has been sent successfully. We'll get back to you soon.
                </div>
              )}
              {status === "error" && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Something went wrong. Please try again or email us directly at support@chatfpl.ai
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" name="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" name="lastName" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
