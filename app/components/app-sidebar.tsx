"use client"

import * as React from "react"
import { LayoutDashboard, Shield, Folder, CheckSquare, BookOpen } from "lucide-react"
import { useOrganization } from "@clerk/react-router"
import { Link, useLocation } from "react-router"

import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Check if user is admin in current organization
  // Note: User must be in an organization context for this to work
  // Admin role is assigned via Clerk Dashboard: Organizations → Members → Role
  const { membership } = useOrganization()
  const isAdmin = membership?.role === "org:admin"
  const location = useLocation()
  const isDashboardActive = location.pathname === "/dashboard"
  const isAssetsActive = location.pathname === "/dashboard/admin/assets"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" isActive={isDashboardActive}>
                <Link to="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Assets" isActive={location.pathname === "/dashboard/assets"}>
                <Link to="/dashboard/assets">
                  <Folder />
                  <span>Assets</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Tasks" isActive={location.pathname === "/dashboard/tasks"}>
                <Link to="/dashboard/tasks">
                  <CheckSquare />
                  <span>Tasks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Learning" isActive={location.pathname.startsWith("/dashboard/learning")}>
                <Link to="/dashboard/learning">
                  <BookOpen />
                  <span>Learning</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage Apps" isActive={location.pathname.startsWith("/dashboard/admin/apps")}>
                  <Link to="/dashboard/admin/apps">
                    <Shield />
                    <span>Manage Apps</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage Assets" isActive={isAssetsActive}>
                  <Link to="/dashboard/admin/assets">
                    <Folder />
                    <span>Manage Assets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage Tasks" isActive={location.pathname.startsWith("/dashboard/admin/tasks")}>
                  <Link to="/dashboard/admin/tasks">
                    <CheckSquare />
                    <span>Manage Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage Topics" isActive={location.pathname.startsWith("/dashboard/admin/topics")}>
                  <Link to="/dashboard/admin/topics">
                    <BookOpen />
                    <span>Manage Topics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
