import { anthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs, type ModelMessage } from "ai"
import { z } from "zod"
import prisma from "@/lib/prisma"
import type { AgentContext, BriefContext, FinishHandler } from "./types"

const SYSTEM_PROMPT_BASE = `You are an expert Facebook advertising strategist building a campaign plan for a business owner.
You already have their business brief. Your job is to design a specific campaign — not re-ask onboarding questions.

Ask only campaign-specific questions, one or two at a time:
1. What specific offer, product, or service should this campaign promote?
2. What ad format works best — Image, Carousel, or Video?
3. How long should the campaign run?
4. What is the campaign budget in USD (total for this campaign, not monthly)?
5. What URL should the ads send people to?
6. Any specific audience refinements beyond the brief (optional)?
7. What is the single most important message this ad should communicate?

When you have confident answers for all required fields, call the saveCampaign tool immediately — do not ask for confirmation.
After saving, tell the user their campaign plan is ready and give a brief plain-language summary.`

export function buildSystemPrompt(brief: BriefContext): string {
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

  return `
    ${SYSTEM_PROMPT_BASE}

    ## Business Context (from onboarding brief)
    ${lines.join("\n")}
  `
}

const campaignInputSchema = z.object({
  campaignName: z.string().describe("Short name for this campaign"),
  offer: z.string().describe("The specific offer, product, or service being promoted"),
  adFormat: z.enum(["IMAGE", "CAROUSEL", "VIDEO"]).describe("Facebook ad format"),
  duration: z.string().describe("Campaign duration (e.g. '30 days', '2 weeks')"),
  campaignBudget: z
    .number()
    .int()
    .positive()
    .describe("Total campaign budget in whole USD dollars"),
  landingPageUrl: z.string().describe("URL the ads will send users to"),
  audienceRefinement: z
    .string()
    .optional()
    .describe("Any audience refinements beyond the brief (optional)"),
  keyMessage: z.string().describe("The single most important message this ad communicates"),
  headline: z.string().max(40).describe("Ad headline (max 40 characters)"),
  primaryText: z.string().max(125).describe("Primary ad text (max 125 characters)"),
  description: z.string().max(30).describe("Ad description (max 30 characters)"),
  callToAction: z
    .enum([
      "LEARN_MORE",
      "SHOP_NOW",
      "SIGN_UP",
      "GET_QUOTE",
      "CONTACT_US",
      "BOOK_NOW",
      "DOWNLOAD",
      "GET_STARTED",
    ])
    .describe("Facebook call-to-action button"),
  strategy: z.string().describe("Campaign strategy rationale (2-3 paragraphs)"),
  targetAudience: z.string().describe("Detailed target audience description"),
  budgetBreakdown: z.string().describe("How the budget will be allocated"),
  expectedResults: z.string().describe("Expected results in plain language"),
})

function createTools(context: AgentContext) {
  return {
    saveCampaign: {
      description:
        "Save the completed campaign plan as an artifact once you have gathered all required information from the user.",
      inputSchema: campaignInputSchema,
      execute: async (input: z.infer<typeof campaignInputSchema>) => {
        const budgetInCents = input.campaignBudget * 100

        try {
          let artifactId = ""

          await prisma.$transaction(async (tx) => {
            const artifact = await tx.artifact.create({
              data: {
                projectId: context.projectId,
                conversationId: context.conversationId ?? null,
                type: "CAMPAIGN",
                title: input.campaignName,
                content: {
                  campaignName: input.campaignName,
                  offer: input.offer,
                  adFormat: input.adFormat,
                  duration: input.duration,
                  campaignBudget: budgetInCents,
                  landingPageUrl: input.landingPageUrl,
                  audienceRefinement: input.audienceRefinement ?? null,
                  keyMessage: input.keyMessage,
                  adCopy: {
                    headline: input.headline,
                    primaryText: input.primaryText,
                    description: input.description,
                    callToAction: input.callToAction,
                  },
                  strategy: input.strategy,
                  targetAudience: input.targetAudience,
                  budgetBreakdown: input.budgetBreakdown,
                  expectedResults: input.expectedResults,
                },
              },
              select: { id: true },
            })

            artifactId = artifact.id

            if (context.conversationId) {
              await tx.conversation.update({
                where: { id: context.conversationId },
                data: { status: "COMPLETED", title: input.campaignName },
              })
            }
          })

          return { success: true, artifactId }
        } catch (err) {
          console.error("[saveCampaign] failed:", err)
          return { success: false, error: String(err) }
        }
      },
    },
  }
}

export function runCampaignAgent(
  messages: ModelMessage[],
  context: AgentContext,
  brief: BriefContext,
  onFinish: FinishHandler
) {
  return streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystemPrompt(brief),
    messages,
    tools: createTools(context),
    stopWhen: stepCountIs(3),
    onFinish,
  })
}
