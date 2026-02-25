"use client"

import {
  BarChart2,
  FileText,
  Globe,
  ImageIcon,
  Megaphone,
  Search,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Tool = {
  id: string
  name: string
  description: string
  icon: React.ElementType
  status: "available" | "coming-soon"
}

const AGENT_TOOLS: Tool[] = [
  {
    id: "campaign-creator",
    name: "Campaign Creator",
    description: "Generate full Facebook ad campaigns from a brief",
    icon: Megaphone,
    status: "available",
  },
  {
    id: "ad-copy",
    name: "Ad Copy Generator",
    description: "Write headlines, primary text, and CTAs",
    icon: FileText,
    status: "available",
  },
  {
    id: "audience-research",
    name: "Audience Research",
    description: "Identify interest-based and lookalike audiences",
    icon: Target,
    status: "available",
  },
  {
    id: "performance-analysis",
    name: "Performance Analysis",
    description: "Analyze ROAS, CTR, CPA and surface insights",
    icon: BarChart2,
    status: "available",
  },
  {
    id: "image-generator",
    name: "Image Generator",
    description: "Generate ad creatives and banners",
    icon: ImageIcon,
    status: "coming-soon",
  },
  {
    id: "competitor-research",
    name: "Competitor Research",
    description: "Analyze competitor ad strategies",
    icon: Search,
    status: "coming-soon",
  },
  {
    id: "ab-testing",
    name: "A/B Testing",
    description: "Set up and monitor split tests automatically",
    icon: Zap,
    status: "available",
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web for market trends and data",
    icon: Globe,
    status: "available",
  },
]

export function ChatRightPanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-sidebar-foreground">Agent Tools</span>
      </div>

      {/* Tools list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        <p className="px-1 mb-3 text-xs text-muted-foreground">
          Tools available to the current agent
        </p>
        <div className="space-y-1">
          {AGENT_TOOLS.map((tool, i) => (
            <div key={tool.id}>
              <div className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-sidebar-accent transition-colors cursor-default">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <tool.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-sidebar-foreground leading-tight">
                      {tool.name}
                    </p>
                    {tool.status === "coming-soon" && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {tool.description}
                  </p>
                </div>
              </div>
              {i < AGENT_TOOLS.length - 1 && (
                <Separator className="mx-2 my-0.5 opacity-50" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">
            {AGENT_TOOLS.filter((t) => t.status === "available").length}
          </span>{" "}
          tools active ·{" "}
          <span className="text-foreground font-medium">
            {AGENT_TOOLS.filter((t) => t.status === "coming-soon").length}
          </span>{" "}
          coming soon
        </p>
      </div>
    </aside>
  )
}
