import Link from "next/link"
import Image from "next/image"
import { Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.png)" }}
      />
      <div className="absolute inset-0 bg-primary/40" />
      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Image 
              src="/ChatFPL_Logo.png" 
              alt="ChatFPL" 
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
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 transition-colors hover:text-accent"
                >
                  <Twitter className="h-5 w-5" />
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
          <p>&copy; 2025 ChatFPL.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
