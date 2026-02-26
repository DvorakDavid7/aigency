"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Search, Sparkles, Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Markdown } from "@/components/ui/markdown"
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

export type CampaignContent = {
  campaignName: string
  offer: string
  adFormat: "IMAGE" | "CAROUSEL" | "VIDEO"
  duration: string
  campaignBudget: number // stored in cents
  landingPageUrl: string
  audienceRefinement?: string | null
  keyMessage: string
  adCopy: {
    headline: string
    primaryText: string
    description: string
    callToAction: string
  }
  strategy: string
  targetAudience: string
  budgetBreakdown: string
  expectedResults: string
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
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Landscape Summary
          </p>
          <Markdown content={data.summary} />
        </div>

        <Separator />

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

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
              Opportunities
            </p>
            <Markdown content={data.opportunities} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Threats
            </p>
            <Markdown content={data.threats} />
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ad Strategy Recommendations
          </p>
          <Markdown content={data.recommendations} />
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

// ─── Campaign Sheet ───────────────────────────────────────────────────────────

function CampaignSheet({
  artifact,
  onClose,
}: {
  artifact: ArtifactData
  onClose: () => void
}) {
  const data = artifact.content as CampaignContent

  const AD_FORMAT_LABELS: Record<string, string> = {
    IMAGE: "Image",
    CAROUSEL: "Carousel",
    VIDEO: "Video",
  }

  return (
    <>
      <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
        <SheetTitle>{artifact.title}</SheetTitle>
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(artifact.updatedAt).toLocaleDateString()}
        </p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
        {/* Campaign Overview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Campaign Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Format
              </p>
              <p className="text-sm font-medium text-foreground">
                {AD_FORMAT_LABELS[data.adFormat] ?? data.adFormat}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duration
              </p>
              <p className="text-sm font-medium text-foreground">{data.duration}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Budget
              </p>
              <p className="text-sm font-medium text-foreground">
                ${Math.round(data.campaignBudget / 100).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Goal
              </p>
              <p className="text-sm font-medium text-foreground truncate">{data.keyMessage}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Offer
            </p>
            <p className="text-sm text-foreground">{data.offer}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Landing Page
            </p>
            <a
              href={data.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {data.landingPageUrl}
            </a>
          </div>
        </div>

        <Separator />

        {/* Ad Copy */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ad Copy
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Headline
              </p>
              <p className="text-sm font-semibold text-foreground">{data.adCopy.headline}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Primary Text
              </p>
              <p className="text-sm text-foreground leading-relaxed">{data.adCopy.primaryText}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="text-sm text-foreground">{data.adCopy.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                CTA:
              </p>
              <Badge variant="secondary" className="text-xs">
                {data.adCopy.callToAction.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Strategy */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Strategy
          </p>
          <Markdown content={data.strategy} />
        </div>

        <Separator />

        {/* Targeting */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target Audience
          </p>
          <Markdown content={data.targetAudience} />
          {data.audienceRefinement && (
            <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Refinement:</span> {data.audienceRefinement}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Budget */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Budget Breakdown
          </p>
          <Markdown content={data.budgetBreakdown} />
        </div>

        <Separator />

        {/* Expected Results */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Expected Results
          </p>
          <Markdown content={data.expectedResults} />
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
  const campaign = artifact.type === "CAMPAIGN" ? (artifact.content as CampaignContent) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 hover:bg-sidebar-accent transition-colors"
    >
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        {artifact.type === "COMPETITION" ? (
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        ) : artifact.type === "CAMPAIGN" ? (
          <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
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
        {campaign && (
          <>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {campaign.offer}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${Math.round(campaign.campaignBudget / 100).toLocaleString()} · {campaign.duration}
            </p>
          </>
        )}
      </div>
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type Props = {
  projectId: string
  initialArtifacts?: ArtifactData[]
}

export function ChatRightPanel({ projectId, initialArtifacts }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactData[]>(initialArtifacts ?? [])
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`)
      if (!res.ok) return
      setArtifacts(await res.json())
    } catch {
      // silently fail — stale data is fine
    }
  }, [projectId])

  useEffect(() => {
    const handler = () => fetchArtifacts()
    window.addEventListener("aigency:artifact-updated", handler)
    return () => window.removeEventListener("aigency:artifact-updated", handler)
  }, [fetchArtifacts])

  function handleCardClick(artifact: ArtifactData) {
    setSelectedArtifact(artifact)
    setSheetOpen(true)
  }

  function handleSheetClose() {
    setSheetOpen(false)
    setTimeout(() => setSelectedArtifact(null), 350)
  }

  function handleSaved() {
    fetchArtifacts()
    handleSheetClose()
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-sidebar-foreground">Artifacts</span>
        {artifacts.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
            {artifacts.length}
          </Badge>
        )}
      </div>

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
          {selectedArtifact?.type === "CAMPAIGN" && (
            <CampaignSheet
              artifact={selectedArtifact}
              onClose={handleSheetClose}
            />
          )}
          {selectedArtifact &&
            selectedArtifact.type !== "BRIEF" &&
            selectedArtifact.type !== "COMPETITION" &&
            selectedArtifact.type !== "CAMPAIGN" && (
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
