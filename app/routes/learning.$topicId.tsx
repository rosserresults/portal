import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { getTopicWithSections } from "~/lib/courses"
import { getUserOrgIds } from "~/lib/clerk-helpers"
import type { Route } from "./+types/learning.$topicId"

export async function loader(args: Route.LoaderArgs) {
  const orgIds = await getUserOrgIds(args)

  try {
    const topic = await getTopicWithSections(args.params.topicId, orgIds)

    // Redirect to first section if topic has sections
    if (topic.sections.length > 0) {
      return redirect(`/dashboard/learning/${topic.id}/${topic.sections[0].id}`)
    }

    // If no sections, return topic data (will show empty state)
    return { topic }
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

// This component should rarely render since we redirect to first section
export default function TopicViewPage({ loaderData }: Route.ComponentProps) {
  const { topic } = loaderData

  // This will only show if topic has no sections
  return (
    <>
      <SignedIn>
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              This topic doesn't have any sections yet.
            </p>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
