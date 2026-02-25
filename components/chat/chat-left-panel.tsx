"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Plus, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/format-date"

type Conversation = {
  id: string
  title: string
  updatedAt: Date
}

type Props = {
  projectId: string
  projectName: string
  conversations: Conversation[]
}

export function ChatLeftPanel({ projectId, projectName, conversations }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 px-3 border-b border-border">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-sidebar-foreground truncate">{projectName}</span>
        </Link>
        <Link
          href="/dashboard/projects"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3">
        <Button className="w-full justify-start gap-2" variant="outline" size="sm" asChild>
          <Link href={`/chat/${projectId}/new`}>
            <Plus className="h-4 w-4" />
            New chat
          </Link>
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 min-h-0">
        <p className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent chats
        </p>

        {conversations.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground italic">No conversations yet</p>
        ) : (
          <nav className="space-y-0.5">
            {conversations.map((conv) => {
              const active = pathname === `/chat/${projectId}/${conv.id}`
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${projectId}/${conv.id}`}
                  className={cn(
                    "flex items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sidebar-foreground leading-tight">{conv.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(conv.updatedAt)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </aside>
  )
}
