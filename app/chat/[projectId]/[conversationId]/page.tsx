import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ChatLeftPanel } from "@/components/chat/chat-left-panel"
import { ChatMain } from "@/components/chat/chat-main"
import { ChatRightPanel } from "@/components/chat/chat-right-panel"
import type { UIMessage } from "ai"

export default async function ConversationChatPage({
  params,
}: {
  params: Promise<{ projectId: string; conversationId: string }>
}) {
  const { projectId, conversationId } = await params

  const session = await auth.api.getSession({ headers: await headers() })

  const [project, facebookConnection, conversation] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        conversations: {
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, updatedAt: true },
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
  ])

  if (!project || !conversation) notFound()

  const initialMessages: UIMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }))

  const fbConnected = !!facebookConnection?.fbAccountId

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatLeftPanel
        projectId={project.id}
        projectName={project.name}
        conversations={project.conversations}
      />
      <ChatMain
        projectId={project.id}
        projectName={project.name}
        fbConnected={fbConnected}
        initialMessages={initialMessages}
        conversationId={conversationId}
      />
      <ChatRightPanel />
    </div>
  )
}
