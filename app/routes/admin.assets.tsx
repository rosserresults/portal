import { useState, useEffect } from "react"
import * as React from "react"
import { redirect } from "react-router"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { useOrganization } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import { Button } from "~/components/ui/button"
import { Plus, FolderPlus } from "lucide-react"
import { Form } from "react-router"
import { AssetList } from "~/components/admin/asset-list"
import { AssetUploadDialog } from "~/components/admin/asset-upload-dialog"
import { FolderDialog } from "~/components/admin/folder-dialog"
import {
  getAssets,
  getFolders,
  createAsset,
  deleteAsset,
  getAssetDownloadUrl,
  getAssetById,
  createFolder,
  updateFolder,
  deleteFolder,
} from "~/lib/assets"
import { getAuth } from "@clerk/react-router/server"
import { isAdmin } from "~/lib/clerk-helpers"
import type { Route } from "./+types/admin.assets"
import type { AssetFilters } from "~/types/asset"

export async function loader(args: Route.LoaderArgs) {
  const admin = await isAdmin(args)
  
  if (!admin) {
    throw new Response("Unauthorized", { status: 403 })
  }

  const { orgId } = await getAuth(args)
  if (!orgId) {
    throw redirect("/dashboard")
  }

  const assets = await getAssets(orgId)
  const folders = await getFolders(orgId)

  return { assets, folders }
}

export async function action(args: Route.ActionArgs) {
  try {
    const admin = await isAdmin(args)
    
    if (!admin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    const auth = await getAuth(args)
    const { orgId, userId } = auth
    if (!orgId || !userId) {
      return Response.json({ error: "Organization and user ID required" }, { status: 400 })
    }

    const formData = await args.request.formData()
    const intent = formData.get("intent")

    if (intent === "upload-asset") {
      const title = formData.get("title") as string
      const description = formData.get("description") as string | null
      const folderId = formData.get("folder_id") as string | null
      const file = formData.get("file") as File | null

      if (!title || !file) {
        return Response.json({ error: "Title and file are required" }, { status: 400 })
      }

      try {
        const newAsset = await createAsset(
          {
            title,
            description: description || undefined,
            folder_id: folderId || undefined,
          },
          file,
          orgId,
          userId
        )

        return Response.json({ success: true, message: "Asset uploaded successfully", asset: newAsset })
      } catch (error) {
        console.error("Error creating asset:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to upload asset" 
        }, { status: 500 })
      }
    }

    if (intent === "create-folder") {
      const name = formData.get("name") as string
      const parentId = formData.get("parent_id") as string | null

      if (!name) {
        return Response.json({ error: "Folder name is required" }, { status: 400 })
      }

      try {
        const newFolder = await createFolder(
          {
            name,
            parent_id: parentId || undefined,
          },
          orgId,
          userId
        )

        return Response.json({ success: true, message: "Folder created successfully", folder: newFolder })
      } catch (error) {
        console.error("Error creating folder:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to create folder" 
        }, { status: 500 })
      }
    }

    if (intent === "update-folder") {
      const folderId = formData.get("folderId") as string
      const name = formData.get("name") as string
      const parentId = formData.get("parent_id") as string | null

      if (!folderId || !name) {
        return Response.json({ error: "Folder ID and name are required" }, { status: 400 })
      }

      try {
        const updatedFolder = await updateFolder(folderId, {
          name,
          parent_id: parentId || undefined,
        })

        return Response.json({ success: true, message: "Folder updated successfully", folder: updatedFolder })
      } catch (error) {
        console.error("Error updating folder:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to update folder" 
        }, { status: 500 })
      }
    }

    if (intent === "delete-asset") {
      const assetId = formData.get("assetId") as string
      if (!assetId) {
        return Response.json({ error: "Asset ID is required" }, { status: 400 })
      }
      try {
        await deleteAsset(assetId, orgId)
        return Response.json({ success: true, message: "Asset deleted successfully" })
      } catch (error) {
        console.error("Error deleting asset:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to delete asset" 
        }, { status: 500 })
      }
    }

    if (intent === "download-asset") {
      const assetId = formData.get("assetId") as string
      if (!assetId) {
        return Response.json({ error: "Asset ID is required" }, { status: 400 })
      }
      try {
        // getAssetById now verifies org access internally
        const asset = await getAssetById(assetId, orgId)
        const downloadUrl = await getAssetDownloadUrl(asset.file_path)
        return Response.json({ success: true, downloadUrl })
      } catch (error) {
        console.error("Error downloading asset:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to download asset" 
        }, { status: 500 })
      }
    }

    if (intent === "delete-folder") {
      const folderId = formData.get("folderId") as string
      if (!folderId) {
        return Response.json({ error: "Folder ID is required" }, { status: 400 })
      }
      try {
        await deleteFolder(folderId)
        return Response.json({ success: true, message: "Folder deleted successfully" })
      } catch (error) {
        console.error("Error deleting folder:", error)
        return Response.json({ 
          error: error instanceof Error ? error.message : "Failed to delete folder" 
        }, { status: 500 })
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Unexpected error in action:", error)
    return Response.json({ 
      error: error instanceof Error ? error.message : "Operation failed" 
    }, { status: 500 })
  }
}

