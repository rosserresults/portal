import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
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

interface AssetUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: AssetFolder[]
  onUpload: (data: {
    title: string
    description?: string
    folder_id?: string | null
    file: File
  }) => Promise<void>
}

export function AssetUploadDialog({
  open,
  onOpenChange,
  folders,
  onUpload,
}: AssetUploadDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [folderId, setFolderId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        // Auto-fill title from filename
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
        setTitle(nameWithoutExt)
      }

      // Generate preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      return
    }

    setIsUploading(true)
    try {
      await onUpload({
        title: title.trim(),
        description: description.trim() || undefined,
        folder_id: folderId,
        file,
      })
      // Reset form
      setTitle("")
      setDescription("")
      setFolderId(null)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Upload error:", error)
      // Error handling is done in parent component
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setTitle("")
      setDescription("")
      setFolderId(null)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Asset</DialogTitle>
          <DialogDescription>
            Upload a new asset for your organization
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : "Select file"}
              </Button>
            </div>
            {file && (
              <div className="text-sm text-muted-foreground">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md border">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter asset title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter asset description (optional)"
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={folderId || "none"}
              onValueChange={(value) => setFolderId(value === "none" ? null : value)}
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !title.trim() || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
