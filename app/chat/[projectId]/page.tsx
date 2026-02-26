import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ChatLeftPanel } from "@/components/chat/chat-left-panel"
import { ChatMain } from "@/components/chat/chat-main"
import { ChatRightPanel, type ArtifactData } from "@/components/chat/chat-right-panel"

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const session = await auth.api.getSession({ headers: await headers() })

  const [project, facebookConnection, artifacts] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        brief: { select: { id: true } },
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
    prisma.artifact.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, content: true, createdAt: true, updatedAt: true },
    }),
  ])

  if (!project) return null

  const fbConnected = !!facebookConnection?.fbAccountId
  const hasBrief = !!project.brief

  const initialArtifacts: ArtifactData[] = artifacts.map((a) => ({
    id: a.id,
    type: a.type as ArtifactData["type"],
    title: a.title,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

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
        hasBrief={hasBrief}
      />
      <ChatRightPanel projectId={project.id} initialArtifacts={initialArtifacts} />
    </div>
  )
}
