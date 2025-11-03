"use client"

import { useState, useEffect, useRef } from "react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Sparkles, User, Menu, LogOut, MessageSquarePlus, Trash2, MessageSquare, X } from "lucide-react"
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

type Conversation = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  messages: Message[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Desktop starts closed
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conversationId: string } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [userFirstName, setUserFirstName] = useState<string>("there")

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messagesUsed, setMessagesUsed] = useState(0)
  const [messagesLimit, setMessagesLimit] = useState(5)
  const [userPlan, setUserPlan] = useState<string>("Free")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 25 welcome message variations
  const welcomeMessages = [
    "Hi {firstName}! ChatFPL AI here. What FPL questions can I help you with today?",
    "Welcome back, {firstName}! I'm ChatFPL AI - ask me anything about Fantasy Premier League.",
    "Hey {firstName}! ChatFPL AI ready to help. Player stats, transfers, captains - just ask!",
    "{firstName}, let's talk FPL! I'm ChatFPL AI, your AI assistant for all things Fantasy Premier League.",
    "Hello {firstName}! ChatFPL AI here with live FPL data. What would you like to know?",
    "Hi there, {firstName}! I'm ChatFPL AI - here to help with your FPL decisions. Fire away!",
    "{firstName}! ChatFPL AI at your service. Need transfer advice, captain picks, or player analysis?",
    "Welcome, {firstName}! ChatFPL AI here. Let's dive into some FPL strategy together.",
    "Hey {firstName}! I'm ChatFPL AI - powered by live FPL data. What's on your mind?",
    "Hi {firstName}! ChatFPL AI ready to assist. Ask me about players, fixtures, or strategy!",
    "{firstName}, good to see you! I'm ChatFPL AI - your FPL companion. What can I help with?",
    "Hello {firstName}! ChatFPL AI here with the latest FPL insights. What would you like to explore?",
    "Hey there, {firstName}! I'm ChatFPL AI - let's optimize your Fantasy Premier League team!",
    "{firstName}! ChatFPL AI reporting for duty. Player stats, differentials, captains - I've got you covered.",
    "Hi {firstName}! I'm ChatFPL AI, here to help you dominate your FPL mini-leagues. What's your question?",
    "Welcome {firstName}! ChatFPL AI ready with live data and expert FPL advice. Ask away!",
    "{firstName}, let's get started! I'm ChatFPL AI - here for all your Fantasy Premier League needs.",
    "Hey {firstName}! ChatFPL AI here. Whether it's transfers, tactics, or stats - I'm here to help.",
    "Hi {firstName}! I'm ChatFPL AI, your FPL AI assistant. What gameweek decisions can I help with?",
    "{firstName}! ChatFPL AI at the ready. Need help with your FPL team? Just ask!",
    "Hello there, {firstName}! ChatFPL AI here with real-time FPL data. What's your first question?",
    "Hey {firstName}! I'm ChatFPL AI - let's make some smart FPL moves together. What do you need?",
    "{firstName}, welcome! ChatFPL AI here to help you climb those ranks. Fire away with your questions!",
    "Hi {firstName}! ChatFPL AI ready to analyze players, fixtures, and strategy. What would you like to know?",
    "{firstName}! I'm ChatFPL AI, your Fantasy Premier League companion. Let's talk tactics, transfers, or captains!"
  ]

  const getRandomWelcomeMessage = (firstName: string) => {
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length)
    return welcomeMessages[randomIndex].replace(/{firstName}/g, firstName)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load all conversations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user's first name first
        let firstName = "there"
        const accountResponse = await fetch("/api/account")
        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          firstName = accountData.user?.name?.split(' ')[0] || "there"
          setUserFirstName(firstName)
        }

        // Load all conversations
        const convsResponse = await fetch("/api/chat/conversations")
        if (convsResponse.ok) {
          const convsData = await convsResponse.json()
          setConversations(convsData.conversations || [])
        }

        // Load most recent conversation
        const historyResponse = await fetch("/api/chat/history")
        if (historyResponse.ok) {
          const data = await historyResponse.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })))
            setConversationId(data.conversationId)
          } else {
            // No history, show random welcome message with firstName
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: getRandomWelcomeMessage(firstName),
              timestamp: new Date(),
            }])
          }
        }
      } catch (error) {
        console.error("Failed to load chat data:", error)
        // Show welcome message on error with firstName
        const firstName = userFirstName || "there"
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: getRandomWelcomeMessage(firstName),
          timestamp: new Date(),
        }])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadData()
  }, [])

  // Start a new chat
  const startNewChat = async () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: getRandomWelcomeMessage(userFirstName),
      timestamp: new Date(),
    }])
    setConversationId(null)
    setInput("")
    setIsSidebarOpen(false)
    
    // Reload conversations list
    const response = await fetch("/api/chat/conversations")
    if (response.ok) {
      const data = await response.json()
      setConversations(data.conversations || [])
    }
  }

  // Load a specific conversation
  const loadConversation = async (convId: string) => {
    try {
      const conv = conversations.find(c => c.id === convId)
      if (conv && conv.messages) {
        setMessages(conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
        setConversationId(convId)
        setIsSidebarOpen(false)
      }
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }

  // Delete a conversation
  const deleteConversation = async (convId: string) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      })

      if (response.ok) {
        // Remove from list
        setConversations(prev => prev.filter(c => c.id !== convId))
        
        // If we deleted the current conversation, start a new one
        if (convId === conversationId) {
          startNewChat()
        }
      }
      setContextMenu(null)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  // Rename a conversation
  const renameConversation = async (convId: string, newTitle: string) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, title: newTitle }),
      })

      if (response.ok) {
        // Update in list
        setConversations(prev => 
          prev.map(c => c.id === convId ? { ...c, title: newTitle } : c)
        )
      }
      setRenamingId(null)
      setRenameValue("")
    } catch (error) {
      console.error("Failed to rename conversation:", error)
    }
  }

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, convId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, conversationId: convId })
  }

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu])

  // Parse markdown images in message content
  const renderMessageContent = (content: string) => {
    // Split by markdown image syntax: ![alt](url)
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/)
    const elements: (string | React.ReactElement)[] = []
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0 && parts[i]) {
        // Regular text
        elements.push(parts[i])
      } else if (i % 3 === 1) {
        // Alt text (parts[i]) and URL (parts[i+1])
        const alt = parts[i]
        const url = parts[i + 1]
        if (url) {
          elements.push(
            <img 
              key={`img-${i}`}
              src={url} 
              alt={alt} 
              className="inline-block h-12 w-auto rounded mx-1"
            />
          )
        }
        i++ // Skip the URL part as we've used it
      }
    }
    
    return elements
  }

  useEffect(() => {
    // Fetch current usage on page load
    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/account")
        if (response.ok) {
          const data = await response.json()
          setMessagesUsed(data.usage.messages_used)
          setMessagesLimit(data.usage.messages_limit)
          setUserPlan(data.subscription?.plan || "Free")
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error)
      }
    }
    fetchUsage()
  }, [])

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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setConversationId(data.conversation_id)
      setMessagesUsed(data.messages_used)
      setMessagesLimit(data.messages_limit)
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message || "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while loading history
  if (isLoadingHistory) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your chat history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-full md:w-1/4 border-r border-border bg-card transition-transform duration-300`}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h2 className="font-semibold text-foreground">Chat History</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2">
          <Button onClick={startNewChat} className="w-full justify-start gap-2" variant="outline">
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-1 p-2">
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`relative rounded-lg hover:bg-accent/10 ${conv.id === conversationId ? 'bg-accent/20' : ''}`}
                  onContextMenu={(e) => handleContextMenu(e, conv.id)}
                  style={{ overflow: 'visible' }}
                >
                  {renamingId === conv.id ? (
                    <div className="p-3">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameConversation(conv.id, renameValue)
                          } else if (e.key === "Escape") {
                            setRenamingId(null)
                            setRenameValue("")
                          }
                        }}
                        onBlur={() => {
                          if (renameValue.trim()) {
                            renameConversation(conv.id, renameValue)
                          } else {
                            setRenamingId(null)
                            setRenameValue("")
                          }
                        }}
                        autoFocus
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer p-3"
                      onClick={() => loadConversation(conv.id)}
                    >
                      <p className="text-sm font-medium text-foreground" style={{ wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                        {(() => {
                          const text = conv.title || conv.messages[0]?.content || "New Chat"
                          if (text.length > 47) {
                            return text.substring(0, 47) + "..."
                          }
                          return text
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Overlay for backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border border-border bg-card shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent/10"
            onClick={() => {
              const conv = conversations.find(c => c.id === contextMenu.conversationId)
              if (conv) {
                setRenamingId(conv.id)
                setRenameValue(conv.title || conv.messages[0]?.content.substring(0, 50) || "")
              }
              setContextMenu(null)
            }}
          >
            Rename
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent/10"
            onClick={() => deleteConversation(contextMenu.conversationId)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Link href="/">
              <Image 
                src="/ChatFPL_AI_Logo.png" 
                alt="ChatFPL AI" 
                width={40} 
                height={40}
                className="h-8 w-auto md:h-10"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm md:flex">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-foreground">
              {messagesLimit === 999999
                ? "Unlimited messages"
                : `${messagesUsed}/${messagesLimit} messages used`}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={startNewChat}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin">Account Settings</Link>
              </DropdownMenuItem>
              {userPlan.toLowerCase() === "free" && (
                <DropdownMenuItem asChild>
                  <Link href="/earn-messages" className="text-[#FFD700]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Earn Messages
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/#pricing">Upgrade Plan</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Chat Messages - scrollable */}
      <div className="flex-1 overflow-y-auto px-4">
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
                            <div className="text-sm leading-relaxed space-y-2">
                              {message.content.split('\n\n').map((paragraph, i) => (
                                <p key={i} className="whitespace-pre-wrap">
                                  {paragraph.split('\n').map((line, j) => (
                                    <span key={j}>
                                      {renderMessageContent(line)}
                                      {j < paragraph.split('\n').length - 1 && <br />}
                                    </span>
                                  ))}
                                </p>
                              ))}
                            </div>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/40 bg-card/50 p-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                          placeholder="Ask about FPL players, transfers, captains..."
                          className="flex-1 bg-background min-h-[44px] max-h-[200px] resize-none"
                          disabled={isLoading}
                          rows={1}
                        />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            ChatFPL can make mistakes. Verify important information.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
