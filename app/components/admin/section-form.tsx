import { Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import type { Section } from "~/types/course"

interface SectionFormProps {
  section?: Section
  onSubmit?: (formData: FormData) => void
  isSubmitting?: boolean
  intent?: string
  sectionId?: string
}

export function SectionForm({
  section,
  onSubmit,
  isSubmitting = false,
  intent,
  sectionId,
}: SectionFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      onSubmit(formData)
      return
    }
    // Let React Router handle the submission
  }

  return (
    <Form onSubmit={handleSubmit} method="post" className="space-y-4">
      {intent && <input type="hidden" name="intent" value={intent} />}
      {sectionId && <input type="hidden" name="sectionId" value={sectionId} />}
      <div className="space-y-2">
        <Label htmlFor="section_title">Section Title *</Label>
        <Input
          id="section_title"
          name="section_title"
          defaultValue={section?.title}
          required
          placeholder="Getting Started"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="section_content">Content *</Label>
        <textarea
          id="section_content"
          name="section_content"
          defaultValue={section?.content || ""}
          rows={8}
          required
          className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter the content for this section..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtube_url">YouTube URL (optional)</Label>
        <Input
          id="youtube_url"
          name="youtube_url"
          type="url"
          defaultValue={section?.youtube_url || ""}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-muted-foreground">
          Paste a YouTube video URL to embed it in this section
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : section ? "Update Section" : "Create Section"}
        </Button>
      </div>
    </Form>
  )
}
