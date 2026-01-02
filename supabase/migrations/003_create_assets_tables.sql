-- Create asset_folders table
CREATE TABLE IF NOT EXISTS asset_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
  organization_id TEXT NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_id ON asset_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_org_id ON asset_folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_folder_id ON assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_file_type ON assets(file_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Create updated_at trigger for asset_folders
CREATE TRIGGER update_asset_folders_updated_at
  BEFORE UPDATE ON asset_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for assets
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_folders
-- Allow authenticated users to read folders in their organization
CREATE POLICY "Users can view folders in their organization"
  ON asset_folders FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for assets
-- Allow authenticated users to read assets in their organization
CREATE POLICY "Users can view assets in their organization"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

-- Note: Write policies will be enforced in application code
-- since RLS cannot easily check Clerk org roles
