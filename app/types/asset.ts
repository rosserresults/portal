export interface AssetFolder {
  id: string;
  name: string;
  parent_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Asset {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  folder_id: string | null;
  organization_id: string;
  preview_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AssetWithFolder extends Asset {
  folder?: AssetFolder | null;
}

export interface CreateAssetInput {
  title: string;
  description?: string;
  folder_id?: string | null;
}

export interface CreateFolderInput {
  name: string;
  parent_id?: string | null;
}

export interface UpdateAssetInput {
  title?: string;
  description?: string;
  folder_id?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  parent_id?: string | null;
}

export type AssetSortField = "title" | "created_at" | "file_size" | "file_type";
export type SortOrder = "asc" | "desc";

export interface AssetFilters {
  folder_id?: string | null;
  file_type?: string;
  search?: string;
  sort_by?: AssetSortField;
  sort_order?: SortOrder;
}
