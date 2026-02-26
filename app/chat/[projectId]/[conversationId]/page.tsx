import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ChatLeftPanel } from "@/components/chat/chat-left-panel"
import { ChatMain } from "@/components/chat/chat-main"
import { ChatRightPanel, type ArtifactData } from "@/components/chat/chat-right-panel"
import type { UIMessage } from "ai"

export default async function ConversationChatPage({
  params,
}: {
  params: Promise<{ projectId: string; conversationId: string }>
}) {
  const { projectId, conversationId } = await params

  const session = await auth.api.getSession({ headers: await headers() })

  const [project, facebookConnection, conversation, artifacts] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        brief: { select: { id: true } },
        conversations: {
          orderBy: { updatedAt: "desc" },
          select: { id: true, type: true, title: true, updatedAt: true },
          take: 30,
        },
      },
    }),
    prisma.facebookConnection.findUnique({
      where: { userId: session!.user.id },
      select: { fbAccountId: true },
    }),
    prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
      select: {
        id: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true },
        },
      },
    }),
    prisma.artifact.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, content: true, createdAt: true, updatedAt: true },
    }),
  ])

  if (!project || !conversation) notFound()

  const initialMessages: UIMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }))

  const initialArtifacts: ArtifactData[] = artifacts.map((a) => ({
    id: a.id,
    type: a.type as ArtifactData["type"],
    title: a.title,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  const fbConnected = !!facebookConnection?.fbAccountId
  const hasBrief = !!project.brief

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatLeftPanel
        projectId={project.id}
        projectName={project.name}
        conversations={project.conversations}
        hasBrief={hasBrief}
      />
      <ChatMain
        projectId={project.id}
        projectName={project.name}
        fbConnected={fbConnected}
        hasBrief={hasBrief}
        initialMessages={initialMessages}
        conversationId={conversationId}
      />
      <ChatRightPanel projectId={project.id} initialArtifacts={initialArtifacts} />
    </div>
  )
}
