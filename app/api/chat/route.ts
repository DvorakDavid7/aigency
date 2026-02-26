import { anthropic } from "@ai-sdk/anthropic"
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const ONBOARDING_SYSTEM_PROMPT = `You are conducting a business onboarding for an AI marketing agency. Your job is to gather the information needed to run effective Facebook ad campaigns for this business.

Ask these questions conversationally — one or two at a time, not all at once:
1. What does the business do? (businessDescription)
2. What is the main product or service, and what does it cost? (product)
3. Who is the ideal customer? (targetAudience)
4. What makes this business different from competitors? (uniqueSellingPoint)
5. What is the primary goal: leads, sales, website traffic, or app installs? (goal: LEADS|SALES|TRAFFIC|APP_INSTALLS)
6. What is the monthly ad budget in USD? (monthlyBudget)
7. Where are the customers located? (location)
8. Do you have a website? (websiteUrl — optional)

When you have confident answers for all required fields, call the saveBrief tool. Do not ask the user to confirm — just save it.
After saving, tell the user their brief is complete and give a short plain-language summary of what you captured.`

const MARKETING_SYSTEM_PROMPT_BASE = `You are an AI marketing agent helping business owners run Facebook ad campaigns.
You help users create campaigns, write compelling ad copy, analyze performance, and continuously optimize their advertising for better results.
Be concise, practical, and results-focused. Always explain your reasoning in plain language — no marketing jargon.

When asked to analyze competitors or research the competition:
1. Use the webSearch tool to search for competitors in the user's market — search broadly and deeply
2. Search for each competitor's website, Facebook ads, ad strategy, pricing, and positioning
3. Run multiple searches to gather comprehensive information (e.g. "[product category] competitors [location]", "best [product] companies", "top [industry] brands Facebook ads")
4. Once you have researched at least 3 competitors, you MUST call saveCompetitionAnalysis to save the artifact — do not ask for permission, just save it
5. After saving, give the user a concise summary of your key findings and ad strategy recommendations`

const CAMPAIGN_SYSTEM_PROMPT_BASE = `You are an expert Facebook advertising strategist building a campaign plan for a business owner.
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

type BriefContext = {
  businessDescription: string
  product: string
  targetAudience: string
  uniqueSellingPoint: string
  goal: string
  monthlyBudget: number
  location: string
  websiteUrl?: string | null
}

function buildCampaignSystemPrompt(brief: BriefContext): string {
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

  return `${CAMPAIGN_SYSTEM_PROMPT_BASE}

## Business Context (from onboarding brief)
${lines.join("\n")}`
}

function buildMarketingSystemPrompt(brief?: BriefContext | null): string {
  if (!brief) return MARKETING_SYSTEM_PROMPT_BASE

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

  return `${MARKETING_SYSTEM_PROMPT_BASE}

