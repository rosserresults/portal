import { getAuth } from "@clerk/react-router/server";

/**
 * Check if the current user is an admin in their current organization
 * 
 * Requirements:
 * 1. User must be authenticated
 * 2. User must be in an organization context
 * 3. User must have the "org:admin" role in that organization
 * 
 * To make a user an admin:
 * - Go to Clerk Dashboard → Organizations → [Your Org] → Members
 * - Set the user's role to "Admin"
 * 
 * @param loaderArgs - The loader/action args from React Router
 * @returns true if user is an admin, false otherwise
 */
export async function isAdmin(loaderArgs: { request: Request }): Promise<boolean> {
  const { userId, orgId, orgRole } = await getAuth(loaderArgs);
  
  // User must be authenticated
  if (!userId) {
    return false;
  }

  // User must be in an organization and have admin role
  // Clerk uses "org:admin" as the role identifier for organization admins
  return !!(orgId && orgRole === "org:admin");
}

/**
 * Get the current user's organization IDs
 * This function should be called from server-side loaders/actions
 */
export async function getUserOrgIds(loaderArgs: { request: Request }): Promise<string[]> {
  const { orgId } = await getAuth(loaderArgs);
  
  // For now, return single org ID if available
  // In a more complex setup, you might fetch all orgs from Clerk API
  return orgId ? [orgId] : [];
}

/**
 * Get the current user ID
 */
export async function getUserId(loaderArgs: { request: Request }): Promise<string | null> {
  const { userId } = await getAuth(loaderArgs);
  return userId;
}
