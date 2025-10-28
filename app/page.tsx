import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { Database, Brain, MessageSquare, Check, Star } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <HeroSection />

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Everything you need for </span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>success</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Powered by real-time data and AI intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 - Green */}
            <Card className="overflow-hidden border-0 bg-white shadow-md transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <Database className="h-16 w-16 text-accent/40" />
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-foreground">
                  Live Data
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connects to the official FPL API for real-time stats, fixtures, and player performance data.
                </p>
              </div>
              <div className="grid grid-cols-3 text-center text-white" style={{ backgroundColor: '#00FF86' }}>
                <div className="py-3">
                  <div className="text-lg font-bold">700+</div>
                  <div className="text-xs uppercase">Players</div>
                </div>
                <div className="py-3 border-l border-white/20">
                  <div className="text-lg font-bold">38</div>
                  <div className="text-xs uppercase">Gameweeks</div>
                </div>
                <div className="py-3 border-l border-white/20">
                  <div className="text-lg font-bold">Live</div>
                  <div className="text-xs uppercase">Updates</div>
                </div>
              </div>
            </Card>

            {/* Card 2 - Purple */}
            <Card className="overflow-hidden border-0 bg-white shadow-md transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-purple-900/5 flex items-center justify-center">
                <Brain className="h-16 w-16 text-purple-900/40" />
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-foreground">
                  Expert Knowledge
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enhanced with FPL rules, strategy guides, and expert insights to give you the best advice.
                </p>
              </div>
              <div className="grid grid-cols-3 text-center text-white" style={{ backgroundColor: '#2E0032' }}>
                <div className="py-3">
                  <div className="text-lg font-bold">AI</div>
                  <div className="text-xs uppercase">Powered</div>
                </div>
                <div className="py-3 border-l border-white/20">
                  <div className="text-lg font-bold">24/7</div>
                  <div className="text-xs uppercase">Available</div>
                </div>
                <div className="py-3 border-l border-white/20">
                  <div className="text-lg font-bold">Smart</div>
                  <div className="text-xs uppercase">Advice</div>
                </div>
              </div>
            </Card>

            {/* Card 3 - Cyan */}
            <Card className="overflow-hidden border-0 bg-white shadow-md transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                <MessageSquare className="h-16 w-16 text-cyan-500/40" />
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-foreground">
                  Natural Chat
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask anything from "Who to captain?" to "Compare Salah vs Son" in plain English.
                </p>
              </div>
              <div className="grid grid-cols-3 text-center text-foreground" style={{ backgroundColor: '#00FFFF' }}>
                <div className="py-3">
                  <div className="text-lg font-bold">Fast</div>
                  <div className="text-xs uppercase">Response</div>
                </div>
                <div className="py-3 border-l border-black/10">
                  <div className="text-lg font-bold">Easy</div>
                  <div className="text-xs uppercase">To Use</div>
                </div>
                <div className="py-3 border-l border-black/10">
                  <div className="text-lg font-bold">Clear</div>
                  <div className="text-xs uppercase">Answers</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>What </span>
              <span style={{ color: '#00FFFF' }}>users </span>
              <span style={{ color: '#00FF86' }}>say</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Real feedback from FPL managers using ChatFPL
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "ChatFPL helped me climb from 2M to top 100k in just 8 gameweeks. The AI insights are incredible.",
                author: "Alex McKinney",
                role: "FPL Manager",
                avatar: "/placeholder-user.jpg",
              },
              {
                quote:
                  "Finally, an AI that actually understands FPL strategy. The captain picks alone are worth the subscription.",
                author: "Sarah Murphy",
                role: "Top 10k Finisher",
                avatar: "/placeholder-user.jpg",
              },
              {
                quote: "I use it every gameweek for transfer decisions. It's like having an FPL expert on speed dial.",
                author: "James Robinson",
                role: "FPL Veteran",
                avatar: "/placeholder-user.jpg",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="overflow-hidden border-0 bg-white shadow-md">
                {/* Stars at top */}
                <div className="bg-white p-6 pb-4">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star key={starIndex} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {/* Quote text */}
                  <p className="text-sm leading-relaxed text-gray-700">
                    {testimonial.quote}
                  </p>
                </div>
                {/* Orange footer with avatar and details */}
                <div className="flex items-center gap-4 bg-[#FF6B35] p-6 pt-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border-2 border-white object-cover"
                  />
                  <div>
                    <p className="font-bold text-white">{testimonial.author}</p>
                    <p className="text-sm text-white/90">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Simple, </span>
              <span style={{ color: '#00FFFF' }}>transparent </span>
              <span style={{ color: '#00FF86' }}>pricing</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Choose the plan that fits your FPL ambitions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Trial */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Free Trial</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">£0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">Perfect for trying out ChatFPL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">5 free messages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
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
                  <span className="text-4xl font-bold text-foreground">£19.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">For serious FPL managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">100 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
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
                  <span className="text-4xl font-bold text-foreground">£49.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">For elite FPL competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">500 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Priority support</span>
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
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Frequently </span>
              <span style={{ color: '#00FFFF' }}>asked </span>
              <span style={{ color: '#00FF86' }}>questions</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Everything you need to know about ChatFPL
            </p>
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
    </div>
  )
}
