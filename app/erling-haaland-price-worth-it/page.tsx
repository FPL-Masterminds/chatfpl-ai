import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Is Erling Haaland worth his price this season? | ChatFPL AI",
  description: "Discover if Erling Haaland is worth his premium FPL price tag. ChatFPL AI analyzes his statistics, form, fixtures, and value for money to help you make the best transfer decision.",
}

export default function HaalandPricePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b px-4 pt-24 pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="container relative mx-auto max-w-5xl">
          <div className="text-center">
            <h1 
              className="mb-6 text-balance font-bold leading-[1.1] tracking-tighter text-white"
              style={{ fontSize: '60px' }}
            >
              Is Erling Haaland worth his price this season?
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold text-white">
              Full video analysis and ChatFPL AI insights coming soon
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="bg-white px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="border-[#00FF87] bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-900">
                📹 Video Analysis Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                We're creating comprehensive video content demonstrating how ChatFPL AI answers this question using real-time FPL data.
              </p>
              <p className="text-gray-600">
                This page will feature a full breakdown of Erling Haaland's price-to-performance ratio, comparing his cost against expected points, form, fixtures, and alternative premium forwards.
              </p>
              <div className="pt-6">
                <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/signup">Try ChatFPL AI Now - Ask Your Own Questions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="mb-4 text-4xl font-bold uppercase"
            style={{ 
              fontFamily: "'Futura Maxi CG', sans-serif",
              WebkitTextStroke: '6px #2E0032',
              paintOrder: 'stroke fill'
            }}
          >
            <span style={{ color: 'white' }}>Ready to Ask Your </span>
            <span style={{ color: '#00FFFF' }}>Own </span>
            <span style={{ color: '#00FF86' }}>Questions</span>
            <span style={{ color: 'white' }}>?</span>
          </h2>
          <p className="mb-8 text-lg font-semibold" style={{ color: '#4B5563' }}>
            Get instant, data-driven FPL insights for any player, fixture, or strategy question. 
            Start with 5 free messages - no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/signup">Start your 5-message free trial today</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm" style={{ color: '#4B5563' }}>
            Join thousands of FPL managers using ChatFPL AI to gain a competitive edge
          </p>
        </div>
      </section>
    </div>
  )
}

