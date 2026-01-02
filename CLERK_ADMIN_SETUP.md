# Clerk Admin Setup Guide

## How Admin Access Works

The application checks if a user has the `org:admin` role in their current Clerk organization. Here's how to set it up:

## Setting Up Admin Users in Clerk

### Option 1: Via Clerk Dashboard (Recommended)

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to Organizations**: Click on "Organizations" in the sidebar
3. **Select or Create an Organization**:
   - If you don't have an organization, create one
   - Click on the organization you want to manage
4. **Go to Members**: Click on the "Members" tab
5. **Assign Admin Role**:
   - Find the user you want to make an admin
   - Click on their name/email
   - In the "Role" dropdown, select **"Admin"**
   - Save the changes

### Option 2: Via Clerk API

You can also programmatically assign admin roles using the Clerk API:

```typescript
import { clerkClient } from "@clerk/clerk-sdk-node";

// Update organization membership role
await clerkClient.organizations.updateOrganizationMembership({
  organizationId: "org_xxx",
  userId: "user_xxx",
  role: "org:admin",
});
```

## How the Application Checks Admin Status

### Server-Side (Loaders/Actions)

The `isAdmin()` function in `app/lib/clerk-helpers.ts` checks:

- If user is authenticated
- If user has `org:admin` role in the current organization

```typescript
export async function isAdmin(loaderArgs: { request: Request }): Promise<boolean> {
  const { userId, orgId, orgRole } = await getAuth(loaderArgs);

  if (!userId) {
    return false;
  }

  // Check if user has admin role in the current organization
  if (orgId && orgRole === "org:admin") {
    return true;
  }

  return orgRole === "org:admin";
}
```

### Client-Side (Components)

The sidebar uses `useOrganization()` hook to check admin status:

```typescript
const { membership } = useOrganization();
const isAdmin = membership?.role === "org:admin";
```

## Important Notes

1. **Organization Context**: The user must be **actively in an organization** for admin checks to work. If they're not in an organization context, they won't be considered an admin.

2. **Role Names**: Clerk uses the role identifier `org:admin` (not just `admin`). This is the default admin role in Clerk organizations.

3. **Multiple Organizations**: If a user is in multiple organizations, they need to have admin role in the **currently active** organization to access admin features.

## Testing Admin Access

1. **Create/Join an Organization**:
   - Sign up or log in to your app
   - Create an organization or join an existing one
   - Make sure you're "active" in that organization

2. **Assign Admin Role**:
   - Go to Clerk Dashboard → Organizations → [Your Org] → Members
   - Assign yourself the "Admin" role

3. **Verify**:
   - Refresh your app
   - You should see the "Admin" section in the sidebar
   - You should be able to access `/dashboard/admin/apps`

## Troubleshooting

### Admin menu not showing?

- Check that you're in an organization context (not just logged in)
- Verify your role is `org:admin` in Clerk Dashboard
- Check browser console for any errors

### Getting 403 Unauthorized?

- Ensure you're in an organization when accessing admin routes
- Verify your role in Clerk Dashboard
- Try logging out and back in to refresh the session

### User not in organization?

- Users need to be part of an organization to have admin access
- You can invite users to organizations via Clerk Dashboard or API
- Users can also create their own organizations

## Custom Roles

If you want to use custom roles instead of the default `org:admin`:

1. **Create Custom Role in Clerk Dashboard**:
   - Go to Organizations → Settings → Roles
   - Create a new role (e.g., "App Admin")

2. **Update the Code**:
   - Change `org:admin` to your custom role identifier
   - Example: `orgRole === "org:app_admin"`
