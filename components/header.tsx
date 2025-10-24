import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold">
            <span className="text-foreground">Chat</span>
            <span className="text-accent">FPL</span>
            <span className="text-muted-foreground">.ai</span>
          </div>
        </Link>

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

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
