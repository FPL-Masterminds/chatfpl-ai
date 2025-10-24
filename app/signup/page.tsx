import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
            <CardDescription>Start your free trial with 5 messages per day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" required />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="mt-1" />
              <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Create Account</Button>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-accent hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
