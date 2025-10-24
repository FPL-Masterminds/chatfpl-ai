"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Sparkles, User, Menu, LogOut } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your FPL AI assistant. Ask me anything about Fantasy Premier League - player stats, transfer advice, captain picks, or strategy tips!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a demo response. In production, this would connect to the AI SDK to provide real FPL insights based on live data from the official FPL API.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/50 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold">
            <span className="text-foreground">Chat</span>
            <span className="text-accent">FPL</span>
            <span className="text-muted-foreground">.ai</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm md:flex">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-foreground">Free Plan: 3/5 messages today</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/account">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/#pricing">Upgrade Plan</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="mx-auto max-w-3xl space-y-6 py-8">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 border border-accent/30 bg-accent/10">
                  <AvatarFallback className="bg-transparent">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[80%] border-border/50 p-4 ${
                  message.role === "user"
                    ? "bg-accent/10 text-foreground"
                    : "bg-card/50 text-foreground backdrop-blur-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </Card>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 border border-border bg-muted">
                  <AvatarFallback className="bg-transparent">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 border border-accent/30 bg-accent/10">
                <AvatarFallback className="bg-transparent">
                  <Sparkles className="h-4 w-4 text-accent" />
                </AvatarFallback>
              </Avatar>
              <Card className="border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-accent" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/40 bg-card/50 p-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about FPL players, transfers, captains..."
              className="flex-1 bg-background"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ChatFPL can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
