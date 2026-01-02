import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { TaskForm } from "~/components/admin/task-form"
import { Link } from "react-router"
import { createTask } from "~/lib/tasks"
import { isAdmin, getUserId, getOrgId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.tasks.new"

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

  const orgId = await getOrgId(args)
  if (!orgId) {
    throw new Response("Organization required", { status: 400 })
  }

  const formData = await args.request.formData()
  const title = formData.get("title") as string
  const description = formData.get("description") as string

  if (!title) {
    return { error: "Title is required" }
  }

  try {
    await createTask(
      {
        title,
        description: description || undefined,
      },
      userId,
      orgId
    )

    return redirect(`/dashboard/admin/tasks`)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create task",
    }
  }
}

export default function NewTaskPage({ actionData }: Route.ComponentProps) {
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
                <Link to="/dashboard/admin/tasks" className="text-muted-foreground hover:text-foreground">
                  Manage Tasks
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-semibold">New Task</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Create New Task</h2>
                <p className="text-muted-foreground">
                  Add a new task for your organization
                </p>
              </div>

              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <div className="rounded-lg border bg-card p-6">
                <TaskForm />
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
