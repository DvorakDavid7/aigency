import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const CAMPAIGN_GREETING =
  "Hi! I'm your marketing expert. I already have your business brief, so let's build your first Facebook ad campaign.\n\nWhat specific offer, product, or service would you like to promote in this campaign?"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: {
      id: true,
      brief: { select: { id: true } },
      conversations: {
        where: { type: "CAMPAIGN" },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (!project.brief) {
    return NextResponse.json(
      { error: "Complete onboarding before creating a campaign" },
      { status: 400 }
    )
  }

  // Idempotent: return existing CAMPAIGN conversation if one exists
  if (project.conversations.length > 0) {
    return NextResponse.json(
      { conversationId: project.conversations[0].id },
      { status: 200 }
    )
  }

  const conversation = await prisma.conversation.create({
    data: {
      projectId,
      type: "CAMPAIGN",
      status: "ACTIVE",
      title: "Marketing Campaign",
      messages: {
        create: {
          role: "assistant",
          content: CAMPAIGN_GREETING,
        },
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
}
