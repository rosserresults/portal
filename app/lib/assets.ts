import { supabaseAdmin } from "./supabase.server";
import { fetchMany, fetchOne, insertOne, updateOne, deleteOne } from "./supabase-helpers";
import type {
  Asset,
  AssetFolder,
  AssetWithFolder,
  CreateAssetInput,
  CreateFolderInput,
  UpdateAssetInput,
  UpdateFolderInput,
  AssetFilters,
} from "~/types/asset";

const BUCKET_NAME = "client-assets";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Upload an asset file to Supabase storage
 */
export async function uploadAssetFile(
  file: File,
  organizationId: string
): Promise<{ filePath: string; previewUrl: string | null }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${organizationId}/${fileName}`;

  // Upload to Supabase storage
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL for preview
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Generate preview URL for images
  let previewUrl: string | null = null;
  if (file.type.startsWith("image/")) {
    previewUrl = urlData.publicUrl;
  }

  return {
    filePath,
    previewUrl,
  };
}

/**
 * Delete an asset file from Supabase storage
 */
export async function deleteAssetFile(filePath: string): Promise<void> {
  if (!filePath) return;

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Failed to delete file:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * Get download URL for an asset
 */
export async function getAssetDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Get all folders for an organization
 */
export async function getFolders(organizationId: string): Promise<AssetFolder[]> {
  return await fetchMany<AssetFolder>(
    supabaseAdmin
      .from("asset_folders")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true })
  );
}

/**
 * Get a single folder by ID
 */
export async function getFolderById(folderId: string): Promise<AssetFolder> {
  return await fetchOne<AssetFolder>(
    supabaseAdmin
      .from("asset_folders")
      .select("*")
      .eq("id", folderId)
      .single()
  );
}

/**
 * Create a new folder
 */
export async function createFolder(
  folderData: CreateFolderInput,
  organizationId: string,
  userId: string
): Promise<AssetFolder> {
  return await insertOne<AssetFolder>(
    supabaseAdmin
      .from("asset_folders")
      .insert({
        name: folderData.name,
        parent_id: folderData.parent_id || null,
        organization_id: organizationId,
        created_by: userId,
      })
      .select()
      .single()
  );
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  folderData: UpdateFolderInput
): Promise<AssetFolder> {
  const updateData: Partial<AssetFolder> = {};
  if (folderData.name !== undefined) updateData.name = folderData.name;
  if (folderData.parent_id !== undefined) updateData.parent_id = folderData.parent_id || null;

  return await updateOne<AssetFolder>(
    supabaseAdmin
      .from("asset_folders")
      .update(updateData)
      .eq("id", folderId)
      .select()
      .single()
  );
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<void> {
  await deleteOne(
    supabaseAdmin
      .from("asset_folders")
      .delete()
      .eq("id", folderId)
      .select()
      .single()
  );
}

/**
 * Get assets with optional filters
 */
export async function getAssets(
  organizationId: string,
  filters?: AssetFilters
): Promise<AssetWithFolder[]> {
  let query = supabaseAdmin
    .from("assets")
    .select(`
      *,
      folder:asset_folders(*)
    `)
    .eq("organization_id", organizationId);

  // Apply filters
  if (filters?.folder_id !== undefined) {
    if (filters.folder_id === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", filters.folder_id);
    }
  }

  if (filters?.file_type) {
    query = query.eq("file_type", filters.file_type);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  const sortField = filters?.sort_by || "created_at";
  const sortOrder = filters?.sort_order || "desc";
  query = query.order(sortField, { ascending: sortOrder === "asc" });

  const assets = await fetchMany<AssetWithFolder>(query);
  return assets;
}

/**
 * Get a single asset by ID
 * Security: Verifies asset belongs to the provided organization
 */
export async function getAssetById(assetId: string, organizationId: string): Promise<AssetWithFolder> {
  const asset = await fetchOne<AssetWithFolder>(
    supabaseAdmin
      .from("assets")
      .select(`
        *,
        folder:asset_folders(*)
      `)
      .eq("id", assetId)
      .eq("organization_id", organizationId)
      .single()
  );
  
  if (!asset) {
    throw new Error("Asset not found or access denied");
  }
  
  return asset;
}

/**
 * Create a new asset
 */
export async function createAsset(
  assetData: CreateAssetInput,
  file: File,
  organizationId: string,
  userId: string
): Promise<AssetWithFolder> {
  // Upload file
  const { filePath, previewUrl } = await uploadAssetFile(file, organizationId);

  // Determine file type from extension
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  const fileType = getFileTypeCategory(fileExt, file.type);

  // Create asset record
  const asset = await insertOne<Asset>(
    supabaseAdmin
      .from("assets")
      .insert({
        title: assetData.title,
        description: assetData.description || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        mime_type: file.type,
        folder_id: assetData.folder_id || null,
        organization_id: organizationId,
        preview_url: previewUrl,
        created_by: userId,
      })
      .select()
      .single()
  );

  // Fetch with folder relation
  return await getAssetById(asset.id, organizationId);
}

/**
 * Update an asset
 * Security: Verifies asset belongs to the provided organization
 */
export async function updateAsset(
  assetId: string,
  assetData: UpdateAssetInput,
  organizationId: string
): Promise<AssetWithFolder> {
  // Verify asset exists and belongs to org
  await getAssetById(assetId, organizationId);
  
  const updateData: Partial<Asset> = {};
  if (assetData.title !== undefined) updateData.title = assetData.title;
  if (assetData.description !== undefined) updateData.description = assetData.description || null;
  if (assetData.folder_id !== undefined) updateData.folder_id = assetData.folder_id || null;

  await updateOne<Asset>(
    supabaseAdmin
      .from("assets")
      .update(updateData)
      .eq("id", assetId)
      .eq("organization_id", organizationId)
      .select()
      .single()
  );

  return await getAssetById(assetId, organizationId);
}

/**
 * Delete an asset
 * Security: Verifies asset belongs to the provided organization
 */
export async function deleteAsset(assetId: string, organizationId: string): Promise<void> {
  // Get asset to delete file - verify it belongs to org
  const asset = await getAssetById(assetId, organizationId);

  // Delete asset record
  await deleteOne(
    supabaseAdmin
      .from("assets")
      .delete()
      .eq("id", assetId)
      .eq("organization_id", organizationId)
      .select()
      .single()
  );

  // Delete file from storage
  await deleteAssetFile(asset.file_path);
}

/**
 * Categorize file type based on extension and mime type
 */
function getFileTypeCategory(extension: string, mimeType: string): string {
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
  const documentExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz"];

  if (imageExts.includes(extension) || mimeType.startsWith("image/")) {
    return "image";
  }
  if (videoExts.includes(extension) || mimeType.startsWith("video/")) {
    return "video";
  }
  if (audioExts.includes(extension) || mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (documentExts.includes(extension) || mimeType.includes("document") || mimeType.includes("pdf")) {
    return "document";
  }
  if (archiveExts.includes(extension) || mimeType.includes("zip") || mimeType.includes("archive")) {
    return "archive";
  }

  return "other";
}
