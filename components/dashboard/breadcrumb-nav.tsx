"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const LABELS: Record<string, string> = {
  projects: "Projects",
  new: "New project",
  credits: "Billing",
  settings: "Settings",
  usage: "Usage",
  team: "Team",
  integrations: "Integrations",
  campaigns: "Campaigns",
  analysis: "Analysis",
  marketing: "Marketing",
  statistics: "Statistics",
  billing: "Billing",
  overview: "Overview",
}

// Looks like a cuid/nanoid — skip it in the breadcrumb label
function isId(segment: string) {
  return segment.length > 10 && !/^(new|credits|settings|usage|team|integrations)$/.test(segment)
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean)

  type Crumb = { label: string; href: string; isPage: boolean }
  const crumbs: Crumb[] = []
  let path = "/dashboard"

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path += `/${seg}`

    if (isId(seg)) {
      // Project ID segment — represents Overview when it's the last segment
      if (i === segments.length - 1) {
        crumbs.push({ label: "Overview", href: path, isPage: true })
      }
      // Otherwise skip and let the next segment be the crumb
      continue
    }

    const label = LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: path, isPage: i === segments.length - 1 })
  }

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden md:block" : ""}>
              {crumb.isPage ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
