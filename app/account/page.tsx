import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, Crown, Zap } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Account Settings</h1>
            <p className="mt-2 text-muted-foreground">Manage your profile and subscription</p>
          </div>

          {/* Profile Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Current Subscription */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </div>
                <Badge className="bg-accent/20 text-accent">Free</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages per day</span>
                  <span className="font-semibold text-foreground">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages used today</span>
                  <span className="font-semibold text-foreground">3 / 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resets in</span>
                  <span className="font-semibold text-foreground">6 hours</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 font-semibold text-foreground">Upgrade to unlock more</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Pro Plan */}
                  <Card className="border-accent/30 bg-accent/5">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <CardTitle className="text-lg">Pro</CardTitle>
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-foreground">£4.99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>50 messages/day</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>Advanced AI insights</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>Priority support</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                        <Link href="/#pricing">Upgrade to Pro</Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Elite Plan */}
                  <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-accent" />
                        <CardTitle className="text-lg">Elite</CardTitle>
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-foreground">£9.99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>Unlimited messages</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>Premium AI insights</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        <span>Early access features</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href="/#pricing">Upgrade to Elite</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input id="confirm-new-password" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Update Password</Button>
            </CardFooter>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
