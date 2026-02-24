import prisma from "@/lib/prisma"

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{project!.name}</h1>
      <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground">
        statistics
      </div>
    </div>
  )
}
