# Supabase Setup Instructions

## Database Migration

Run the migration file to create the necessary tables:

```sql
-- Run supabase/migrations/001_create_apps_tables.sql
```

This will create:
- `apps` table for storing app information
- `app_organizations` junction table for org-specific app access
- Row Level Security (RLS) policies

## Storage Bucket Setup

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `app-icons`
4. Set the bucket to **Public** (so app icons can be accessed)
5. Configure CORS if needed for your domain

## RLS Policies

The migration includes basic RLS policies. Note that organization-specific access filtering is handled in application code rather than RLS policies, as RLS cannot easily check Clerk organization membership.

## Testing

After setup:
1. Ensure you have a Clerk organization with an admin user
2. Log in as an admin user
3. Navigate to Admin > Manage Apps in the sidebar
4. Create a test app
