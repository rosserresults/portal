import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { useNavigation } from "react-router"
import { AppSidebar } from "~/components/app-sidebar"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { TaskList as TaskListComponent } from "~/components/task-list"
import { getTasksForOrg, completeTask, uncompleteTask } from "~/lib/tasks"
import { getOrgId, getUserId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/tasks"

export async function loader(args: Route.LoaderArgs) {
  const orgId = await getOrgId(args)
  
  if (!orgId) {
    return { tasks: [] }
  }

  const tasks = await getTasksForOrg(orgId)
  return { tasks }
}

export async function action(args: Route.ActionArgs) {
  const userId = await getUserId(args)
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 })
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent")
  const taskId = formData.get("taskId") as string

  if (!taskId) {
    return { error: "Task ID is required" }
  }

  const orgId = await getOrgId(args)
  if (!orgId) {
    return { error: "Organization required" }
  }

  try {
    if (intent === "complete") {
      await completeTask(taskId, userId, orgId)
    } else if (intent === "uncomplete") {
      await uncompleteTask(taskId, orgId)
    } else {
      return { error: "Invalid action" }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update task",
    }
  }
}

export default function TasksPage({ loaderData }: Route.ComponentProps) {
  const { tasks } = loaderData

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
                <h1 className="text-lg font-semibold">Tasks</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Tasks</h2>
                <p className="text-muted-foreground">
                  View and manage tasks for your organization
                </p>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <p className="text-muted-foreground">
                    No tasks available. Contact your administrator to add tasks.
                  </p>
                </div>
              ) : (
                <TaskListComponent tasks={tasks} />
              )}
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
