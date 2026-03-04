export type BriefContext = {
  businessDescription: string
  product: string
  targetAudience: string
  uniqueSellingPoint: string
  goal: string
  monthlyBudget: number
  location: string
  websiteUrl?: string | null
}

export type AgentContext = {
  projectId: string
  conversationId?: string
}

export type FinishHandler = (event: { steps: ReadonlyArray<{ text: string }> }) => Promise<void>
