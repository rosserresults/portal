import { useState, useEffect } from "react"
import { redirect, useFetcher } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { getAuth } from "@clerk/react-router/server"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { Button } from "~/components/ui/button"
import { Search, Folder } from "lucide-react"
import { AssetBrowseGrid } from "~/components/asset-browse-grid"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  getAssets,
  getFolders,
  getAssetDownloadUrl,
  getAssetById,
} from "~/lib/assets"
import { getUserOrgIds } from "~/lib/clerk-helpers"
import type { Route } from "./+types/assets"
import type { AssetFilters } from "~/types/asset"

export async function loader(args: Route.LoaderArgs) {
  const { userId, orgId } = await getAuth(args)
  
  if (!userId) {
    throw redirect("/sign-in")
  }

  if (!orgId) {
    throw redirect("/dashboard")
  }

  const assets = await getAssets(orgId)
  const folders = await getFolders(orgId)

  return { assets, folders }
}

export async function action(args: Route.ActionArgs) {
  const { userId, orgId } = await getAuth(args)
  
  if (!userId || !orgId) {
    return { error: "Unauthorized" }
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent")

  if (intent === "download-asset") {
    const assetId = formData.get("assetId") as string
    if (!assetId) {
      return { error: "Asset ID is required" }
    }
    try {
      // getAssetById now verifies org access internally
      const asset = await getAssetById(assetId, orgId)
      
      const downloadUrl = await getAssetDownloadUrl(asset.file_path)
      return { success: true, downloadUrl }
    } catch (error) {
      console.error("Error downloading asset:", error)
      return { 
        error: error instanceof Error ? error.message : "Failed to download asset" 
      }
    }
  }

  return { error: "Invalid action" }
}

export default function AssetsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { assets: initialAssets, folders: initialFolders } = loaderData
  const fetcher = useFetcher()
  const [assets, setAssets] = useState(initialAssets)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [searchQuery, setSearchQuery] = useState("")

  // Update assets when loader data changes
  useEffect(() => {
    setAssets(initialAssets)
  }, [initialAssets])

  // Filter and sort assets
  const filteredAssets = assets.filter((asset) => {
    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null && asset.folder_id !== null) return false
      if (filters.folder_id !== null && asset.folder_id !== filters.folder_id) return false
    }
    if (filters.file_type && asset.file_type !== filters.file_type) return false
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      if (
        !asset.title.toLowerCase().includes(searchLower) &&
        !asset.description?.toLowerCase().includes(searchLower) &&
        !asset.file_name.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    return true
  })

  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const sortField = filters.sort_by || "created_at"
    const sortOrder = filters.sort_order || "desc"
    const multiplier = sortOrder === "asc" ? 1 : -1

    if (sortField === "title") {
      return a.title.localeCompare(b.title) * multiplier
    }
    if (sortField === "file_size") {
      return (a.file_size - b.file_size) * multiplier
    }
    if (sortField === "file_type") {
      return a.file_type.localeCompare(b.file_type) * multiplier
    }
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * multiplier
  })

  // Handle download from fetcher.data
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success && fetcher.data.downloadUrl) {
        // Open download URL in new tab
        const link = document.createElement("a")
        link.href = fetcher.data.downloadUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (fetcher.data.error) {
        alert(fetcher.data.error)
      }
    }
  }, [fetcher.data])

  const handleDownload = (assetId: string) => {
    const form = new FormData()
    form.append("intent", "download-asset")
    form.append("assetId", assetId)
    fetcher.submit(form, { method: "POST" })
  }

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-lg font-semibold">Assets</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Browse Assets</h2>
                <p className="text-muted-foreground">
                  View and download assets from your organization
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setFilters({ ...filters, search: e.target.value || undefined })
                    }}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={filters.folder_id === null ? "none" : filters.folder_id || "all"}
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        folder_id: value === "all" ? undefined : value === "none" ? null : value,
                      })
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All folders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All folders</SelectItem>
                      <SelectItem value="none">No folder</SelectItem>
                      {initialFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.file_type || "all"}
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        file_type: value === "all" ? undefined : value,
                      })
                    }}
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
                  <Select
                    value={`${filters.sort_by || "created_at"}-${filters.sort_order || "desc"}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split("-")
                      setFilters({
                        ...filters,
                        sort_by: sortBy as AssetFilters["sort_by"],
                        sort_order: sortOrder as AssetFilters["sort_order"],
                      })
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest first</SelectItem>
                      <SelectItem value="created_at-asc">Oldest first</SelectItem>
                      <SelectItem value="title-asc">Title A-Z</SelectItem>
                      <SelectItem value="title-desc">Title Z-A</SelectItem>
                      <SelectItem value="file_size-desc">Largest first</SelectItem>
                      <SelectItem value="file_size-asc">Smallest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Asset Grid */}
              {sortedAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No assets found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filters.folder_id || filters.file_type
                      ? "Try adjusting your filters"
                      : "No assets available"}
                  </p>
                </div>
              ) : (
                <AssetBrowseGrid
                  assets={sortedAssets}
                  onDownload={handleDownload}
                />
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
