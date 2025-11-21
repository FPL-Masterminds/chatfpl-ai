import Link from "next/link"
import Image from "next/image"
import { Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-gray-700 bg-[#1A0E24]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Image 
              src="/ChatFPL_AI_Logo.png" 
              alt="ChatFPL AI" 
              width={48} 
              height={48}
              className="h-12 w-auto"
            />
            <p className="text-sm text-gray-300">AI-powered Fantasy Premier League assistant for smarter decisions.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/playbook" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  The Playbook
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Social</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.instagram.com/chatfpl_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87]"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ChatFPL_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@ChatFPL_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87]"
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="mb-4 text-center text-xs text-gray-400 leading-relaxed">
            ChatFPL AI offers live Fantasy Premier League statistics and intelligent analysis to help guide your decisions. Although results may vary, our data-driven insights are built to enhance your strategy and performance across every gameweek.
          </p>
          <p className="text-center text-xs text-gray-400">&copy; 2025 ChatFPL AI.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
