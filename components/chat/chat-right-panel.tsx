"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArtifactType = "BRIEF" | "AD_COPY" | "CAMPAIGN" | "IMAGE" | "REPORT" | "ACTION" | "COMPETITION"

export type CompetitorInfo = {
  name: string
  website?: string
  description: string
  strengths: string
  weaknesses: string
  adStrategy: string
}

export type CompetitionContent = {
  summary: string
  competitors: CompetitorInfo[]
  opportunities: string
  threats: string
  recommendations: string
}

export type BriefContent = {
  businessDescription: string
  product: string
  targetAudience: string
  uniqueSellingPoint: string
  goal: "LEADS" | "SALES" | "TRAFFIC" | "APP_INSTALLS"
  monthlyBudget: number // stored in cents
  location: string
  websiteUrl?: string
  analysis: string
}

export type ArtifactData = {
  id: string
  type: ArtifactType
  title: string
  content: unknown
  createdAt: string
  updatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  LEADS: "Leads",
  SALES: "Sales",
  TRAFFIC: "Website Traffic",
  APP_INSTALLS: "App Installs",
}

const TYPE_LABELS: Record<ArtifactType, string> = {
  BRIEF: "Business Brief",
  AD_COPY: "Ad Copy",
  CAMPAIGN: "Campaign",
  IMAGE: "Image",
  REPORT: "Report",
  ACTION: "Action",
  COMPETITION: "Competition Analysis",
}

// ─── Brief Sheet ──────────────────────────────────────────────────────────────

