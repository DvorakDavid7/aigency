import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ChatLeftPanel } from "@/components/chat/chat-left-panel"
import { ChatMain } from "@/components/chat/chat-main"
import { ChatRightPanel } from "@/components/chat/chat-right-panel"

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const session = await auth.api.getSession({ headers: await headers() })

  const [project, facebookConnection] = await Promise.all([
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
  ])

  if (!project) return null

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
      />
      <ChatRightPanel />
    </div>
  )
}
