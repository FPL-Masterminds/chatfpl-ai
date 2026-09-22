import Link from "next/link"
import Image from "next/image"
import { Instagram, Youtube } from "lucide-react"
import { AnimatedGlow } from "@/components/animated-glow"

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black">
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
        <div className="grid gap-8 md:grid-cols-3 xl:grid-cols-6">
          <div className="md:col-span-3 xl:col-span-1 space-y-4">
            <Link href="/">
              <Image 
                src="/ChatFPL_AI_Logo.png" 
                alt="ChatFPL AI" 
                width={160} 
                height={40}
                className="h-8 md:h-10"
                style={{ width: "auto" }}
              />
            </Link>
            <p className="text-sm text-gray-300">AI-powered Fantasy Premier League assistant for smarter decisions.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              {[
                { href: "/",        label: "Home"       },
                { href: "/about",   label: "About"      },
                { href: "/faq",     label: "FAQ"        },
                { href: "/contact", label: "Contact Us" },
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
            <h3 className="mb-4 text-sm font-semibold text-white">Player Hubs</h3>
            <ul className="space-y-3">
              {[
                { href: "/fpl/captains",        label: "Captains Hub"           },
                { href: "/fpl/differentials",   label: "Differentials Hub"      },
                { href: "/fpl/comparisons",     label: "Head-to-Head Hub"       },
                { href: "/fpl/injuries",        label: "Injuries Hub"           },
                { href: "/fpl/transfer-trends", label: "Transfer Market Trends" },
                { href: "/fpl/fixtures",        label: "Fixture Difficulty"     },
                { href: "/fpl/gameweeks",       label: "DGW/BGW Planner"        },
                { href: "/fpl/teams",           label: "Browse by Club"         },
                { href: "/fpl/defcon",          label: "DEFCON Hub"             },
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
              <li>
                <a
                  href="https://uk.pinterest.com/chatfplai/fantasy-premier-league-chatfpl-ai-fpl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white transition-colors hover:text-[#00FF87] group"
                >
                  <svg
                    className="h-4 w-4 text-[#00FF87] transition-colors group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.03-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                    />
                  </svg>
                  Pinterest
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

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Our Network</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.fpleliteinsights.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#00FF87]"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0 animate-pulse"
                    style={{ background: "#00FF87", boxShadow: "0 0 8px 2px rgba(0,255,135,0.7)" }}
                  />
                  FPL Elite Insights
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8">
          <p className="mb-4 text-center text-xs text-white/40 leading-relaxed">
            ChatFPL AI offers live Fantasy Premier League statistics and intelligent analysis to help guide your decisions. Although results may vary, our data-driven insights are built to enhance your strategy and performance across every gameweek.
          </p>
          <p className="text-center text-xs text-white/40">&copy; {new Date().getFullYear()} ChatFPL.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
