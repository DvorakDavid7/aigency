"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProjectCard from "@/components/dashboard/project-card"

type Project = {
  id: string
  name: string
  description?: string | null
}

type Props = {
  projects: Project[]
}

export default function ProjectsList({ projects }: Props) {
  const [search, setSearch] = useState("")

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <Button asChild>
          <Link href="/dashboard/projects/new">+ New</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          {projects.length === 0 ? (
            <>
              <p className="text-sm">No projects yet.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/projects/new">Create your first project</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm">No projects match your search.</p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  )
}
