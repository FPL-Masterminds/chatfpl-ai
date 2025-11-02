import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { StripeCheckoutButton } from "@/components/stripe-checkout-button"
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
            <p className="mx-auto max-w-2xl text-pretty text-lg" style={{ color: '#4B5563' }}>
              Powered by real-time data and AI intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 - Live Data */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Live_Data.png"
                    alt="Live Data"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Live Data
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  Real-time FPL Q&A
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connects to the official FPL API for real-time stats, fixtures, and player performance data.
                </p>
              </div>
            </Card>

            {/* Card 2 - Expert Knowledge */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Expert_Knowledge.png"
                    alt="Expert Knowledge"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Expert Knowledge
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  AI-powered FPL expertise
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enhanced with FPL rules, strategy guides, and expert insights to give you the best advice.
                </p>
              </div>
            </Card>

            {/* Card 3 - Natural Chat */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Natural_Chat.png"
                    alt="Natural Chat"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Natural Chat
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  Conversational AI assistant
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask anything from "Who to captain?" to "Compare Salah vs Son" in plain English.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

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
              <span style={{ color: 'white' }}>Simple </span>
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
                <CardDescription className="mt-4 text-base">Perfect for trying out ChatFPL AI</CardDescription>
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
                <Button 
                  className="w-full hover:opacity-90" 
                  style={{ backgroundColor: '#00FF86', color: '#2E0032' }}
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 bg-white shadow-lg" style={{ borderColor: '#2E0032' }}>
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: '#2E0032', color: '#FFFFFF' }}
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
                <StripeCheckoutButton
                  plan="Premium"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: '#2E0032', color: '#FFFFFF' }}
                />
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
                <StripeCheckoutButton
                  plan="Elite"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: '#00FFFF', color: '#2E0032' }}
                />
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
              Everything you need to know about ChatFPL AI
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What data does ChatFPL AI use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ChatFPL AI connects directly to the official Fantasy Premier League API for real-time player stats,
                  fixtures, and performance data. We also enhance our AI with FPL rules, strategy guides, and expert
                  insights.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I try it for free?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Our Free plan gives you 5 messages per day to try out ChatFPL AI. No credit card required. Upgrade
                  anytime to get more messages and advanced features.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  How accurate are AI answers?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our AI is trained on official FPL data and expert strategy guides. While we strive for accuracy, FPL
                  is unpredictable by nature. We recommend using ChatFPL AI as one tool in your decision-making process.
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
