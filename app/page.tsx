import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Database, Brain, MessageSquare, Check } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            {/* Left Column - Hero Content */}
            <div className="space-y-8 text-center md:text-left">
              <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
                Chat with Fantasy Premier League Data
              </h1>

              <p className="text-pretty text-lg text-white/90 md:text-xl">
                Ask live FPL questions. Get instant AI answers powered by real stats, expert knowledge, and natural
                conversation.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
                <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/#pricing">Start Chatting</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-2 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Haaland Image */}
            <div className="relative flex items-center justify-center">
              <Image
                src="/Haaland_Hero.png"
                alt="Erling Haaland"
                width={600}
                height={600}
                className="w-full max-w-lg h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">
              Everything you need for FPL success
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Powered by real-time data and AI intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/5">
                  <Database className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-foreground">Live Data</CardTitle>
                <CardDescription>
                  Connects to the official FPL API for real-time stats, fixtures, and player performance data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Expert Knowledge</CardTitle>
                <CardDescription>
                  Enhanced with FPL rules, strategy guides, and expert insights to give you the best advice.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/5">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-foreground">Natural Chat</CardTitle>
                <CardDescription>
                  Ask anything from "Who to captain?" to "Compare Salah vs Son" in plain English.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">What users say</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "ChatFPL helped me climb from 2M to top 100k in just 8 gameweeks. The AI insights are incredible.",
                author: "Alex M.",
                role: "FPL Manager",
              },
              {
                quote:
                  "Finally, an AI that actually understands FPL strategy. The captain picks alone are worth the subscription.",
                author: "Sarah K.",
                role: "Top 10k Finisher",
              },
              {
                quote: "I use it every gameweek for transfer decisions. It's like having an FPL expert on speed dial.",
                author: "James R.",
                role: "FPL Veteran",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="border border-border bg-white shadow-sm">
                <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-accent" />
                <CardHeader>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex-col items-start">
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">Simple, transparent pricing</h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Choose the plan that fits your FPL ambitions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">£0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">Perfect for trying out ChatFPL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">5 messages per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Basic AI insights</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-2 bg-transparent" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-accent bg-white shadow-lg">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                Most Popular
              </div>
              <CardHeader>
                <CardTitle className="text-foreground">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">£4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">For serious FPL managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">50 messages per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Advanced AI insights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link href="/signup">Subscribe</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Elite Plan */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Elite</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">£9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">For elite FPL competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Unlimited messages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Premium AI insights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground">Early access to features</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-2 border-primary bg-transparent" asChild>
                  <Link href="/signup">Subscribe</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">Frequently asked questions</h2>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What data does ChatFPL use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ChatFPL connects directly to the official Fantasy Premier League API for real-time player stats,
                  fixtures, and performance data. We also enhance our AI with FPL rules, strategy guides, and expert
                  insights.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I try it for free?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Our Free plan gives you 5 messages per day to try out ChatFPL. No credit card required. Upgrade
                  anytime to get more messages and advanced features.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  How accurate are AI answers?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our AI is trained on official FPL data and expert strategy guides. While we strive for accuracy, FPL
                  is unpredictable by nature. We recommend using ChatFPL as one tool in your decision-making process.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I cancel my subscription anytime?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time from your account settings. You'll continue
                  to have access until the end of your billing period.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-accent/30 p-12 text-center md:p-16">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url(/hero-bg.png)" }}
            />
            <div className="absolute inset-0 bg-primary/40" />
            <div className="relative z-10 mx-auto max-w-3xl space-y-6">
              <h2 className="text-balance text-4xl font-bold text-white md:text-5xl">
                Get smarter FPL decisions. Start your free trial today.
              </h2>
              <p className="text-pretty text-lg text-white/90">
                Join thousands of FPL managers using AI to gain a competitive edge.
              </p>
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">Start Chatting</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
