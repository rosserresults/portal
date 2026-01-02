import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { useState, useEffect } from "react"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { TopicForm } from "~/components/admin/topic-form"
import { SectionForm } from "~/components/admin/section-form"
import { SectionList } from "~/components/admin/section-list"
import { Button } from "~/components/ui/button"
import { Link, Form, useNavigation } from "react-router"
import {
  getTopicById,
  updateTopic,
  createSection,
  updateSection,
  deleteSection,
} from "~/lib/courses"
import { isAdmin, getUserId, getAllOrganizations } from "~/lib/clerk-helpers"
import { Plus } from "lucide-react"
import type { Route } from "./+types/admin.topics.$id"
import type { Section } from "~/types/course"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)

  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const [topic, organizations] = await Promise.all([
    getTopicById(args.params.id),
    getAllOrganizations(),
  ])

  return { topic, organizations }
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
  const intent = formData.get("intent")

  if (intent === "update_topic") {
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
      await updateTopic(
        args.params.id,
        {
          title,
          is_public: isPublic,
          organization_ids: organizationIds,
        },
        userId
      )

      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to update topic",
      }
    }
  }

  if (intent === "create_section") {
    const sectionTitle = formData.get("section_title") as string
    const sectionContent = formData.get("section_content") as string
    const youtubeUrl = formData.get("youtube_url") as string

    if (!sectionTitle || !sectionContent) {
      return { error: "Section title and content are required" }
    }

    try {
      await createSection(args.params.id, {
        title: sectionTitle,
        content: sectionContent,
        youtube_url: youtubeUrl || null,
      })

      return { success: true }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to create section",
      }
    }
  }

  if (intent === "update_section") {
    const sectionId = formData.get("sectionId") as string
    const sectionTitle = formData.get("section_title") as string
    const sectionContent = formData.get("section_content") as string
    const youtubeUrl = formData.get("youtube_url") as string

    if (!sectionId || !sectionTitle || !sectionContent) {
      return { error: "Section ID, title, and content are required" }
    }

    try {
      await updateSection(sectionId, {
        title: sectionTitle,
        content: sectionContent,
        youtube_url: youtubeUrl || null,
      })

      return { success: true }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to update section",
      }
    }
  }

  if (intent === "delete_section") {
    const sectionId = formData.get("sectionId") as string

    if (!sectionId) {
      return { error: "Section ID is required" }
    }

    try {
      await deleteSection(sectionId)
      return { success: true }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete section",
      }
    }
  }

  return { error: "Invalid action" }
}

export default function EditTopicPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { topic, organizations } = loaderData
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const nav = useNavigation()
  const isDeleting =
    nav.formData?.get("intent") === "delete_section"
      ? (nav.formData.get("sectionId") as string)
      : null

  const editingSection = editingSectionId
    ? topic.sections.find((s) => s.id === editingSectionId)
    : null

  // Reset form state after successful action
  useEffect(() => {
    if (actionData?.success) {
      setShowSectionForm(false)
      setEditingSectionId(null)
    }
  }, [actionData?.success])

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
                <h1 className="text-lg font-semibold">Edit Topic</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              {actionData?.success && (
                <div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
                  Changes saved successfully
                </div>
              )}

              {/* Topic Form */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-bold">Topic Details</h2>
                <TopicForm
                  topic={topic}
                  organizations={organizations}
                  intent="update_topic"
                />
              </div>

              {/* Sections */}
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Sections</h2>
                  {!showSectionForm && !editingSectionId && (
                    <Button
                      onClick={() => setShowSectionForm(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Section
                    </Button>
                  )}
                </div>

                {showSectionForm && !editingSectionId && (
                  <div className="mb-6 rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold">New Section</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSectionForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <SectionForm intent="create_section" />
                  </div>
                )}

                {editingSectionId && editingSection && (
                  <div className="mb-6 rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold">Edit Section</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSectionId(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <SectionForm
                      section={editingSection}
                      intent="update_section"
                      sectionId={editingSection.id}
                    />
                  </div>
                )}

                <SectionList
                  sections={topic.sections}
                  isDeleting={isDeleting}
                  onEdit={setEditingSectionId}
                />
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