export default function AdminAssetsPage({ loaderData, actionData, navigation }: Route.ComponentProps) {
  const { assets: initialAssets, folders: initialFolders } = loaderData
  const [assets, setAssets] = useState(initialAssets)
  const [folders, setFolders] = useState(initialFolders)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<typeof initialFolders[0] | null>(null)
  const isDeleting = navigation?.formData?.get("intent") === "delete-asset" 
    ? navigation.formData.get("assetId") as string 
    : null

  // Update state when loader data changes (after actions)
  useEffect(() => {
    if (actionData?.asset) {
      setAssets([actionData.asset, ...assets])
    }
    if (actionData?.folder) {
      if (editingFolder) {
        setFolders(folders.map((f) => (f.id === actionData.folder.id ? actionData.folder : f)))
      } else {
        setFolders([...folders, actionData.folder])
      }
    }
  }, [actionData])

  // Refresh data after successful delete
  useEffect(() => {
    if (actionData?.success && (navigation?.formData?.get("intent") === "delete-asset" || navigation?.formData?.get("intent") === "delete-folder")) {
      // Reload the page data
      window.location.reload()
    }
  }, [actionData, navigation])

  // Filter assets based on current filters
  const filteredAssets = assets.filter((asset) => {
    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null && asset.folder_id !== null) return false
      if (filters.folder_id !== null && asset.folder_id !== filters.folder_id) return false
    }
    if (filters.file_type && asset.file_type !== filters.file_type) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
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
    // created_at
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * multiplier
  })

  const handleUpload = async (data: {
    title: string
    description?: string
    folder_id?: string | null
    file: File
  }) => {
    const form = new FormData()
    form.append("intent", "upload-asset")
    form.append("title", data.title)
    if (data.description) form.append("description", data.description)
    if (data.folder_id) form.append("folder_id", data.folder_id)
    form.append("file", data.file)

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: form,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const result = await response.json()

      if (response.ok && result.asset) {
        setAssets([result.asset, ...assets])
        setUploadDialogOpen(false)
      } else {
        throw new Error(result.error || "Failed to upload asset")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload asset")
      throw error
    }
  }

  const handleDelete = async (assetId: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      const form = document.createElement("form")
      form.method = "POST"
      form.innerHTML = `
        <input type="hidden" name="intent" value="delete-asset" />
        <input type="hidden" name="assetId" value="${assetId}" />
      `
      document.body.appendChild(form)
      form.submit()
    }
  }

  const handleDownload = async (assetId: string) => {
    const form = new FormData()
    form.append("intent", "download-asset")
    form.append("assetId", assetId)

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: form,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const result = await response.json()

      if (response.ok && result.downloadUrl) {
        window.open(result.downloadUrl, "_blank")
      } else {
        throw new Error(result.error || "Failed to download asset")
      }
    } catch (error) {
      console.error("Download error:", error)
      alert(error instanceof Error ? error.message : "Failed to download asset")
    }
  }

  const handleCreateFolder = async (data: { name: string; parent_id?: string | null }) => {
    const form = new FormData()
    form.append("intent", "create-folder")
    form.append("name", data.name)
    if (data.parent_id) form.append("parent_id", data.parent_id)

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: form,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const result = await response.json()

      if (response.ok && result.folder) {
        setFolders([...folders, result.folder])
        setFolderDialogOpen(false)
      } else {
        throw new Error(result.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Create folder error:", error)
      alert(error instanceof Error ? error.message : "Failed to create folder")
    }
  }

  const handleUpdateFolder = async (data: { name: string; parent_id?: string | null }) => {
    if (!editingFolder) return

    const form = new FormData()
    form.append("intent", "update-folder")
    form.append("folderId", editingFolder.id)
    form.append("name", data.name)
    if (data.parent_id) form.append("parent_id", data.parent_id)

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: form,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const result = await response.json()

      if (response.ok && result.folder) {
        setFolders(folders.map((f) => (f.id === result.folder.id ? result.folder : f)))
        setEditingFolder(null)
        setFolderDialogOpen(false)
      } else {
        throw new Error(result.error || "Failed to update folder")
      }
    } catch (error) {
      console.error("Update folder error:", error)
      alert(error instanceof Error ? error.message : "Failed to update folder")
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm("Are you sure you want to delete this folder? Assets in this folder will be moved to the root.")) {
      const form = document.createElement("form")
      form.method = "POST"
      form.innerHTML = `
        <input type="hidden" name="intent" value="delete-folder" />
        <input type="hidden" name="folderId" value="${folderId}" />
      `
      document.body.appendChild(form)
      form.submit()
    }
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
                <h1 className="text-lg font-semibold">Manage Assets</h1>
              </div>
            </header>
            <div className="page-content flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Assets</h2>
                  <p className="text-muted-foreground">
                    Upload and organize assets for your organization
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingFolder(null)
                      setFolderDialogOpen(true)
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Asset
                  </Button>
                </div>
              </div>

              {actionData?.error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              {actionData?.success && (
                <div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
                  {actionData.message || "Operation completed successfully"}
                </div>
              )}

              <AssetList
                assets={sortedAssets}
                folders={folders}
                filters={filters}
                onFiltersChange={setFilters}
                onDelete={handleDelete}
                onDownload={handleDownload}
                isDeleting={isDeleting}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>

        <AssetUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          folders={folders}
          onUpload={handleUpload}
        />

        <FolderDialog
          open={folderDialogOpen}
          onOpenChange={(open) => {
            setFolderDialogOpen(open)
            if (!open) setEditingFolder(null)
          }}
          folders={folders}
          folder={editingFolder}
          onSave={editingFolder ? handleUpdateFolder : handleCreateFolder}
        />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
