import { Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Pencil, Trash2, GripVertical } from "lucide-react"
import type { Section } from "~/types/course"

interface SectionListProps {
  sections: Section[]
  isDeleting?: string | null
  onEdit?: (sectionId: string) => void
}

export function SectionList({
  sections,
  isDeleting,
  onEdit,
}: SectionListProps) {
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No sections yet. Add your first section to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="card-enter flex items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <div className="flex items-center gap-2 pt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {section.order}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold">{section.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {section.content}
            </p>
            {section.youtube_url && (
              <span className="mt-1 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                Video
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(section.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Form method="post">
              <input type="hidden" name="intent" value="delete_section" />
              <input type="hidden" name="sectionId" value={section.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isDeleting === section.id}
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
