import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"
import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatShowcase } from "@/components/chat-showcase"
import PlayerCarousel from "@/components/player-carousel"
import { QueryCarousel } from "@/components/query-carousel"
import { WhyChatFPL } from "@/components/why-chatfpl"
import { PricingSlider } from "@/components/pricing-slider"
import { DeadlineCTA } from "@/components/deadline-cta"
import { Reveal } from "@/components/scroll-reveal"
import { 
  TrendingUp, 
  Zap,
  Target,
  Check,
  Star
} from "lucide-react"

export const metadata = {
  title: "Dev Landing Page - ChatFPL AI",
  description: "Test landing page for new design",
}

export default function DevLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Grid pattern — fixed behind everything, green glow varies per section */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <DevHeader />

      {/* Hero Section */}
      <section 
        className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black pt-32 pb-20"
      >
        {/* Looping Mux HLS background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <DevHeroVideoBg />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/50 to-black/80"
          aria-hidden
        />

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          .hero-fadein {
            animation: fadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}</style>

        <div className="relative z-10 container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8 -mt-40 sm:mt-0">

            {/* Announcement pill */}
            <div className="flex justify-center hero-fadein" style={{ animationDelay: '0.1s' }}>
              <div className="relative inline-flex rounded-full">
                <div
                  className="glow-border-mask pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    padding: "1px",
                    background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.08),#00FFFF,rgba(255,255,255,0.08),#00FF87)",
                    backgroundSize: "220% 220%",
                    animation: "glow_scroll 5s linear infinite",
                  }}
                />
              <Link
                href="/signup"
                className="relative inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:brightness-110"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold text-[#08020E]"
                  style={{
                    background: 'linear-gradient(to right, #00FF87, #00FFFF)',
                  }}
                >
                  New
                </span>
                <span className="text-gray-200">Get 20 free messages - no card needed</span>
                <svg className="h-3.5 w-3.5 text-[#00FF87]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              </div>
            </div>

            <h1 className="hero-fadein font-bold leading-[1.1] tracking-tighter text-white" style={{ fontSize: 'clamp(36px, 6vw, 68px)', animationDelay: '0.25s' }}>
              Chat with your{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(to right, #00ff85, #02efff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Fantasy Premier League AI Assistant
              </span>
            </h1>

            <p className="hero-fadein text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.4s' }}>
              Ask live FPL questions. Get instant AI answers powered by real stats
              and natural conversation. Dominate your mini-league with data-driven insights.
            </p>

            <div className="hero-fadein flex flex-col items-center gap-5" style={{ animationDelay: '0.55s' }}>
              {/* CTA button with liquid glass border */}
              <div
                className="inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <Link
                  href="/signup"
                  className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-[#08020E]"
                  style={{ background: 'linear-gradient(to right, #00FF87, #00FFFF)' }}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 2.4s linear infinite" }} />
                  Start Chatting for Free
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/70">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/70">Instant access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section — replaced with interactive showcase */}
      <ChatShowcase />

      {/* 3D Player Carousel */}
      <PlayerCarousel />

      {/* Query Carousel — player showcase with live API data */}
      <QueryCarousel />

      {/* Why ChatFPL — scroll-animated timeline */}
      <WhyChatFPL />

      {/* Pricing Section */}
      <PricingSlider />

      {/* Deadline Countdown CTA */}
      <DeadlineCTA />

      {/* HIDDEN BELOW — kept for reference only */}
      {false && <div className="grid gap-6 md:grid-cols-3">
            {/* Free Trial */}
            <Reveal delay={0.1}>
            <Card className="border-gray-700 bg-black transition-all hover:border-[#A855F7] h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Free Trial</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  Perfect for trying out ChatFPL AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#A855F7]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">20 free messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#A855F7]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#A855F7]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Limited support</span>
                  </div>
                </div>
                <Link 
                  href="/signup"
                  className="block w-full px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold text-center hover:bg-gradient-to-r hover:from-[#00FF87] hover:to-[#00FFFF] hover:text-[#1A0E24] hover:border-transparent hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Get Started
                </Link>
              </CardContent>
            </Card>
            </Reveal>

            {/* Premium - Most Popular */}
            <Reveal delay={0.2}>
            <Card className="relative border-[#00FF87] bg-black shadow-xl shadow-[#00FF87]/20 h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#00FF87] text-gray-900 font-bold px-4 py-1">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-white">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£7.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  For serious FPL managers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FF86]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">100 messages per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FF86]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FF86]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Priority support</span>
                  </div>
                </div>
                <Link 
                  href="/signup"
                  className="block w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#1a0e24] font-bold text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
                >
                  Subscribe
                </Link>
              </CardContent>
            </Card>
            </Reveal>

            {/* Elite */}
            <Reveal delay={0.3}>
            <Card className="border-gray-700 bg-black transition-all hover:border-[#00FFFF] h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Elite</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£14.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  For elite FPL competitors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FFFF]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">500 messages per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FFFF]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#00FFFF]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Priority support</span>
                  </div>
                </div>
                <Link 
                  href="/signup"
                  className="block w-full px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold text-center hover:bg-gradient-to-r hover:from-[#00FF87] hover:to-[#00FFFF] hover:text-[#1A0E24] hover:border-transparent hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Subscribe
                </Link>
              </CardContent>
            </Card>
            </Reveal>
          </div>}

      {/* FAQ Link */}
      <section className="relative px-4 py-16 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 50% 50%, rgba(0,255,135,0.05) 0%, transparent 70%)" }} />
        <Reveal>
          <p className="text-white/40 text-sm mb-4">Got questions?</p>
          <Link
            href="/faq"
            className="inline-block px-8 py-3 rounded-full font-semibold text-sm text-black transition-all hover:brightness-110 hover:-translate-y-0.5 shadow-[0_0_24px_rgba(0,255,200,0.25)]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            View FAQ →
          </Link>
        </Reveal>
      </section>
    </div>
  )
}




