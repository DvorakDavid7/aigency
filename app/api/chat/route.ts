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

const MARKETING_SYSTEM_PROMPT = `You are an AI marketing agent helping business owners run Facebook ad campaigns.
You help users create campaigns, write compelling ad copy, analyze performance, and continuously optimize their advertising for better results.
Be concise, practical, and results-focused. Always explain your reasoning in plain language — no marketing jargon.`

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

  let systemPrompt = MARKETING_SYSTEM_PROMPT
  let isOnboarding = false

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        project: { id: projectId, userId: session.user.id },
      },
      select: {
        type: true,
        project: { select: { brief: { select: { id: true } } } },
      },
    })

    if (conversation?.type === "ONBOARDING" && !conversation.project.brief) {
      systemPrompt = ONBOARDING_SYSTEM_PROMPT
      isOnboarding = true
    }
  }

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

  const capturedConversationId = conversationId
  const capturedProjectId = projectId

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

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    ...(isOnboarding ? { tools: { saveBrief: saveBriefTool }, stopWhen: stepCountIs(3) } : {}),
    onFinish: async ({ steps }) => {
      if (conversationId) {
        const fullText = steps
          .map((s) => s.text)
          .filter((t) => t.trim())
          .join("\n\n")
        if (fullText) await persistMessage(conversationId, "assistant", fullText)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
