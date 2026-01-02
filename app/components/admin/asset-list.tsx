import { useState } from "react"
import { Link } from "react-router"
import { 
  Download, 
  Trash2, 
  Edit, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  Archive,
  File,
  Folder,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import type { AssetWithFolder, AssetFilters } from "~/types/asset"

interface AssetListProps {
  assets: AssetWithFolder[]
  folders: Array<{ id: string; name: string; parent_id: string | null }>
  currentFolderId?: string | null
  filters: AssetFilters
  onFiltersChange: (filters: AssetFilters) => void
  onDelete: (assetId: string) => void
  onDownload: (assetId: string) => void
  isDeleting?: string | null
}

export function AssetList({
  assets,
  folders,
  currentFolderId,
  filters,
  onFiltersChange,
  onDelete,
  onDownload,
  isDeleting,
}: AssetListProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as AssetFilters["sort_by"],
      sort_order: sortOrder as AssetFilters["sort_order"],
    })
  }

  const handleFolderFilter = (folderId: string | null) => {
    onFiltersChange({ ...filters, folder_id: folderId })
  }

  const handleFileTypeFilter = (fileType: string | null) => {
    onFiltersChange({ ...filters, file_type: fileType || undefined })
  }

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (fileType === "image") return <ImageIcon className="h-8 w-8" />
    if (fileType === "video") return <Video className="h-8 w-8" />
    if (fileType === "audio") return <Music className="h-8 w-8" />
    if (fileType === "document") return <FileText className="h-8 w-8" />
    if (fileType === "archive") return <Archive className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filters.folder_id === null ? "none" : filters.folder_id || "all"}
            onValueChange={(value) => handleFolderFilter(value === "all" ? undefined : value === "none" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              <SelectItem value="none">No folder</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.file_type || "all"}
            onValueChange={(value) => handleFileTypeFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleSortChange("created_at", "desc")}
              >
                <SortDesc className="h-4 w-4 mr-2" />
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("created_at", "asc")}
              >
                <SortAsc className="h-4 w-4 mr-2" />
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("title", "asc")}
              >
                <SortAsc className="h-4 w-4 mr-2" />
                Title A-Z
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("title", "desc")}
              >
                <SortDesc className="h-4 w-4 mr-2" />
                Title Z-A
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("file_size", "desc")}
              >
                <SortDesc className="h-4 w-4 mr-2" />
                Largest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("file_size", "asc")}
              >
                <SortAsc className="h-4 w-4 mr-2" />
                Smallest first
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Asset Grid */}
      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Folder className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No assets found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search || filters.folder_id || filters.file_type
              ? "Try adjusting your filters"
              : "Upload your first asset to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="group relative overflow-hidden">
              <CardContent className="p-0">
                {/* Preview */}
                <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {asset.preview_url ? (
                    <img
                      src={asset.preview_url}
                      alt={asset.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      {getFileIcon(asset.file_type, asset.mime_type)}
                      <span className="mt-2 text-xs">{asset.file_type}</span>
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDownload(asset.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(asset.id)}
                      disabled={isDeleting === asset.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold truncate">{asset.title}</h3>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {asset.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(asset.file_size)}</span>
                    {asset.folder && (
                      <span className="flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {asset.folder.name}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
