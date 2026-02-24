"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  ArrowLeft,
  BarChart2,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Plug,
  Settings,
  Target,
  TrendingUp,
  Users,
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
  { title: "Team", url: "/dashboard/team", icon: Users },
  { title: "Integrations", url: "/dashboard/integrations", icon: Plug },
  { title: "Usage", url: "/dashboard/usage", icon: BarChart2 },
  { title: "Billing", url: "/dashboard/credits", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

function projectNav(id: string): NavItem[] {
  return [
    { title: "Overview", url: `/dashboard/projects/${id}`, icon: LayoutDashboard },
    { title: "Analysis", url: `/dashboard/projects/${id}/analysis`, icon: TrendingUp },
    { title: "Marketing", url: `/dashboard/projects/${id}/marketing`, icon: Megaphone },
    { title: "Campaigns", url: `/dashboard/projects/${id}/campaigns`, icon: Target },
    { title: "Statistics", url: `/dashboard/projects/${id}/statistics`, icon: BarChart2 },
    { title: "Usage", url: `/dashboard/projects/${id}/usage`, icon: Activity },
    { title: "Billing", url: `/dashboard/projects/${id}/billing`, icon: CreditCard },
    { title: "Settings", url: `/dashboard/projects/${id}/settings`, icon: Settings },
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
                (item.url !== `/dashboard/projects/${projectId}` &&
                  pathname.startsWith(item.url + "/"))
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
