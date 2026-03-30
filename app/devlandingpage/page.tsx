import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"
import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChatShowcase } from "@/components/chat-showcase"
import PlayerCarousel from "@/components/player-carousel"
import { QueryCarousel } from "@/components/query-carousel"
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
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:brightness-110"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(0,255,133,0.35)',
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
                  className="block rounded-full px-10 py-4 font-bold text-lg text-[#08020E]"
                  style={{ background: 'linear-gradient(to right, #00FF87, #00FFFF)' }}
                >
                  Start Chatting for Free
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-400">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-400">Instant access</span>
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

      {/* Features Section */}
      <section id="features" className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
                <span className="text-white">Everything You Need For </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #00ff85, #02efff)', WebkitBackgroundClip: 'text' }}>FPL Success</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg text-gray-300">Powered by real-time data and AI intelligence</p>
            </Reveal>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Reveal delay={0.1}>
              <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
                <CardContent className="p-6 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white">
                      <Image src="/player_images/circular/bukayo_saka_circular.png" alt="Live Data" fill className="object-cover" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">Live Data</h3>
                  <p className="mb-4 text-sm text-[#00FF87] font-semibold">Give me some live data on Bukaya Saka</p>
                  <p className="text-sm text-gray-400">Connects to the official FPL API for real-time stats, fixtures, player performance data, and live gameweek updates.</p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delay={0.2}>
              <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
                <CardContent className="p-6 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white">
                      <Image src="/player_images/circular/mickey_van_de_ven_circular.png" alt="Expert Knowledge" fill className="object-cover" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">Expert Knowledge</h3>
                  <p className="mb-4 text-sm text-[#00FF87] font-semibold">Should I captain Micky van de Ven?</p>
                  <p className="text-sm text-gray-400">Smart captain advice using live data, upcoming fixtures, recent form, and ownership trends to maximise your points.</p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delay={0.3}>
              <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
                <CardContent className="p-6 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white">
                      <Image src="/player_images/circular/mateta_circular.png" alt="Natural Chat" fill className="object-cover" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">Natural Chat</h3>
                  <p className="mb-4 text-sm text-[#00FF87] font-semibold">Is Jean-Philippe Mateta worth the transfer?</p>
                  <p className="text-sm text-gray-400">Ask anything from 'Recommend the top 3 performing strikers' to 'Compare van Dijk vs Gabriel' in plain English.</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
                <span className="text-white">What </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #00ff85, #02efff)', WebkitBackgroundClip: 'text' }}>Users </span>
                <span style={{ color: '#00FF86' }}>Say</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg text-gray-300">Real feedback from FPL managers using ChatFPL AI</p>
            </Reveal>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <Reveal delay={0.1}>
            <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-[#00FF86]">
                    <Image
                      src="/player_images/circular/green_testimonial.png"
                      alt="James Mitchell"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5" viewBox="0 0 24 24" fill="#D4AF37">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">James Mitchell</h4>
                <Badge className="mb-3 bg-[#00FF87] text-gray-900 text-xs">PREMIUM SUBSCRIBER</Badge>
                <p className="text-sm italic text-gray-300">
                  "I asked ChatFPL AI for a detailed player comparison between Haaland and Joao Pedro. 
                  It gave me expected goals, form trends, and fixture difficulty - exactly what I needed."
                </p>
              </CardContent>
            </Card>
            </Reveal>

            {/* Testimonial 2 */}
            <Reveal delay={0.2}>
            <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-[#00FFFF]">
                    <Image
                      src="/player_images/circular/blue_testimonial.png"
                      alt="Sarah Davies"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5" viewBox="0 0 24 24" fill="#D4AF37">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">Sarah Davies</h4>
                <Badge className="mb-3 bg-[#00FFFF] text-gray-900 text-xs">CONTENT CREATOR</Badge>
                <p className="text-sm italic text-gray-300">
                  "I use ChatFPL AI to write my FPL YouTube scripts. It analyses the data and helps me 
                  create engaging content about captain picks and differentials in minutes."
                </p>
              </CardContent>
            </Card>
            </Reveal>

            {/* Testimonial 3 */}
            <Reveal delay={0.3}>
            <Card className="border-gray-700 bg-black transition-all hover:border-[#00FF87] h-full">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-[#A855F7]">
                    <Image
                      src="/player_images/circular/purple_testimonial.png"
                      alt="Marcus Ellis"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5" viewBox="0 0 24 24" fill="#D4AF37">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">Marcus Ellis</h4>
                <Badge className="mb-3 bg-[#A855F7] text-white text-xs">ELITE SUBSCRIBER</Badge>
                <p className="text-sm italic text-gray-300">
                  "Every gameweek I ask for transfer suggestions based on my team. ChatFPL AI considers 
                  fixtures, form, and my budget to give me 3-4 solid options with reasoning."
                </p>
              </CardContent>
            </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
                <span className="text-white">Simple </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #00ff85, #02efff)', WebkitBackgroundClip: 'text' }}>Transparent Pricing</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg text-gray-300">Choose the plan that fits your FPL ambitions</p>
            </Reveal>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
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
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
                <span className="text-white">Frequently </span>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #00ff85, #02efff)', WebkitBackgroundClip: 'text' }}>Asked Questions</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg text-gray-300">Everything you need to know about ChatFPL AI</p>
            </Reveal>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { v:"item-1",  q:"🤖 What is ChatFPL AI?", a:"ChatFPL AI is your intelligent Fantasy Premier League assistant powered by artificial intelligence and real-time FPL data. Simply ask any question about players, transfers, captains, fixtures, or strategy, and receive instant, data-driven answers to help you make smarter FPL decisions and climb the rankings." },
              { v:"item-2",  q:"🆓 Can I try it for free?", a:"Yes! Our Free plan includes 20 trial messages to experience ChatFPL AI with no credit card required. You can upgrade at any time or complete simple tasks to earn additional messages." },
              { v:"item-3",  q:"🎁 How do I earn extra messages on the Free plan?", a:"Free users can earn bonus messages by completing simple tasks like sharing ChatFPL AI on social media (X, Facebook, Reddit) or leaving a review. Each task rewards you with additional messages, up to a lifetime cap of 50 bonus messages. Visit your dashboard to see available rewards." },
              { v:"item-4",  q:"❓ What type of FPL questions can I ask?", a:"You can ask anything FPL-related: player statistics, captain picks, transfer advice, fixture analysis, differential suggestions, chip strategy, rule clarifications, price predictions, ownership trends, and much more. ChatFPL AI provides instant, data-driven answers backed by real-time Premier League data." },
              { v:"item-5",  q:"🔄 How often is the FPL data updated?", a:"ChatFPL AI uses live Fantasy Premier League data that updates continuously. Player prices update daily at 1:30 AM UK time, match statistics update within hours of the final whistle, and injury news is refreshed as official team announcements are made. You're always getting the most current information available." },
              { v:"item-6",  q:"📅 Do unused messages roll over to the next month?", a:"No, unused messages do not carry over. Premium users receive 100 messages each month, and Elite users receive 500 messages per month. Your message allowance resets on your renewal date, so make sure to use your messages before they expire." },
              { v:"item-7",  q:"⚠️ What happens if I run out of messages?", a:"If you've used all your messages for the current period, you can upgrade to a higher plan for more messages, or wait until your next renewal date when your allowance resets. Free users can also earn bonus messages by completing social sharing tasks." },
              { v:"item-8",  q:"💎 What's the difference between Premium and Elite?", a:"Premium gives you 100 messages per month for £7.99, perfect for regular FPL managers who want consistent support throughout the season. Elite offers 500 messages per month for £14.99, ideal for dedicated players, content creators, or those managing multiple teams who need extensive research capabilities." },
              { v:"item-9",  q:"❌ Can I cancel my subscription at any time?", a:"Yes! You can cancel your Premium or Elite subscription at any time from your account dashboard. Your access will continue until the end of your current billing period, and you won't be charged again. No cancellation fees or penalties." },
              { v:"item-10", q:"⚽ Can I use ChatFPL AI during gameweeks?", a:"Yes! ChatFPL AI is available 24/7, including during live gameweeks. You can get last-minute captain advice before the deadline, check injury updates, analyse fixture swings, or plan your transfers for the following week. The AI is always ready when you need it." },
              { v:"item-11", q:"📈 Does ChatFPL AI guarantee I'll climb the rankings?", a:"While ChatFPL AI provides data-driven insights and analysis to support better decisions, FPL involves unpredictability that no tool can eliminate. We give you the information edge - form trends, expected stats, fixture analysis - but ultimately, player performance and your strategic decisions determine your rank." },
              { v:"item-12", q:"💬 Can I ask follow-up questions?", a:"Yes! Each conversation with ChatFPL AI is contextual, meaning you can ask follow-up questions that build on previous answers. For example, after asking about Mohamed Salah's stats, you can immediately ask \"Should I captain him?\" or \"Compare him with Son Heung-min.\" Each follow-up costs one message." },
              { v:"item-13", q:"✏️ Is there a limit to how long my questions can be?", a:"While there's no strict character limit, we recommend keeping questions clear and concise for the best results. Instead of asking multiple questions in one message, break them into separate queries. For example, ask \"Who should I captain?\" first, then follow up with \"What about transfers?\" This helps the AI provide more focused, accurate responses." },
            ].map(({ v, q, a }, i) => (
              <Reveal key={v} delay={i * 0.05}>
                <AccordionItem value={v} className="rounded-lg !border !border-gray-700 bg-black px-6 shadow-sm hover:bg-white/5 transition-colors">
                  <AccordionTrigger className="text-left text-white hover:no-underline focus-visible:ring-0 focus-visible:ring-offset-0 [&[data-state=open]>svg]:text-[#00FF87] [&[data-state=open]:hover>svg]:text-gray-400">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">{a}</AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  )
}




