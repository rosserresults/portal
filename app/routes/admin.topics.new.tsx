import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { TopicForm } from "~/components/admin/topic-form"
import { Link } from "react-router"
import { createTopic } from "~/lib/courses"
import { isAdmin, getUserId, getAllOrganizations } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.topics.new"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)

  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const organizations = await getAllOrganizations()

  return { organizations }
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
  const title = formData.get("title") as string
  const isPublic = formData.get("is_public") === "true"
  const organizationIdsJson = formData.get("organization_ids") as string

  if (!title) {
    return { error: "Title is required" }
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
    await createTopic(
      {
        title,
        is_public: isPublic,
        organization_ids: organizationIds,
      },
      userId
    )

    return redirect(`/dashboard/admin/topics`)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create topic",
    }
  }
}

export default function NewTopicPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { organizations } = loaderData

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
                <Link
                  to="/dashboard/admin/topics"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Manage Topics
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-semibold">New Topic</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Create New Topic</h2>
                <p className="text-muted-foreground">
                  Add a new learning topic with sections
                </p>
              </div>

              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <div className="rounded-lg border bg-card p-6">
                <TopicForm organizations={organizations} />
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
