"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Target, Megaphone, BarChart2, Lock, CheckCircle2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Conversation = {
  id: string
  type: string
  title: string
  updatedAt: Date
}

type Props = {
  projectId: string
  projectName: string
  conversations: Conversation[]
  hasBrief: boolean
}

export function ChatLeftPanel({ projectId, projectName, conversations, hasBrief }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const onboardingConv = conversations.find((c) => c.type === "ONBOARDING")
  const campaignConv = conversations.find((c) => c.type === "CAMPAIGN")

  const isActiveOnboarding = onboardingConv
    ? pathname === `/chat/${projectId}/${onboardingConv.id}`
    : false
  const isActiveCampaign = campaignConv
    ? pathname === `/chat/${projectId}/${campaignConv.id}`
    : false

  async function handleCampaignClick() {
    if (!hasBrief || creating) return
    if (campaignConv) {
      router.push(`/chat/${projectId}/${campaignConv.id}`)
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) return
      const { conversationId } = await res.json()
      router.push(`/chat/${projectId}/${conversationId}`)
    } finally {
      setCreating(false)
    }
  }

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

      {/* Agency Team */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 min-h-0">
        <p className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your Agency Team
        </p>
        <nav className="space-y-0.5">
          {/* Onboarding */}
          {onboardingConv && (
            <Link
              href={`/chat/${projectId}/${onboardingConv.id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                isActiveOnboarding
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
              )}
            >
              <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Onboarding</span>
              {hasBrief && (
                <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-green-500" />
              )}
            </Link>
          )}

          {/* Marketing Campaign */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full block">
                  <button
                    onClick={handleCampaignClick}
                    disabled={!hasBrief || creating}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                      !hasBrief && "opacity-50 cursor-not-allowed",
                      isActiveCampaign
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : hasBrief
                          ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                          : "text-sidebar-foreground"
                    )}
                  >
                    <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{creating ? "Setting up…" : "Marketing"}</span>
                    {!hasBrief && (
                      <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </span>
              </TooltipTrigger>
              {!hasBrief && (
                <TooltipContent side="right">Complete onboarding to unlock</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Performance — future, locked */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full block">
                  <button
                    disabled
                    className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-sm opacity-50 cursor-not-allowed text-sidebar-foreground"
                  >
                    <BarChart2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Performance</span>
                    <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">Coming soon</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>
    </aside>
  )
}
