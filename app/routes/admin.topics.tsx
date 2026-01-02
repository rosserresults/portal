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
import { TopicList } from "~/components/admin/topic-list"
import { Plus } from "lucide-react"
import { Link, Form } from "react-router"
import { getAllTopics, deleteTopic } from "~/lib/courses"
import { isAdmin } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.topics"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)

  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const topics = await getAllTopics()
  return { topics }
}

export async function action(args: Route.ActionArgs) {
  const admin = await isAdmin(args)

  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    const topicId = formData.get("topicId") as string
    if (!topicId) {
      return { error: "Topic ID is required" }
    }

    try {
      await deleteTopic(topicId)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to delete topic",
      }
    }
  }

  return { error: "Invalid action" }
}

export default function AdminTopicsPage({
  loaderData,
  actionData,
  navigation,
}: Route.ComponentProps) {
  const { topics } = loaderData
  const nav = useNavigation()
  const isDeleting =
    nav.formData?.get("intent") === "delete"
      ? (nav.formData.get("topicId") as string)
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
                <h1 className="text-lg font-semibold">Manage Topics</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Topics</h2>
                  <p className="text-muted-foreground">
                    Manage learning topics and their sections
                  </p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/admin/topics/new">
                    <Plus className="h-4 w-4" />
                    Add Topic
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
                  Topic deleted successfully
                </div>
              )}

              <TopicList topics={topics} isDeleting={isDeleting} />
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
