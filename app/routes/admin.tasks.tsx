import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { useNavigation } from "react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { Button } from "~/components/ui/button"
import { TaskList } from "~/components/admin/task-list"
import { Plus } from "lucide-react"
import { Link, Form } from "react-router"
import { getTasksForCurrentOrg, deleteTask } from "~/lib/tasks"
import { isAdmin, getOrgId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.tasks"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const orgId = await getOrgId(args)
  if (!orgId) {
    throw new Response("Organization required", { status: 400 })
  }

  const tasks = await getTasksForCurrentOrg(orgId)
  return { tasks }
}

export async function action(args: Route.ActionArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    const taskId = formData.get("taskId") as string
    if (!taskId) {
      return { error: "Task ID is required" }
    }

    const orgId = await getOrgId(args)
    if (!orgId) {
      return { error: "Organization required" }
    }

    try {
      await deleteTask(taskId, orgId)
      return { success: true }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to delete task" }
    }
  }

  return { error: "Invalid action" }
}

export default function AdminTasksPage({ loaderData, actionData, navigation }: Route.ComponentProps) {
  const { tasks } = loaderData
  const nav = useNavigation()
  const isDeleting = nav.formData?.get("intent") === "delete" 
    ? nav.formData.get("taskId") as string 
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
                <h1 className="text-lg font-semibold">Manage Tasks</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Tasks</h2>
                  <p className="text-muted-foreground">
                    Manage tasks for your organization
                  </p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/admin/tasks/new">
                    <Plus className="h-4 w-4" />
                    Add Task
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
                  Task deleted successfully
                </div>
              )}

              <TaskList
                tasks={tasks}
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
