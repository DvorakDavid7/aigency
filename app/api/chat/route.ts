import { convertToModelMessages, type UIMessage } from "ai"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { runOnboardingAgent } from "@/lib/agents/onboarding"
import { runCampaignAgent } from "@/lib/agents/campaign"
import { runMarketingAgent } from "@/lib/agents/marketing"
import type { BriefContext } from "@/lib/agents/types"

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

  // Determine which agent to use based on conversation type + brief presence
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

  // Persist the incoming user message
  if (conversationId && messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "user") {
      const text = lastMsg.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("")
      if (text) await persistMessage(conversationId, "user", text)
    }
  }

  const context = { projectId, conversationId }
  const convertedMessages = await convertToModelMessages(messages)

  async function onFinish({ steps }: { steps: ReadonlyArray<{ text: string }> }) {
    if (conversationId) {
      const fullText = steps
        .map((s) => s.text)
        .filter((t) => t.trim())
        .join("\n\n")
      if (fullText) await persistMessage(conversationId, "assistant", fullText)
    }
  }

  const result = isOnboarding
    ? runOnboardingAgent(convertedMessages, context, onFinish)
    : isCampaign && brief
      ? runCampaignAgent(convertedMessages, context, brief, onFinish)
      : runMarketingAgent(convertedMessages, context, brief, onFinish)

  return result.toUIMessageStreamResponse()
}
