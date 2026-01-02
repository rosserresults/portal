import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { AssetFolder } from "~/types/asset"

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: AssetFolder[]
  folder?: AssetFolder | null
  onSave: (data: { name: string; parent_id?: string | null }) => Promise<void>
}

export function FolderDialog({
  open,
  onOpenChange,
  folders,
  folder,
  onSave,
}: FolderDialogProps) {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setParentId(folder.parent_id)
    } else {
      setName("")
      setParentId(null)
    }
  }, [folder, open])

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        parent_id: parentId,
      })
      setName("")
      setParentId(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setName("")
      setParentId(null)
      onOpenChange(false)
    }
  }

  // Filter out current folder and its children from parent options
  const availableFolders = folder
    ? folders.filter((f) => f.id !== folder.id)
    : folders

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create Folder"}</DialogTitle>
          <DialogDescription>
            {folder
              ? "Update the folder name and location"
              : "Create a new folder to organize your assets"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Folder</Label>
            <Select
              value={parentId || "none"}
              onValueChange={(value) => setParentId(value === "none" ? null : value)}
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Root (no parent)</SelectItem>
                {availableFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? "Saving..." : folder ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
