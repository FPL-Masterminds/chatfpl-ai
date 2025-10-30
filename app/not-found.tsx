import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/ChatFPL_Logo.png"
            alt="ChatFPL"
            width={200}
            height={60}
            priority
          />
        </div>

        {/* 404 Message */}
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mb-8 text-pretty text-muted-foreground">
          Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
        </p>

        {/* CTA Button */}
        <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/">Return to Homepage</Link>
        </Button>

        {/* Helpful Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm">
          <Link href="/chat" className="text-muted-foreground hover:text-accent transition-colors">
            ChatFPL
          </Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-accent transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-accent transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </div>
  )
}

