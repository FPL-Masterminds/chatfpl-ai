"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Menu, X } from "lucide-react"

export function DevHeader() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1A0E24]">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" onClick={closeMobileMenu}>
            <Image 
              src="/ChatFPL_AI_Logo.png" 
              alt="ChatFPL AI" 
              width={40} 
              height={40}
              className="h-10 w-auto md:h-12"
            />
          </Link>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-white">
                  Welcome {session?.user?.name?.split(" ")[0] || "User"}
                </span>
                <button className="px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold hover:bg-[#00FF87] hover:text-[#1A0E24] transition-all duration-300">
                  <Link href="/admin">Dashboard</Link>
                </button>
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#1A0E24] text-sm font-bold hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Log Out
                </button>
              </>
            ) : (
            <>
              <button className="px-4 py-2 text-white text-sm font-medium hover:text-[#00FF87] transition-colors">
                <Link href="/login">Login</Link>
              </button>
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#1A0E24] text-sm font-bold hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all duration-300 hover:-translate-y-0.5">
                <Link href="/signup">Sign Up</Link>
              </button>
            </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-[#00FF87] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-20 right-0 z-40 h-[calc(100vh-5rem)] w-64 bg-[#1A0E24]/95 backdrop-blur-lg border-l border-white/10 shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col p-6 space-y-6">
          {isLoggedIn ? (
            <>
              {/* Logged In Menu */}
              <div className="pb-4 border-b border-white/10">
                <p className="text-sm font-medium text-white">
                  Welcome {session?.user?.name?.split(" ")[0] || "User"}
                </p>
              </div>
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/chat"
                  onClick={closeMobileMenu}
                  className="text-base font-semibold text-[#00FF87] hover:text-[#00FF87]/80 transition-colors"
                >
                  ChatFPL AI
                </Link>
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="text-base font-semibold text-white hover:text-[#00FF87] transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
              <div className="pt-4 mt-auto">
                <button
                  onClick={() => {
                    closeMobileMenu()
                    signOut({ callbackUrl: "/login" })
                  }}
                  className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#1A0E24] text-sm font-bold hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all duration-300"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Logged Out Menu */}
              <div className="flex flex-col gap-3 mt-auto">
                <button className="w-full px-4 py-2 text-white text-sm font-medium border border-white/20 rounded-full hover:bg-white/10 transition-colors">
                  <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                </button>
                <button className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-[#00FF87] to-[#00FFFF] text-[#1A0E24] text-sm font-bold hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all duration-300">
                  <Link href="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

