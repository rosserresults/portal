import { Download, Image as ImageIcon, FileText, Video, Music, Archive, File, Folder } from "lucide-react"
import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import type { AssetWithFolder } from "~/types/asset"

interface AssetBrowseGridProps {
  assets: AssetWithFolder[]
  onDownload: (assetId: string) => void
}

export function AssetBrowseGrid({ assets, onDownload }: AssetBrowseGridProps) {
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset, index) => (
        <Card 
          key={asset.id} 
          className="card-enter group relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ animationDelay: `${index * 30}ms` }}
        >
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
              {/* Overlay with download button */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDownload(asset.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
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
  )
}
