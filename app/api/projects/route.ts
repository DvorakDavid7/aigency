import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const ONBOARDING_GREETING =
  "Hi! I'm your AI marketing agent. I'm going to ask you a few questions to understand your business so I can run effective Facebook ad campaigns for you.\n\nLet's start with the basics — **what does your business do, and what product or service are you selling?**"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      conversations: {
        create: {
          type: "ONBOARDING",
          title: "Onboarding",
          messages: {
            create: {
              role: "assistant",
              content: ONBOARDING_GREETING,
            },
          },
        },
      },
    },
    select: {
      id: true,
      conversations: { select: { id: true }, take: 1 },
    },
  })

  return NextResponse.json(
    { id: project.id, conversationId: project.conversations[0].id },
    { status: 201 }
  )
}
