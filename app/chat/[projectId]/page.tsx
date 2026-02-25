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

  const project = await prisma.project.findUnique({
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
  })

  if (!project) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatLeftPanel
        projectId={project.id}
        projectName={project.name}
        conversations={project.conversations}
      />
      <ChatMain projectId={project.id} projectName={project.name} />
      <ChatRightPanel />
    </div>
  )
}
