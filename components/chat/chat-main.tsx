"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your AI marketing agent. I can help you create and optimize Facebook ad campaigns, generate ad copy, analyze performance, and more. What would you like to work on today?",
  },
]

type Props = {
  projectId: string
  projectName: string
}

export function ChatMain({ projectId, projectName }: Props) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // Auto-resize textarea
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
    if (!text) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Placeholder assistant response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I received your message. This is a placeholder response — AI integration coming soon.",
      }
      setMessages((prev) => [...prev, assistantMsg])
    }, 800)
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
            {projectName} · Ready
          </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              {/* Avatar */}
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

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 focus-within:border-primary/50 focus-within:bg-background transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message Marketing Agent..."
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[24px] leading-relaxed"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              disabled={!input.trim()}
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
