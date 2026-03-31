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
import { Footer } from "@/components/footer"
import { 
  TrendingUp, 
  Zap,
  Target,
  Check,
  Star
} from "lucide-react"

export const metadata = {
  title: "ChatFPL AI - Your Fantasy Premier League AI Assistant",
  description: "Ask live FPL questions and get instant AI answers powered by real stats. Dominate your mini-league with data-driven insights.",
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
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

      <Footer />
    </div>
  )
}
