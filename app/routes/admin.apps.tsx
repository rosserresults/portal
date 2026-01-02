import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { Button } from "~/components/ui/button"
import { AppList } from "~/components/admin/app-list"
import { Plus } from "lucide-react"
import { Link, Form } from "react-router"
import { getAllApps, deleteApp } from "~/lib/apps"
import { isAdmin, getUserId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.apps"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const apps = await getAllApps()
  return { apps }
}

export async function action(args: Route.ActionArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    const appId = formData.get("appId") as string
    if (!appId) {
      return { error: "App ID is required" }
    }

    try {
      await deleteApp(appId)
      return { success: true }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to delete app" }
    }
  }

  return { error: "Invalid action" }
}

export default function AdminAppsPage({ loaderData, actionData, navigation }: Route.ComponentProps) {
  const { apps } = loaderData
  const isDeleting = navigation?.formData?.get("intent") === "delete" 
    ? navigation.formData.get("appId") as string 
    : null

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-lg font-semibold">Manage Apps</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Apps</h2>
                  <p className="text-muted-foreground">
                    Manage apps that users can access
                  </p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/admin/apps/new">
                    <Plus className="h-4 w-4" />
                    Add App
                  </Link>
                </Button>
              </div>

              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              {actionData?.success && (
                <div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
                  App deleted successfully
                </div>
              )}

              <AppList
                apps={apps}
                isDeleting={isDeleting}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
