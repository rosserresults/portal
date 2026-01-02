import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Service role key - NEVER expose this to the client
// This bypasses RLS and should only be used server-side for admin operations
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase URL. Please check your .env file and ensure VITE_SUPABASE_URL is set."
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase service role key. Please check your .env file and ensure SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY is set."
  );
}

/**
 * Server-side Supabase client with service role key
 * This bypasses RLS and should ONLY be used for admin operations
 * that are already protected by application-level authorization checks
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
