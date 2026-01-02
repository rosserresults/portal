import { useState, useRef, useEffect } from "react"
import { Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { AppOrgSelector } from "./app-org-selector"
import type { TopicWithOrgs } from "~/types/course"

interface TopicFormProps {
  topic?: TopicWithOrgs
  onSubmit?: (formData: FormData) => void
  isSubmitting?: boolean
  organizations?: Array<{ id: string; name: string }>
  intent?: string
}

export function TopicForm({
  topic,
  onSubmit,
  isSubmitting = false,
  organizations,
  intent,
}: TopicFormProps) {
  const [isPublic, setIsPublic] = useState(topic?.is_public ?? false)
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(
    topic?.organizations || []
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Sync hidden inputs with state
  useEffect(() => {
    if (formRef.current) {
      const orgIdsInput = formRef.current.querySelector<HTMLInputElement>(
        'input[name="organization_ids"]'
      )
      const isPublicInput = formRef.current.querySelector<HTMLInputElement>(
        'input[name="is_public"]'
      )
      if (orgIdsInput) orgIdsInput.value = JSON.stringify(selectedOrgIds)
      if (isPublicInput) isPublicInput.value = isPublic.toString()
    }
  }, [selectedOrgIds, isPublic])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // If custom onSubmit handler provided, call it
    if (onSubmit) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      formData.set("organization_ids", JSON.stringify(selectedOrgIds))
      formData.set("is_public", isPublic.toString())
      onSubmit(formData)
      return
    }
    // For React Router Form, ensure hidden inputs are synced
    const form = e.currentTarget
    const orgIdsInput = form.querySelector<HTMLInputElement>(
      'input[name="organization_ids"]'
    )
    const isPublicInput = form.querySelector<HTMLInputElement>(
      'input[name="is_public"]'
    )
    if (orgIdsInput) orgIdsInput.value = JSON.stringify(selectedOrgIds)
    if (isPublicInput) isPublicInput.value = isPublic.toString()
    // Don't preventDefault - let React Router handle the submission
  }

  return (
    <Form
      ref={formRef}
      onSubmit={handleSubmit}
      method="post"
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Topic Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={topic?.title}
          required
          placeholder="Introduction to Web Development"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_public" className="cursor-pointer font-normal">
            Available to everyone (public)
          </Label>
        </div>

        {!isPublic && (
          <AppOrgSelector
            selectedOrgIds={selectedOrgIds}
            onSelectionChange={setSelectedOrgIds}
            disabled={isSubmitting}
            organizations={organizations}
          />
        )}
      </div>

      {/* Hidden inputs for form submission */}
      {intent && <input type="hidden" name="intent" value={intent} />}
      <input
        type="hidden"
        name="organization_ids"
        value={JSON.stringify(selectedOrgIds)}
      />
      <input type="hidden" name="is_public" value={isPublic.toString()} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : topic
              ? "Update Topic"
              : "Create Topic"}
        </Button>
      </div>
    </Form>
  )
}
