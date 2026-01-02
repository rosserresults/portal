export interface Topic {
  id: string;
  title: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TopicWithOrgs extends Topic {
  organizations: string[];
}

export interface Section {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  youtube_url: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TopicWithSections extends Topic {
  sections: Section[];
}

export interface TopicWithOrgsAndSections extends TopicWithOrgs {
  sections: Section[];
}

export interface CreateTopicInput {
  title: string;
  is_public: boolean;
  organization_ids: string[];
}

export interface UpdateTopicInput {
  title?: string;
  is_public?: boolean;
  organization_ids?: string[];
}

export interface CreateSectionInput {
  title: string;
  content: string;
  youtube_url?: string | null;
  order?: number;
}

export interface UpdateSectionInput {
  title?: string;
  content?: string;
  youtube_url?: string | null;
  order?: number;
}
