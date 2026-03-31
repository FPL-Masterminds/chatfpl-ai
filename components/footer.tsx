import Link from "next/link"
import Image from "next/image"
import { Instagram, Youtube } from "lucide-react"
import { AnimatedGlow } from "@/components/animated-glow"

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black border-t border-white/[0.06]">
      {/* Grid + animated green glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatedGlow
          color="rgba(0,255,135,0.10)"
          size="60% 70%"
          duration={22}
          waypoints={[
            { x: "10%",  y: "-10%" },
            { x: "-15%", y: "15%"  },
            { x: "20%",  y: "10%"  },
            { x: "-5%",  y: "-15%" },
          ]}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Image 
              src="/ChatFPL_AI_Logo.png" 
              alt="ChatFPL AI" 
              width={48} 
              height={48}
              className="h-8 w-auto md:h-12"
            />
            <p className="text-sm text-gray-300">AI-powered Fantasy Premier League assistant for smarter decisions.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              {[
                { href: "/",         label: "Home"        },
                { href: "/about",    label: "About"       },
                { href: "/playbook", label: "The Playbook"},
                { href: "/contact",  label: "Contact Us"  },
                { href: "/faq",      label: "FAQ"         },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87] group">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 animate-pulse"
                      style={{ background: "#00FF87", boxShadow: "0 0 8px 2px rgba(0,255,135,0.7)" }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
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
                  className="flex items-center gap-2 text-sm text-white transition-colors hover:text-[#00FF87] group"
                >
                  <Instagram className="h-4 w-4 text-[#00FF87] transition-colors group-hover:text-white" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ChatFPL_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white transition-colors hover:text-[#00FF87] group"
                >
                  <svg className="h-4 w-4 text-[#00FF87] transition-colors group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
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
                  className="flex items-center gap-2 text-sm text-white transition-colors hover:text-[#00FF87] group"
                >
                  <Youtube className="h-4 w-4 text-[#00FF87] transition-colors group-hover:text-white" />
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: "Privacy Policy"   },
                { href: "/terms",   label: "Terms of Service" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 animate-pulse"
                      style={{ background: "#00FF87", boxShadow: "0 0 8px 2px rgba(0,255,135,0.7)" }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <p className="mb-4 text-center text-xs text-white/40 leading-relaxed">
            ChatFPL AI offers live Fantasy Premier League statistics and intelligent analysis to help guide your decisions. Although results may vary, our data-driven insights are built to enhance your strategy and performance across every gameweek.
          </p>
          <p className="text-center text-xs text-white/40">&copy; 2025 ChatFPL AI.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
