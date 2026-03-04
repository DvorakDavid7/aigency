import { anthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs, type ModelMessage } from "ai"
import { z } from "zod"
import prisma from "@/lib/prisma"
import type { AgentContext, BriefContext, FinishHandler } from "./types"

const SYSTEM_PROMPT_BASE = `You are an AI marketing agent helping business owners run Facebook ad campaigns.
You help users create campaigns, write compelling ad copy, analyze performance, and continuously optimize their advertising for better results.
Be concise, practical, and results-focused. Always explain your reasoning in plain language — no marketing jargon.

When asked to analyze competitors or research the competition:
1. Use the webSearch tool to search for competitors in the user's market — search broadly and deeply
2. Search for each competitor's website, Facebook ads, ad strategy, pricing, and positioning
3. Run multiple searches to gather comprehensive information (e.g. "[product category] competitors [location]", "best [product] companies", "top [industry] brands Facebook ads")
4. Once you have researched at least 3 competitors, you MUST call saveCompetitionAnalysis to save the artifact — do not ask for permission, just save it
5. After saving, give the user a concise summary of your key findings and ad strategy recommendations`

export function buildSystemPrompt(brief?: BriefContext | null): string {
  if (!brief) return SYSTEM_PROMPT_BASE

  const lines = [
    `- Business: ${brief.businessDescription}`,
    `- Product/Service: ${brief.product}`,
    `- Target Audience: ${brief.targetAudience}`,
    `- Unique Selling Point: ${brief.uniqueSellingPoint}`,
    `- Campaign Goal: ${brief.goal}`,
    `- Monthly Budget: $${Math.round(brief.monthlyBudget / 100).toLocaleString()}/month`,
    `- Location: ${brief.location}`,
    ...(brief.websiteUrl ? [`- Website: ${brief.websiteUrl}`] : []),
  ]

  return `${SYSTEM_PROMPT_BASE}

## Business Context
${lines.join("\n")}`
}

const competitionInputSchema = z.object({
  title: z.string().describe("Title for this competition analysis artifact"),
  summary: z.string().describe("Overall competitive landscape summary (2-3 paragraphs)"),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        website: z.string().optional(),
        description: z.string().describe("What this competitor does"),
        strengths: z.string(),
        weaknesses: z.string(),
        adStrategy: z
          .string()
          .describe("Their likely Facebook/social ad strategy and positioning"),
      })
    )
    .describe("List of key competitors analyzed (3-6 competitors)"),
  opportunities: z
    .string()
    .describe("Key opportunities for our client based on competitive gaps"),
  threats: z.string().describe("Key threats to be aware of from competitors"),
  recommendations: z
    .string()
    .describe("Specific ad strategy recommendations based on this competitive analysis"),
})

function createTools(context: AgentContext) {
  return {
    saveCompetitionAnalysis: {
      description:
        "Save the completed competition analysis as an artifact once you have researched all key competitors via web search.",
      inputSchema: competitionInputSchema,
      execute: async (input: z.infer<typeof competitionInputSchema>) => {
        try {
          const artifact = await prisma.artifact.create({
            data: {
              projectId: context.projectId,
              conversationId: context.conversationId ?? null,
              type: "COMPETITION",
              title: input.title || "Competition Analysis",
              content: {
                summary: input.summary,
                competitors: input.competitors,
                opportunities: input.opportunities,
                threats: input.threats,
                recommendations: input.recommendations,
              },
            },
            select: { id: true },
          })

          return { success: true, artifactId: artifact.id }
        } catch (err) {
          console.error("[saveCompetitionAnalysis] failed:", err)
          return { success: false, error: String(err) }
        }
      },
    },
  }
}

export function runMarketingAgent(
  messages: ModelMessage[],
  context: AgentContext,
  brief: BriefContext | null,
  onFinish: FinishHandler
) {
  return streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystemPrompt(brief),
    messages,
    tools: {
      webSearch: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
      ...createTools(context),
    },
    stopWhen: stepCountIs(30),
    onFinish,
  })
}
