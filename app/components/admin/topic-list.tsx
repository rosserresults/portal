import { Link, Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { TopicWithOrgs } from "~/types/course"

interface TopicListProps {
  topics: TopicWithOrgs[]
  isDeleting?: string | null
}

export function TopicList({ topics, isDeleting }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No topics yet. Create your first topic to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topics.map((topic, index) => (
        <div
          key={topic.id}
          className="card-enter flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <span className="text-lg font-semibold text-muted-foreground">
                {topic.title[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{topic.title}</h3>
                {topic.is_public && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Public
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                {!topic.is_public && topic.organizations.length > 0 && (
                  <span>
                    {topic.organizations.length} org
                    {topic.organizations.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/admin/topics/${topic.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="topicId" value={topic.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isDeleting === topic.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Form>
          </div>
        </div>
      ))}
    </div>
  )
}
