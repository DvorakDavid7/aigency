import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  const project = await prisma.project.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!project || project.userId !== session!.user.id) {
    notFound()
  }

  return <>{children}</>
}
