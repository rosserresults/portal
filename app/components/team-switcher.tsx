"use client"

import * as React from "react"
import { ChevronsUpDown, Building2 } from "lucide-react"
import { useOrganization, useOrganizationList, useUser } from "@clerk/react-router"
import { useRevalidator } from "react-router"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const revalidator = useRevalidator()
  const { user, isLoaded: userLoaded } = useUser()
  const { organization, setActive } = useOrganization()
  const { userMemberships, isLoaded, setActive: setActiveFromList } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })

  // Access organizations from userMemberships.data
  const organizationMemberships = userMemberships?.data || []
  const activeOrg = organization

  // Debug logging
  React.useEffect(() => {
    console.log("TeamSwitcher Debug:", {
      userLoaded,
      userId: user?.id,
      isLoaded,
      userMemberships,
      userMembershipsData: userMemberships?.data,
      userMembershipsDataLength: userMemberships?.data?.length,
      activeOrg,
      activeOrgId: activeOrg?.id,
    })
  }, [userLoaded, user, isLoaded, userMemberships, activeOrg])

  // Include active org in the list if it exists but isn't in the memberships list
  // This hook must be called before any conditional returns
  const allOrganizations = React.useMemo(() => {
    if (!isLoaded || !userLoaded) {
      return []
    }
    
    const orgsMap = new Map()
    
    // Add all organizations from the list
    organizationMemberships.forEach((membership) => {
      if (membership?.organization) {
        orgsMap.set(membership.organization.id, {
          organization: membership.organization,
          role: membership.role,
        })
      }
    })
    
    // Add active org if it's not already in the list
    // This is important - if useOrganizationList isn't returning data, we still show the active org
    if (activeOrg && !orgsMap.has(activeOrg.id)) {
      orgsMap.set(activeOrg.id, {
        organization: activeOrg,
        role: null, // We don't have role info from useOrganization
      })
    }
    
    const result = Array.from(orgsMap.values())
    console.log("allOrganizations computed:", result, {
      organizationMembershipsLength: organizationMemberships.length,
      activeOrgExists: !!activeOrg,
      activeOrgId: activeOrg?.id,
    })
    return result
  }, [isLoaded, userLoaded, organizationMemberships, activeOrg])

  if (!userLoaded || !isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs">Organizations</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Always show dropdown, even if no organizations
  // This allows users to see the "Create organization" option

  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleOrgSwitch = async (orgId: string) => {
    if (orgId === activeOrg?.id) {
      return
    }
    
    // Use setActiveFromList if available (from useOrganizationList), otherwise use setActive from useOrganization
    const switchFn = setActiveFromList || setActive
    
    if (!switchFn) {
      console.error("setActive is not available - neither from useOrganizationList nor useOrganization")
      alert("Unable to switch organization. Please ensure you're authenticated.")
      return
    }
    
    try {
      console.log("Switching to organization:", orgId, "using:", setActiveFromList ? "setActiveFromList" : "setActive")
      await switchFn({ organization: orgId })
      // Small delay to ensure Clerk context updates
      await new Promise(resolve => setTimeout(resolve, 300))
      // Revalidate to refresh loader data with new org context
      revalidator.revalidate()
    } catch (error) {
      console.error("Failed to switch organization:", error)
      alert(`Failed to switch organization: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              type="button"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeOrg?.imageUrl ? (
                  <img
                    src={activeOrg.imageUrl}
                    alt={activeOrg.name}
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {activeOrg ? getOrgInitials(activeOrg.name) : "?"}
                  </span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrg?.name || "No Organization"}
                </span>
                <span className="truncate text-xs">
                  {activeOrg?.membersCount
                    ? `${activeOrg.membersCount} member${
                        activeOrg.membersCount !== 1 ? "s" : ""
                      }`
                    : "Select organization"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-50"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {allOrganizations.length > 0 ? (
              allOrganizations.map((orgMembership) => {
                const org = orgMembership.organization
                const isActive = activeOrg?.id === org.id
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onSelect={() => {
                      if (!isActive) {
                        handleOrgSwitch(org.id)
                      }
                    }}
                    className={`gap-2 p-2 cursor-pointer ${isActive ? "bg-accent opacity-75" : "hover:bg-accent"}`}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      {org.imageUrl ? (
                        <img
                          src={org.imageUrl}
                          alt={org.name}
                          className="size-6 rounded-md object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold">
                          {getOrgInitials(org.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{org.name}</div>
                      {orgMembership.role && (
                        <div className="text-xs text-muted-foreground">
                          {orgMembership.role.replace("org:", "")}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                )
              })
            ) : (
              <DropdownMenuItem disabled className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Building2 className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  No organizations
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
