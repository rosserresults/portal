-- Create apps table
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create app_organizations junction table
CREATE TABLE IF NOT EXISTS app_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, organization_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_organizations_app_id ON app_organizations(app_id);
CREATE INDEX IF NOT EXISTS idx_app_organizations_org_id ON app_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_apps_is_public ON apps(is_public);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for apps table
CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for apps table
-- Allow authenticated users to read apps they have access to
CREATE POLICY "Users can view public apps"
  ON apps FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

-- Note: Organization-specific app access is handled in application code
-- RLS policies allow reading app_organizations table, and the app
-- queries filter based on user's organization IDs

-- RLS Policies for app_organizations table
-- Allow authenticated users to read app_organizations
CREATE POLICY "Users can view app_organizations"
  ON app_organizations FOR SELECT
  TO authenticated
  USING (true);

-- Note: Admin write policies will be enforced in application code
-- since RLS cannot easily check Clerk org roles