function BriefSheet({
  artifact,
  projectId,
  onClose,
  onSaved,
}: {
  artifact: ArtifactData
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const raw = artifact.content as BriefContent
  const [form, setForm] = useState<BriefContent>({
    ...raw,
    monthlyBudget: Math.round(raw.monthlyBudget / 100), // cents → dollars for UI
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof BriefContent>(key: K, value: BriefContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // monthlyBudget in dollars; server multiplies ×100
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? "Save failed")
      }
      window.dispatchEvent(new CustomEvent("aigency:artifact-updated"))
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const textareaClass = cn(
    "w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
    "placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "transition-[color,box-shadow]"
  )

  const selectClass = cn(
    "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "transition-[color,box-shadow]"
  )

  return (
    <>
      <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
        <SheetTitle>{artifact.title}</SheetTitle>
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(artifact.updatedAt).toLocaleDateString()}
        </p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
        {/* AI Analysis */}
        <div className="space-y-1.5">
          <Label htmlFor="analysis" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Strategic Analysis
          </Label>
          <textarea
            id="analysis"
            value={form.analysis}
            onChange={(e) => set("analysis", e.target.value)}
            rows={11}
            className={textareaClass}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Business Details
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="businessDescription">Business</Label>
            <textarea
              id="businessDescription"
              value={form.businessDescription}
              onChange={(e) => set("businessDescription", e.target.value)}
              rows={4}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product">Product / Service</Label>
            <Input
              id="product"
              value={form.product}
              onChange={(e) => set("product", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={form.targetAudience}
              onChange={(e) => set("targetAudience", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uniqueSellingPoint">Unique Selling Point</Label>
            <textarea
              id="uniqueSellingPoint"
              value={form.uniqueSellingPoint}
              onChange={(e) => set("uniqueSellingPoint", e.target.value)}
              rows={4}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal">Campaign Goal</Label>
            <select
              id="goal"
              value={form.goal}
              onChange={(e) => set("goal", e.target.value as BriefContent["goal"])}
              className={selectClass}
            >
              <option value="LEADS">Leads</option>
              <option value="SALES">Sales</option>
              <option value="TRAFFIC">Website Traffic</option>
              <option value="APP_INSTALLS">App Installs</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthlyBudget">Monthly Budget (USD)</Label>
            <Input
              id="monthlyBudget"
              type="number"
              min={1}
              value={form.monthlyBudget}
              onChange={(e) =>
                set("monthlyBudget", Math.max(1, parseInt(e.target.value, 10) || 1))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={form.websiteUrl ?? ""}
              placeholder="https://..."
              onChange={(e) => set("websiteUrl", e.target.value || undefined)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <SheetFooter className="px-6 pt-4 pb-5 border-t border-border flex-row gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </SheetFooter>
    </>
  )
}

// ─── Competition Sheet ────────────────────────────────────────────────────────

function CompetitionSheet({
  artifact,
  onClose,
}: {
  artifact: ArtifactData
  onClose: () => void
}) {
  const data = artifact.content as CompetitionContent

  return (
    <>
      <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
        <SheetTitle>{artifact.title}</SheetTitle>
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(artifact.updatedAt).toLocaleDateString()}
        </p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
        {/* Summary */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Landscape Summary
          </p>
          <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
        </div>

        <Separator />

        {/* Competitors */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Competitors ({data.competitors?.length ?? 0})
          </p>
          <div className="space-y-4">
            {data.competitors?.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  {c.website && (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Visit site ↗
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                      Strengths
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">{c.strengths}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                      Weaknesses
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">{c.weaknesses}</p>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Ad Strategy
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{c.adStrategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Opportunities & Threats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
              Opportunities
            </p>
            <p className="text-sm leading-relaxed text-foreground">{data.opportunities}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Threats
            </p>
            <p className="text-sm leading-relaxed text-foreground">{data.threats}</p>
          </div>
        </div>

        <Separator />

        {/* Recommendations */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ad Strategy Recommendations
          </p>
          <p className="text-sm leading-relaxed text-foreground">{data.recommendations}</p>
        </div>
      </div>

      <SheetFooter className="px-6 pt-4 pb-5 border-t border-border">
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </SheetFooter>
    </>
  )
}

// ─── Artifact Card ────────────────────────────────────────────────────────────

function ArtifactCard({
  artifact,
  onClick,
}: {
  artifact: ArtifactData
  onClick: () => void
}) {
  const brief = artifact.type === "BRIEF" ? (artifact.content as BriefContent) : null
  const competition =
    artifact.type === "COMPETITION" ? (artifact.content as CompetitionContent) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 hover:bg-sidebar-accent transition-colors"
    >
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        {artifact.type === "COMPETITION" ? (
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-sidebar-foreground leading-tight truncate">
            {artifact.title}
          </p>
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
            {TYPE_LABELS[artifact.type] ?? artifact.type}
          </Badge>
        </div>
        {brief && (
          <>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {brief.businessDescription}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {GOAL_LABELS[brief.goal] ?? brief.goal} ·{" "}
              ${Math.round(brief.monthlyBudget / 100).toLocaleString()}/mo
            </p>
          </>
        )}
        {competition && (
          <>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {competition.summary}
            </p>
            {competition.competitors?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {competition.competitors.length} competitor
                {competition.competitors.length !== 1 ? "s" : ""} analyzed
              </p>
            )}
          </>
        )}
      </div>
    </button>
  )
}

// ─── Fallback: static tools panel (shown when no projectId) ──────────────────

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

function StaticAgentToolsPanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-sidebar-foreground">Agent Tools</span>
      </div>
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

// ─── Main Export ──────────────────────────────────────────────────────────────

type Props = {
  projectId?: string
  initialArtifacts?: ArtifactData[]
}

export function ChatRightPanel({ projectId, initialArtifacts }: Props = {}) {
  const [artifacts, setArtifacts] = useState<ArtifactData[]>(initialArtifacts ?? [])
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchArtifacts = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`)
      if (!res.ok) return
      setArtifacts(await res.json())
    } catch {
      // silently fail — stale data is fine
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const handler = () => fetchArtifacts()
    window.addEventListener("aigency:artifact-updated", handler)
    return () => window.removeEventListener("aigency:artifact-updated", handler)
  }, [projectId, fetchArtifacts])

  function handleCardClick(artifact: ArtifactData) {
    setSelectedArtifact(artifact)
    setSheetOpen(true)
  }

  function handleSheetClose() {
    setSheetOpen(false)
    setTimeout(() => setSelectedArtifact(null), 350) // wait for close animation
  }

  function handleSaved() {
    // Re-fetch to get updated artifact content, then close
    fetchArtifacts()
    handleSheetClose()
  }

  // When there's no projectId, show the original static tools panel
  if (!projectId) {
    return <StaticAgentToolsPanel />
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-sidebar-foreground">Artifacts</span>
        {artifacts.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
            {artifacts.length}
          </Badge>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">No artifacts yet</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Complete onboarding to generate your business brief.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onClick={() => handleCardClick(artifact)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) handleSheetClose()
        }}
      >
        <SheetContent
          side="right"
          className="w-[580px] sm:max-w-[580px] p-0 flex flex-col gap-0"
        >
          {selectedArtifact?.type === "BRIEF" && (
            <BriefSheet
              artifact={selectedArtifact}
              projectId={projectId}
              onClose={handleSheetClose}
              onSaved={handleSaved}
            />
          )}
          {selectedArtifact?.type === "COMPETITION" && (
            <CompetitionSheet
              artifact={selectedArtifact}
              onClose={handleSheetClose}
            />
          )}
          {selectedArtifact &&
            selectedArtifact.type !== "BRIEF" &&
            selectedArtifact.type !== "COMPETITION" && (
              <>
                <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
                  <SheetTitle>{selectedArtifact.title}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[selectedArtifact.type] ?? selectedArtifact.type}
                  </p>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                  <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground">
                    {JSON.stringify(selectedArtifact.content, null, 2)}
                  </pre>
                </div>
              </>
            )}
        </SheetContent>
      </Sheet>
    </aside>
  )
}
