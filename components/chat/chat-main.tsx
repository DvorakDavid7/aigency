"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Bot, Search, User, Facebook } from "lucide-react"
import { Markdown } from "@/components/ui/markdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

type Props = {
  projectId: string
  projectName: string
  fbConnected: boolean
  hasBrief?: boolean
  conversationId?: string
  initialMessages?: UIMessage[]
}

export function ChatMain({ projectId, projectName, fbConnected, hasBrief, conversationId, initialMessages }: Props) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId, ...(conversationId ? { conversationId } : {}) },
    }),
    ...(initialMessages ? { messages: initialMessages } : {}),
    onFinish: () => {
      window.dispatchEvent(new CustomEvent("aigency:artifact-updated"))
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function send() {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  return (
    <main className="flex flex-1 flex-col min-w-0 bg-background">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">Marketing Agent</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {projectName} · {isLoading ? "Thinking…" : "Ready"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Welcome message shown when no messages yet */}
          {messages.length === 0 && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                Hi! I&apos;m your AI marketing agent. I can help you create and optimize Facebook ad
                campaigns, generate ad copy, analyze performance, and more. What would you like to
                work on today?
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <Markdown
                    content={msg.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
                  />
                ) : (
                  msg.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Facebook connect banner */}
      {!fbConnected && (
        <div className="shrink-0 border-t border-border bg-muted/30 px-6 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Connect your Facebook ad account to start running campaigns.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() =>
                authClient.linkSocial({
                  provider: "facebook",
                  callbackURL: `/facebook/select-account?projectId=${projectId}`,
                })
              }
            >
              <Facebook className="mr-2 h-4 w-4" />
              Connect
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {/* Quick-action chips (shown when brief exists and not mid-conversation) */}
          {hasBrief && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => {
                  setInput("Please analyze my competitors — browse the web and create a comprehensive competition analysis artifact.")
                  textareaRef.current?.focus()
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Search className="h-3 w-3" />
                Analyze competitors
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 focus-within:border-primary/50 focus-within:bg-background transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Marketing Agent..."
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[24px] leading-relaxed"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              disabled={!input.trim() || isLoading}
              onClick={send}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </main>
  )
}
