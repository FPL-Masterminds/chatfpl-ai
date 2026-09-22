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
                  href="https://www.facebook.com/profile.php?id=61594734597851&locale=en_GB"
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
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  Facebook
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
              <li>
                <a
                  href="https://bsky.app/profile/chatfplai.bsky.social"
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
                      d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026"
                    />
                  </svg>
                  Bluesky
                </a>
              </li>
              <li>
                <a
                  href="https://www.threads.com/@chatfpl_ai"
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
                      d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"
                    />
                  </svg>
                  Threads
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
