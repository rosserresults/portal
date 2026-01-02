-- Add RLS policies for INSERT, UPDATE, and DELETE operations on apps table
-- Note: Admin authorization is enforced in application code (Clerk org roles)
-- These policies allow authenticated users to perform write operations

-- Allow authenticated users to insert apps
CREATE POLICY "Authenticated users can insert apps"
  ON apps FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update apps
CREATE POLICY "Authenticated users can update apps"
  ON apps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete apps
CREATE POLICY "Authenticated users can delete apps"
  ON apps FOR DELETE
  TO authenticated
  USING (true);

-- Add write policies for app_organizations table
-- Allow authenticated users to insert app_organizations
CREATE POLICY "Authenticated users can insert app_organizations"
  ON app_organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update app_organizations
CREATE POLICY "Authenticated users can update app_organizations"
  ON app_organizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete app_organizations
CREATE POLICY "Authenticated users can delete app_organizations"
  ON app_organizations FOR DELETE
  TO authenticated
  USING (true);
