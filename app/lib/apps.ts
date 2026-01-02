import { supabase, fetchMany, fetchOne, insertOne, updateOne, deleteOne } from "./supabase-helpers";
import { supabaseAdmin } from "./supabase.server";
import type { App, AppWithOrgs, CreateAppInput, UpdateAppInput } from "~/types/app";

// Note: We use supabaseAdmin for reads because RLS requires Supabase authentication,
// but we're using Clerk for auth. Security is maintained through application-level
// filtering (public status and org membership checks).

const BUCKET_NAME = "app-icons";
const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ICON_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

/**
 * Upload an app icon to Supabase storage
 */
export async function uploadAppIcon(file: File): Promise<string> {
  // Validate file
  if (!ALLOWED_ICON_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_ICON_TYPES.join(", ")}`);
  }
  
  if (file.size > MAX_ICON_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_ICON_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase storage (use admin client for write access)
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload icon: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete an app icon from Supabase storage
 */
export async function deleteAppIcon(iconUrl: string): Promise<void> {
  if (!iconUrl) return;

  try {
    // Extract file path from URL
    const url = new URL(iconUrl);
    const pathParts = url.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error("Failed to delete icon:", error);
      // Don't throw - icon deletion failure shouldn't block app deletion
    }
  } catch (error) {
    console.error("Error deleting icon:", error);
  }
}

/**
 * Get apps visible to a user based on their org memberships
 * Uses admin client to bypass RLS (since we use Clerk for auth, not Supabase Auth)
 * Security is maintained through application-level filtering
 */
export async function getAppsForUser(userId: string, orgIds: string[]): Promise<App[]> {
  // Get public apps
  const { data: publicApps, error: publicError } = await supabaseAdmin
    .from("apps")
    .select("*")
    .eq("is_public", true);

  if (publicError) {
    throw new Error(`Failed to fetch public apps: ${publicError.message}`);
  }

  // Get org-specific apps if user has orgs
  let orgApps: App[] = [];
  if (orgIds.length > 0) {
    const { data: orgAppsData, error: orgError } = await supabaseAdmin
      .from("app_organizations")
      .select("app_id, apps(*)")
      .in("organization_id", orgIds);

    if (orgError) {
      throw new Error(`Failed to fetch org apps: ${orgError.message}`);
    }

    orgApps = (orgAppsData || [])
      .map((item: any) => item.apps)
      .filter((app: App | null) => app !== null) as App[];
  }

  // Combine and deduplicate
  const allApps = [...(publicApps || []), ...orgApps];
  const uniqueApps = Array.from(
    new Map(allApps.map((app) => [app.id, app])).values()
  );

  return uniqueApps;
}

/**
 * Get all apps (admin only) - uses admin client to bypass RLS
 */
export async function getAllApps(): Promise<AppWithOrgs[]> {
  const apps = await fetchMany<App>(
    supabaseAdmin.from("apps").select("*").order("created_at", { ascending: false })
  );

  // Fetch organizations for each app
  const appsWithOrgs = await Promise.all(
    apps.map(async (app) => {
      const { data: orgData } = await supabaseAdmin
        .from("app_organizations")
        .select("organization_id")
        .eq("app_id", app.id);

      return {
        ...app,
        organizations: (orgData || []).map((item) => item.organization_id),
      };
    })
  );

  return appsWithOrgs;
}

/**
 * Get a single app by ID (admin only) - uses admin client to bypass RLS
 */
export async function getAppById(appId: string): Promise<AppWithOrgs> {
  const app = await fetchOne<App>(
    supabaseAdmin.from("apps").select("*").eq("id", appId).single()
  );

  const { data: orgData } = await supabaseAdmin
    .from("app_organizations")
    .select("organization_id")
    .eq("app_id", app.id);

  return {
    ...app,
    organizations: (orgData || []).map((item) => item.organization_id),
  };
}

/**
 * Create a new app
 */
export async function createApp(
  appData: CreateAppInput,
  iconFile: File | null,
  userId: string
): Promise<AppWithOrgs> {
  // Upload icon if provided
  let iconUrl: string | null = null;
  if (iconFile) {
    iconUrl = await uploadAppIcon(iconFile);
  }

  // Create app (use admin client to bypass RLS)
  const app = await insertOne<App>(
    supabaseAdmin
      .from("apps")
      .insert({
        name: appData.name,
        description: appData.description || null,
        url: appData.url,
        icon_url: iconUrl,
        is_public: appData.is_public,
        created_by: userId,
      })
      .select()
      .single()
  );

  // Create organization associations if not public
  if (!appData.is_public && appData.organization_ids.length > 0) {
    const orgInserts = appData.organization_ids.map((orgId) => ({
      app_id: app.id,
      organization_id: orgId,
    }));

    const { error: orgError } = await supabaseAdmin
      .from("app_organizations")
      .insert(orgInserts);

    if (orgError) {
      // Clean up app if org insert fails
      await supabaseAdmin.from("apps").delete().eq("id", app.id);
      if (iconUrl) await deleteAppIcon(iconUrl);
      throw new Error(`Failed to create app organizations: ${orgError.message}`);
    }
  }

  return {
    ...app,
    organizations: appData.is_public ? [] : appData.organization_ids,
  };
}

/**
 * Update an app
 */
export async function updateApp(
  appId: string,
  appData: UpdateAppInput,
  iconFile: File | null,
  userId: string
): Promise<AppWithOrgs> {
  // Get existing app
  const existingApp = await fetchOne<App>(
    supabase.from("apps").select("*").eq("id", appId).single()
  );

  // Upload new icon if provided
  let iconUrl: string | null = existingApp.icon_url;
  if (iconFile) {
    // Delete old icon if exists
    if (existingApp.icon_url) {
      await deleteAppIcon(existingApp.icon_url);
    }
    iconUrl = await uploadAppIcon(iconFile);
  }

  // Update app
  const updateData: Partial<App> = {};
  if (appData.name !== undefined) updateData.name = appData.name;
  if (appData.description !== undefined) updateData.description = appData.description || null;
  if (appData.url !== undefined) updateData.url = appData.url;
  if (appData.is_public !== undefined) updateData.is_public = appData.is_public;
  if (iconUrl !== null) updateData.icon_url = iconUrl;

  const app = await updateOne<App>(
    supabaseAdmin
      .from("apps")
      .update(updateData)
      .eq("id", appId)
      .select()
      .single()
  );

  // Update organization associations if provided
  if (appData.organization_ids !== undefined) {
    // Delete existing associations
    await supabaseAdmin.from("app_organizations").delete().eq("app_id", appId);

    // Create new associations if not public
    if (!app.is_public && appData.organization_ids.length > 0) {
      const orgInserts = appData.organization_ids.map((orgId) => ({
        app_id: appId,
        organization_id: orgId,
      }));

      const { error: orgError } = await supabaseAdmin
        .from("app_organizations")
        .insert(orgInserts);

      if (orgError) {
        throw new Error(`Failed to update app organizations: ${orgError.message}`);
      }
    }
  }

  // Fetch updated organizations
  const { data: orgData } = await supabase
    .from("app_organizations")
    .select("organization_id")
    .eq("app_id", app.id);

  return {
    ...app,
    organizations: (orgData || []).map((item) => item.organization_id),
  };
}

/**
 * Delete an app
 */
export async function deleteApp(appId: string): Promise<void> {
  // Get app to delete icon
  const app = await fetchOne<App>(
    supabase.from("apps").select("*").eq("id", appId).single()
  );

  // Delete app (cascade will delete app_organizations) - use admin client to bypass RLS
  await deleteOne(
    supabaseAdmin.from("apps").delete().eq("id", appId).select().single()
  );

  // Delete icon if exists
  if (app.icon_url) {
    await deleteAppIcon(app.icon_url);
  }
}
