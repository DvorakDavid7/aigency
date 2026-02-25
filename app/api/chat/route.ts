import { anthropic } from "@ai-sdk/anthropic"
import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages, projectId }: { messages: UIMessage[]; projectId: string } = await req.json()

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are an AI marketing agent helping business owners run Facebook ad campaigns.
You help users create campaigns, write compelling ad copy, analyze performance, and continuously optimize their advertising for better results.
Be concise, practical, and results-focused. Always explain your reasoning in plain language — no marketing jargon.`,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
