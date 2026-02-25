"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Plug,
  type LucideIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type NavItem = { title: string; url: string; icon: LucideIcon }

const GLOBAL_NAV: NavItem[] = [
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpen },
  { title: "Integrations", url: "/dashboard/integrations", icon: Plug },
  { title: "Billing", url: "/dashboard/credits", icon: CreditCard },
]

function projectNav(id: string): NavItem[] {
  return [
    { title: "Overview", url: `/dashboard/projects/${id}`, icon: LayoutDashboard },
    { title: "Chat", url: `/chat/${id}`, icon: MessageSquare },
  ]
}

export function AppSidebar() {
  const pathname = usePathname()

  const projectMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)/)
  const projectId = projectMatch?.[1]
  const isProjectView = projectId && projectId !== "new"

  const navItems = isProjectView ? projectNav(projectId) : GLOBAL_NAV
  const groupLabel = isProjectView ? "Project" : "Navigation"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/projects">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold">
                  A
                </div>
                <span className="font-semibold">Aigency</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isProjectView && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All projects">
                  <Link href="/dashboard/projects">
                    <ArrowLeft />
                    <span>All projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const active =
                pathname === item.url ||
                (item.url === `/chat/${projectId}` && pathname.startsWith(`/chat/${projectId}`))
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
