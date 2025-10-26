"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" onClick={closeMobileMenu}>
            <Image 
              src="/ChatFPL_Logo.png" 
              alt="ChatFPL" 
              width={40} 
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Logged Out */}
          {!isLoggedIn && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/#features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                Pricing
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                Contact
              </Link>
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-foreground">
                  Welcome {session?.user?.name?.split(" ")[0] || "User"}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
                <Button size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/chat">ChatFPL</Link>
                </Button>
                <Button 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-accent transition-colors"
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
        className={`fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-l border-border shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col p-6 space-y-6">
          {isLoggedIn ? (
            <>
              {/* Logged In Menu */}
              <div className="pb-4 border-b border-border">
                <p className="text-sm font-medium text-foreground">
                  Welcome {session?.user?.name?.split(" ")[0] || "User"}
                </p>
              </div>
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/chat"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  ChatFPL
                </Link>
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-foreground hover:text-accent transition-colors"
                >
                  Admin Dashboard
                </Link>
              </nav>
              <div className="pt-4 mt-auto">
                <Button
                  onClick={() => {
                    closeMobileMenu()
                    signOut({ callbackUrl: "/login" })
                  }}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700"
                >
                  Log Out
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Logged Out Menu */}
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/#features"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-foreground hover:text-accent transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#pricing"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-foreground hover:text-accent transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-foreground hover:text-accent transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="text-base font-medium text-foreground hover:text-accent transition-colors"
                >
                  Contact
                </Link>
              </nav>
              <div className="flex flex-col gap-3 pt-4 border-t border-border mt-auto">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                </Button>
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/signup" onClick={closeMobileMenu}>Get Started</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
