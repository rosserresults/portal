export interface App {
  id: string;
  name: string;
  description: string | null;
  url: string;
  icon_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AppWithOrgs extends App {
  organizations: string[];
}

export interface CreateAppInput {
  name: string;
  description?: string;
  url: string;
  is_public: boolean;
  organization_ids: string[];
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  url?: string;
  is_public?: boolean;
  organization_ids?: string[];
}
