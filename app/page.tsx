import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { PricingButton } from "@/components/pricing-button"
import { Database, Brain, MessageSquare, Check, Star, User } from "lucide-react"

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
              <div className="grid grid-cols-3 text-center" style={{ backgroundColor: '#00FF86', color: '#2E0032' }}>
                <div className="py-3">
                  <div className="text-lg font-bold">700+</div>
                  <div className="text-xs uppercase">Players</div>
                </div>
                <div className="py-3 border-l border-[#2E0032]/20">
                  <div className="text-lg font-bold">38</div>
                  <div className="text-xs uppercase">Gameweeks</div>
                </div>
                <div className="py-3 border-l border-[#2E0032]/20">
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
                author: "Ryan Anderson",
                role: "Early User",
                circleColor: "#00FF86",
                iconColor: "#2E0032",
              },
              {
                quote:
                  "Finally, an AI that actually understands FPL strategy. The captain picks alone are worth the subscription.",
                author: "Oliver Hughes",
                role: "New Subscriber",
                circleColor: "#2E0032",
                iconColor: "#FFFFFF",
              },
              {
                quote: "I use it every gameweek for transfer decisions. It's like having an FPL expert on speed dial.",
                author: "Daniel Brown",
                role: "Beta-Tester",
                circleColor: "#00FFFF",
                iconColor: "#2E0032",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="overflow-hidden border-0 bg-white shadow-md">
                <div className="bg-white p-6">
                  {/* User Icon Circle */}
                  <div className="mb-4 flex justify-center">
                    <div 
                      className="flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ backgroundColor: testimonial.circleColor }}
                    >
                      <User className="h-8 w-8" style={{ color: testimonial.iconColor }} strokeWidth={2} />
                    </div>
                  </div>
                  
                  {/* Stars */}
                  <div className="mb-4 flex justify-center gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <svg
                        key={starIndex}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="#D4AF37"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Name */}
                  <h3 className="mb-1 text-center text-lg font-bold text-foreground">
                    {testimonial.author}
                  </h3>
                  
                  {/* Role */}
                  <p className="mb-4 text-center text-sm font-semibold" style={{ color: '#2E0032' }}>
                    {testimonial.role}
                  </p>
                  
                  {/* Quote */}
                  <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
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
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Free Trial</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£0</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">Perfect for trying out ChatFPL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">5 free messages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Limited support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <PricingButton 
                  href="/signup"
                  hoverBg="#00FF86"
                  hoverColor="#2E0032"
                >
                  Get Started
                </PricingButton>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 bg-white shadow-lg" style={{ borderColor: '#2E0032' }}>
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: '#2E0032', color: '#00FF86' }}
              >
                Most Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Premium Subscription</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£19.99</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">For serious FPL managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">100 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full hover:opacity-90" 
                  style={{ backgroundColor: '#2E0032', color: '#FFFFFF' }}
                  asChild
                >
                  <Link href="/signup">Subscribe</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Elite Plan */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Elite Subscription</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£49.99</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">For elite FPL competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">500 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <PricingButton 
                  href="/signup"
                  hoverBg="#00FFFF"
                  hoverColor="#2E0032"
                >
                  Subscribe
                </PricingButton>
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
