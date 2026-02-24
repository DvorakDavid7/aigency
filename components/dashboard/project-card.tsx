"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  project: {
    id: string
    name: string
    description?: string | null
  }
}

export default function ProjectCard({ project }: Props) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="h-full cursor-pointer transition-colors hover:border-primary">
        <CardHeader>
          <CardTitle className="text-base">{project.name}</CardTitle>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}
