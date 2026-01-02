import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Type-safe error handler for Supabase queries
 */
export function handleSupabaseError(error: PostgrestError | null): void {
  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message || "Database operation failed");
  }
}

/**
 * Type-safe helper for fetching a single row
 */
export async function fetchOne<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query;
  handleSupabaseError(error);
  if (!data) {
    throw new Error("No data returned from query");
  }
  return data;
}

/**
 * Type-safe helper for fetching multiple rows
 */
export async function fetchMany<T>(
  query: Promise<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  const { data, error } = await query;
  handleSupabaseError(error);
  return data || [];
}

/**
 * Type-safe helper for insert operations
 */
export async function insertOne<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query;
  handleSupabaseError(error);
  if (!data) {
    throw new Error("Insert operation returned no data");
  }
  return data;
}

/**
 * Type-safe helper for update operations
 */
export async function updateOne<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query;
  handleSupabaseError(error);
  if (!data) {
    throw new Error("Update operation returned no data");
  }
  return data;
}

/**
 * Type-safe helper for delete operations
 */
export async function deleteOne<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query;
  handleSupabaseError(error);
  if (!data) {
    throw new Error("Delete operation returned no data");
  }
  return data;
}

/**
 * Re-export supabase client for direct access when needed
 */
export { supabase };
