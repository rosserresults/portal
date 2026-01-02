import { useState, useRef, useEffect } from "react"
import { Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { AppOrgSelector } from "./app-org-selector"
import { Trash2, Upload } from "lucide-react"
import type { AppWithOrgs } from "~/types/app"

interface AppFormProps {
  app?: AppWithOrgs
  onSubmit?: (formData: FormData) => void
  isSubmitting?: boolean
  organizations?: Array<{ id: string; name: string }>
}

export function AppForm({ app, onSubmit, isSubmitting = false, organizations }: AppFormProps) {
  const [isPublic, setIsPublic] = useState(app?.is_public ?? false)
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(
    app?.organizations || []
  )
  const [iconPreview, setIconPreview] = useState<string | null>(
    app?.icon_url || null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveIcon = () => {
    setIconPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Sync hidden inputs with state
  useEffect(() => {
    if (formRef.current) {
      const orgIdsInput = formRef.current.querySelector<HTMLInputElement>('input[name="organization_ids"]')
      const isPublicInput = formRef.current.querySelector<HTMLInputElement>('input[name="is_public"]')
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
    // The useEffect should handle this, but sync here as well for safety
    const form = e.currentTarget
    const orgIdsInput = form.querySelector<HTMLInputElement>('input[name="organization_ids"]')
    const isPublicInput = form.querySelector<HTMLInputElement>('input[name="is_public"]')
    if (orgIdsInput) orgIdsInput.value = JSON.stringify(selectedOrgIds)
    if (isPublicInput) isPublicInput.value = isPublic.toString()
    // Don't preventDefault - let React Router handle the submission
  }

  return (
    <Form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" method="post" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">App Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={app?.name}
          required
          placeholder="My App"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={app?.description || ""}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="A brief description of the app..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          name="url"
          type="url"
          defaultValue={app?.url}
          required
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-4">
          {iconPreview && (
            <div className="relative">
              <img
                src={iconPreview}
                alt="Icon preview"
                className="h-16 w-16 rounded-lg object-cover border"
              />
              <button
                type="button"
                onClick={handleRemoveIcon}
                className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              name="icon"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, SVG or WebP. Max 5MB.
            </p>
          </div>
        </div>
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
      <input type="hidden" name="organization_ids" value={JSON.stringify(selectedOrgIds)} />
      <input type="hidden" name="is_public" value={isPublic.toString()} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : app ? "Update App" : "Create App"}
        </Button>
      </div>
    </Form>
  )
}
