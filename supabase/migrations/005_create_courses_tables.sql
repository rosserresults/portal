-- Create topics table (courses)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topic_organizations junction table
CREATE TABLE IF NOT EXISTS topic_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, organization_id)
);

-- Create sections table (lessons)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  youtube_url TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at);
CREATE INDEX IF NOT EXISTS idx_topic_organizations_topic_id ON topic_organizations(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_organizations_org_id ON topic_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sections_topic_id ON sections(topic_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(topic_id, "order");

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics table
-- Allow authenticated users to read public topics
CREATE POLICY "Users can view public topics"
  ON topics FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

-- Note: Organization-specific topic access is handled in application code
-- RLS policies allow reading topic_organizations table, and the topic
-- queries filter based on user's organization IDs

-- RLS Policies for topic_organizations table
-- Allow authenticated users to read topic_organizations
CREATE POLICY "Users can view topic_organizations"
  ON topic_organizations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for sections table
-- Allow authenticated users to read sections
CREATE POLICY "Users can view sections"
  ON sections FOR SELECT
  TO authenticated
  USING (true);

-- Note: Admin write policies will be enforced in application code
-- since RLS cannot easily check Clerk org roles

-- Add write policies for topics table
CREATE POLICY "Authenticated users can insert topics"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update topics"
  ON topics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete topics"
  ON topics FOR DELETE
  TO authenticated
  USING (true);

-- Add write policies for topic_organizations table
CREATE POLICY "Authenticated users can insert topic_organizations"
  ON topic_organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update topic_organizations"
  ON topic_organizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete topic_organizations"
  ON topic_organizations FOR DELETE
  TO authenticated
  USING (true);

-- Add write policies for sections table
CREATE POLICY "Authenticated users can insert sections"
  ON sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sections"
  ON sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sections"
  ON sections FOR DELETE
  TO authenticated
  USING (true);
