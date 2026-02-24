import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import ProjectsList from "./projects-list"

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  const projects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projects</h1>
      <ProjectsList projects={projects} />
    </div>
  )
}
