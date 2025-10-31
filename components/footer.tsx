import Link from "next/link"
import Image from "next/image"
import { Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
      />
      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Image 
              src="/ChatFPL_AI_Logo.png" 
              alt="ChatFPL AI" 
              width={48} 
              height={48}
              className="h-12 w-auto"
            />
            <p className="text-sm text-white/80">AI-powered Fantasy Premier League assistant for smarter decisions.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-white/80 transition-colors hover:text-accent">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-white/80 transition-colors hover:text-accent">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-white/80 transition-colors hover:text-accent">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-accent">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-accent">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Connect</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-white/80 transition-colors hover:text-accent">
                  Contact
                </Link>
              </li>
              <li className="flex gap-4 pt-2">
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 transition-colors hover:text-accent"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 transition-colors hover:text-accent"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t-2 border-white/20 pt-8 text-center text-sm text-white/80">
          <p>&copy; 2025 ChatFPL AI.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
