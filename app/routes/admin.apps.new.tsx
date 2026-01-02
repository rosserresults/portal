import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { AppForm } from "~/components/admin/app-form"
import { Link } from "react-router"
import { createApp } from "~/lib/apps"
import { isAdmin, getUserId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.apps.new"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  return null
}

export async function action(args: Route.ActionArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const userId = await getUserId(args)
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 })
  }

  const formData = await args.request.formData()
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const url = formData.get("url") as string
  const isPublic = formData.get("is_public") === "true"
  const organizationIdsJson = formData.get("organization_ids") as string
  const iconFile = formData.get("icon") as File | null

  if (!name || !url) {
    return { error: "Name and URL are required" }
  }

  let organizationIds: string[] = []
  if (!isPublic && organizationIdsJson) {
    try {
      organizationIds = JSON.parse(organizationIdsJson)
    } catch {
      return { error: "Invalid organization IDs format" }
    }
  }

  try {
    const app = await createApp(
      {
        name,
        description: description || undefined,
        url,
        is_public: isPublic,
        organization_ids: organizationIds,
      },
      iconFile && iconFile.size > 0 ? iconFile : null,
      userId
    )

    return redirect(`/dashboard/admin/apps`)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create app",
    }
  }
}

export default function NewAppPage({ actionData }: Route.ComponentProps) {
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
                <Link to="/dashboard/admin/apps" className="text-muted-foreground hover:text-foreground">
                  Manage Apps
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-semibold">New App</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Create New App</h2>
                <p className="text-muted-foreground">
                  Add a new app that users can access
                </p>
              </div>

              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <div className="rounded-lg border bg-card p-6">
                <AppForm />
              </div>
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
