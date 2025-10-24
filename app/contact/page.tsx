import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Twitter } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Contact Form */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm md:col-span-2">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you shortly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={6} />
                </div>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Send Message</Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Mail className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Email</CardTitle>
                  <CardDescription>Send us an email anytime</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="mailto:support@chatfpl.ai" className="text-accent hover:underline">
                    support@chatfpl.ai
                  </a>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Live Chat</CardTitle>
                  <CardDescription>Chat with our support team</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Twitter className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Social Media</CardTitle>
                  <CardDescription>Follow us for updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    @ChatFPL
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
