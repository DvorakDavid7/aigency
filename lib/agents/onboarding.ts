import { anthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs, type ModelMessage } from "ai"
import { z } from "zod"
import prisma from "@/lib/prisma"
import type { AgentContext, FinishHandler } from "./types"

const SYSTEM_PROMPT = `You are conducting a business onboarding for an AI marketing agency. Your job is to gather the information needed to run effective Facebook ad campaigns for this business.

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

function createTools(context: AgentContext) {
  return {
    saveBrief: {
      description:
        "Save the completed business brief to the database once you have gathered all required information from the user.",
      inputSchema: briefInputSchema,
      execute: async (input: z.infer<typeof briefInputSchema>) => {
        const budgetInCents = input.monthlyBudget * 100
        let artifactId = ""

        await prisma.$transaction(async (tx) => {
          await tx.projectBrief.upsert({
            where: { projectId: context.projectId },
            create: {
              projectId: context.projectId,
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
              projectId: context.projectId,
              conversationId: context.conversationId ?? null,
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

          if (context.conversationId) {
            await tx.conversation.update({
              where: { id: context.conversationId },
              data: { status: "COMPLETED" },
            })
          }
        })

        return { success: true, artifactId }
      },
    },
  }
}

export function runOnboardingAgent(
  messages: ModelMessage[],
  context: AgentContext,
  onFinish: FinishHandler
) {
  return streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages,
    tools: createTools(context),
    stopWhen: stepCountIs(3),
    onFinish,
  })
}
