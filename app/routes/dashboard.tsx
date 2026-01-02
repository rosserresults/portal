import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { useNavigation } from "react-router"
import { AppSidebar } from "~/components/app-sidebar"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { AppCard } from "~/components/app-card"
import { TaskCard } from "~/components/task-card"
import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { getAppsForUser } from "~/lib/apps"
import { getOpenTasksForOrg, completeTask, uncompleteTask } from "~/lib/tasks"
import { getUserId, getUserOrgIds, getOrgId } from "~/lib/clerk-helpers"
import type { Route } from "./+types/dashboard"

export async function loader(args: Route.LoaderArgs) {
  const userId = await getUserId(args)
  
  if (!userId) {
    return { apps: [], tasks: [] }
  }

  const orgIds = await getUserOrgIds(args)
  const apps = await getAppsForUser(userId, orgIds)
  
  // Get open tasks for current org
  const orgId = await getOrgId(args)
  const tasks = orgId ? await getOpenTasksForOrg(orgId) : []
  
  return { apps, tasks }
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

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { apps, tasks } = loaderData
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

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
                <h1 className="text-lg font-semibold">Dashboard</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              {tasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Open Tasks</h2>
                      <p className="text-muted-foreground">
                        Tasks that need attention
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to="/dashboard/tasks">View All Tasks</Link>
                    </Button>
                  </div>
                  <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.slice(0, 6).map((task, index) => (
                      <div
                        key={task.id}
                        className="stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TaskCard task={task} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Apps</h2>
                  <p className="text-muted-foreground">
                    Access your available applications
                  </p>
                </div>

                {apps.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">
                      No apps available. Contact your administrator to add apps.
                    </p>
                  </div>
                ) : (
                  <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {apps.map((app, index) => (
                      <div
                        key={app.id}
                        className="stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <AppCard app={app} />
                      </div>
                    ))}
                  </div>
                )}
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
