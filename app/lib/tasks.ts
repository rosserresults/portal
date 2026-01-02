import { supabaseAdmin } from "./supabase.server";
import { fetchMany, fetchOne, insertOne, updateOne, deleteOne } from "./supabase-helpers";
import type { Task, CreateTaskInput, UpdateTaskInput } from "~/types/task";

/**
 * Get all tasks for an organization
 */
export async function getTasksForOrg(orgId: string): Promise<Task[]> {
  return fetchMany<Task>(
    supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
  );
}

/**
 * Get incomplete (open) tasks for an organization
 */
export async function getOpenTasksForOrg(orgId: string): Promise<Task[]> {
  return fetchMany<Task>(
    supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("organization_id", orgId)
      .eq("completed", false)
      .order("created_at", { ascending: false })
  );
}

/**
 * Get all tasks (admin only) - uses admin client to bypass RLS
 */
export async function getAllTasks(): Promise<Task[]> {
  return fetchMany<Task>(
    supabaseAdmin
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

/**
 * Get tasks for the current organization (admin only)
 */
export async function getTasksForCurrentOrg(orgId: string): Promise<Task[]> {
  return getTasksForOrg(orgId);
}

/**
 * Get a single task by ID
 * Security: Verifies task belongs to the provided organization
 */
export async function getTaskById(taskId: string, orgId: string): Promise<Task> {
  const task = await fetchOne<Task>(
    supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("organization_id", orgId)
      .single()
  );
  
  if (!task) {
    throw new Error("Task not found or access denied");
  }
  
  return task;
}

/**
 * Create a new task
 */
export async function createTask(
  taskData: CreateTaskInput,
  userId: string,
  orgId: string
): Promise<Task> {
  return insertOne<Task>(
    supabaseAdmin
      .from("tasks")
      .insert({
        title: taskData.title,
        description: taskData.description || null,
        organization_id: orgId,
        created_by: userId,
        completed: false,
      })
      .select()
      .single()
  );
}

/**
 * Update a task
 * Security: Verifies task belongs to the provided organization
 */
export async function updateTask(
  taskId: string,
  taskData: UpdateTaskInput,
  orgId: string
): Promise<Task> {
  // Verify task exists and belongs to org
  await getTaskById(taskId, orgId);
  
  const updateData: Partial<Task> = {};
  if (taskData.title !== undefined) updateData.title = taskData.title;
  if (taskData.description !== undefined) updateData.description = taskData.description || null;

  return updateOne<Task>(
    supabaseAdmin
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("organization_id", orgId)
      .select()
      .single()
  );
}

/**
 * Mark a task as complete
 * Security: Verifies task belongs to the provided organization
 */
export async function completeTask(taskId: string, userId: string, orgId: string): Promise<Task> {
  // Verify task exists and belongs to org
  await getTaskById(taskId, orgId);
  
  return updateOne<Task>(
    supabaseAdmin
      .from("tasks")
      .update({
        completed: true,
        completed_by: userId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("organization_id", orgId)
      .select()
      .single()
  );
}

/**
 * Mark a task as incomplete
 * Security: Verifies task belongs to the provided organization
 */
export async function uncompleteTask(taskId: string, orgId: string): Promise<Task> {
  // Verify task exists and belongs to org
  await getTaskById(taskId, orgId);
  
  return updateOne<Task>(
    supabaseAdmin
      .from("tasks")
      .update({
        completed: false,
        completed_by: null,
        completed_at: null,
      })
      .eq("id", taskId)
      .eq("organization_id", orgId)
      .select()
      .single()
  );
}

/**
 * Delete a task
 * Security: Verifies task belongs to the provided organization
 */
export async function deleteTask(taskId: string, orgId: string): Promise<void> {
  // Verify task exists and belongs to org
  await getTaskById(taskId, orgId);
  
  await deleteOne(
    supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("organization_id", orgId)
      .select()
      .single()
  );
}
