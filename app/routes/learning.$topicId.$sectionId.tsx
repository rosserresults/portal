import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import { SectionsSidebar } from "~/components/sections-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { SectionView } from "~/components/section-view"
import { Button } from "~/components/ui/button"
import { Link } from "react-router"
import { getTopicWithSections } from "~/lib/courses"
import { getUserOrgIds } from "~/lib/clerk-helpers"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import type { Route } from "./+types/learning.$topicId.$sectionId"

export async function loader(args: Route.LoaderArgs) {
  const orgIds = await getUserOrgIds(args)

  try {
    const topic = await getTopicWithSections(args.params.topicId, orgIds)

    // If no section ID provided, redirect to first section
    if (!args.params.sectionId && topic.sections.length > 0) {
      return redirect(`/dashboard/learning/${topic.id}/${topic.sections[0].id}`)
    }

    const section = topic.sections.find((s) => s.id === args.params.sectionId)

    if (!section) {
      throw new Response("Section not found", { status: 404 })
    }

    return { topic, section }
  } catch (error) {
    if (error instanceof Error && error.message === "Access denied") {
      throw new Response("Access denied", { status: 403 })
    }
    if (error instanceof Error && error.message === "Topic not found") {
      throw new Response("Topic not found", { status: 404 })
    }
    throw error
  }
}

export default function SectionViewPage({ loaderData }: Route.ComponentProps) {
  const { topic, section } = loaderData

  const currentIndex = topic.sections.findIndex((s) => s.id === section.id)
  const previousSection =
    currentIndex > 0 ? topic.sections[currentIndex - 1] : null
  const nextSection =
    currentIndex < topic.sections.length - 1
      ? topic.sections[currentIndex + 1]
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
                <Link
                  to="/dashboard/learning"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Learning
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  to={`/dashboard/learning/${topic.id}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {topic.title}
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-semibold">{section.title}</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-row min-h-0 gap-4 p-4">
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <div className="page-content flex flex-1 flex-col gap-4">
                  {/* Topic Header */}
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{topic.title}</h2>
                          <span className="text-muted-foreground">/</span>
                          <h2 className="text-xl font-semibold text-muted-foreground">{section.title}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Section {section.order} of {topic.sections.length}
                        </p>
                      </div>
                      <Button variant="outline" asChild>
                        <Link to="/dashboard/learning">
                          <ArrowLeft className="h-4 w-4" />
                          Back to Topics
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Section Content */}
                  <SectionView section={section} />

                  {/* Navigation */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      {previousSection ? (
                        <Button variant="outline" asChild>
                          <Link
                            to={`/dashboard/learning/${topic.id}/${previousSection.id}`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous: {previousSection.title}
                          </Link>
                        </Button>
                      ) : (
                        <div />
                      )}
                    </div>
                    <div>
                      {nextSection ? (
                        <Button variant="outline" asChild>
                          <Link
                            to={`/dashboard/learning/${topic.id}/${nextSection.id}`}
                          >
                            Next: {nextSection.title}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <SectionsSidebar topic={topic} />
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