## Business Context
${lines.join("\n")}`
}

async function persistMessage(conversationId: string, role: string, content: string) {
  await prisma.message.create({
    data: { conversationId, role, content },
  })
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    projectId,
    conversationId,
  }: { messages: UIMessage[]; projectId: string; conversationId?: string } = await req.json()

  let isOnboarding = false
  let isCampaign = false
  let brief: BriefContext | null = null

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        project: { id: projectId, userId: session.user.id },
      },
      select: {
        type: true,
        project: {
          select: {
            brief: {
              select: {
                businessDescription: true,
                product: true,
                targetAudience: true,
                uniqueSellingPoint: true,
                goal: true,
                monthlyBudget: true,
                location: true,
                websiteUrl: true,
              },
            },
          },
        },
      },
    })

    if (conversation?.type === "ONBOARDING" && !conversation.project.brief) {
      isOnboarding = true
    } else if (conversation?.type === "CAMPAIGN" && conversation?.project.brief) {
      isCampaign = true
      brief = conversation.project.brief
    } else if (conversation?.project.brief) {
      brief = conversation.project.brief
    }
  }

  const systemPrompt = isOnboarding
    ? ONBOARDING_SYSTEM_PROMPT
    : isCampaign && brief
      ? buildCampaignSystemPrompt(brief)
      : buildMarketingSystemPrompt(brief)

  // Save the incoming user message to DB
  if (conversationId && messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "user") {
      const text = lastMsg.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("")
      if (text) await persistMessage(conversationId, "user", text)
    }
  }

  const capturedConversationId = conversationId
  const capturedProjectId = projectId

  // ─── Onboarding: saveBrief tool ─────────────────────────────────────────────

  const briefInputSchema = z.object({
    businessDescription: z.string().describe("What the business does"),
    product: z.string().describe("Main product or service and its price"),
    targetAudience: z.string().describe("Description of the ideal customer"),
    uniqueSellingPoint: z.string().describe("What makes this business different from competitors"),
    goal: z
      .enum(["LEADS", "SALES", "TRAFFIC", "APP_INSTALLS"])
      .describe("Primary campaign goal"),
    monthlyBudget: z
      .number()
      .int()
      .positive()
      .describe("Monthly ad budget in whole USD dollars (e.g. 500 for $500/month)"),
    location: z.string().describe("Where the customers are located"),
    websiteUrl: z.string().optional().describe("Business website URL (optional)"),
    analysis: z
      .string()
      .describe(
        "A 2-3 paragraph AI-written analysis of the business, its market position, and Facebook campaign strategy rationale"
      ),
  })

  const saveBriefTool = {
    description:
      "Save the completed business brief to the database once you have gathered all required information from the user.",
    inputSchema: briefInputSchema,
    execute: async (input: z.infer<typeof briefInputSchema>) => {
      const budgetInCents = input.monthlyBudget * 100
      let artifactId = ""

      await prisma.$transaction(async (tx) => {
        await tx.projectBrief.upsert({
          where: { projectId: capturedProjectId },
          create: {
            projectId: capturedProjectId,
            businessDescription: input.businessDescription,
            product: input.product,
            targetAudience: input.targetAudience,
            uniqueSellingPoint: input.uniqueSellingPoint,
            goal: input.goal,
            monthlyBudget: budgetInCents,
            location: input.location,
            websiteUrl: input.websiteUrl ?? null,
          },
          update: {
            businessDescription: input.businessDescription,
            product: input.product,
            targetAudience: input.targetAudience,
            uniqueSellingPoint: input.uniqueSellingPoint,
            goal: input.goal,
            monthlyBudget: budgetInCents,
            location: input.location,
            websiteUrl: input.websiteUrl ?? null,
          },
        })

        const artifact = await tx.artifact.create({
          data: {
            projectId: capturedProjectId,
            conversationId: capturedConversationId,
            type: "BRIEF",
            title: "Business Brief",
            content: {
              businessDescription: input.businessDescription,
              product: input.product,
              targetAudience: input.targetAudience,
              uniqueSellingPoint: input.uniqueSellingPoint,
              goal: input.goal,
              monthlyBudget: budgetInCents,
              location: input.location,
              websiteUrl: input.websiteUrl,
              analysis: input.analysis,
            },
          },
          select: { id: true },
        })

        artifactId = artifact.id

        if (capturedConversationId) {
          await tx.conversation.update({
            where: { id: capturedConversationId },
            data: { status: "COMPLETED" },
          })
        }
      })

      return { success: true, artifactId }
    },
  }

  // ─── Campaign: saveCampaign tool ─────────────────────────────────────────────

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

  const saveCampaignTool = {
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
              projectId: capturedProjectId,
              conversationId: capturedConversationId ?? null,
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

          if (capturedConversationId) {
            await tx.conversation.update({
              where: { id: capturedConversationId },
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
  }

  // ─── Marketing: saveCompetitionAnalysis tool ─────────────────────────────────

  const competitionInputSchema = z.object({
    title: z.string().describe("Title for this competition analysis artifact"),
    summary: z
      .string()
      .describe("Overall competitive landscape summary (2-3 paragraphs)"),
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
    threats: z
      .string()
      .describe("Key threats to be aware of from competitors"),
    recommendations: z
      .string()
      .describe(
        "Specific ad strategy recommendations based on this competitive analysis"
      ),
  })

  const saveCompetitionAnalysisTool = {
    description:
      "Save the completed competition analysis as an artifact once you have researched all key competitors via web search.",
    inputSchema: competitionInputSchema,
    execute: async (input: z.infer<typeof competitionInputSchema>) => {
      try {
        const artifact = await prisma.artifact.create({
          data: {
            projectId: capturedProjectId,
            conversationId: capturedConversationId ?? null,
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
  }

  // ─── Stream ───────────────────────────────────────────────────────────────────

  const convertedMessages = await convertToModelMessages(messages)

  async function handleFinish({ steps }: { steps: Array<{ text: string }> }) {
    if (conversationId) {
      const fullText = steps
        .map((s) => s.text)
        .filter((t) => t.trim())
        .join("\n\n")
      if (fullText) await persistMessage(conversationId, "assistant", fullText)
    }
  }

  const result = isOnboarding
    ? streamText({
        model: anthropic("claude-sonnet-4-6"),
        system: systemPrompt,
        messages: convertedMessages,
        tools: { saveBrief: saveBriefTool },
        stopWhen: stepCountIs(3),
        onFinish: handleFinish,
      })
    : isCampaign
      ? streamText({
          model: anthropic("claude-sonnet-4-6"),
          system: systemPrompt,
          messages: convertedMessages,
          tools: { saveCampaign: saveCampaignTool },
          stopWhen: stepCountIs(3),
          onFinish: handleFinish,
        })
      : streamText({
          model: anthropic("claude-sonnet-4-6"),
          system: systemPrompt,
          messages: convertedMessages,
          tools: {
            webSearch: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
            saveCompetitionAnalysis: saveCompetitionAnalysisTool,
          },
          stopWhen: stepCountIs(30),
          onFinish: handleFinish,
        })

  return result.toUIMessageStreamResponse()
}
