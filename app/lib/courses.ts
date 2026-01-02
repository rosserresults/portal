import { supabaseAdmin } from "./supabase.server";
import { fetchMany, fetchOne, insertOne, updateOne, deleteOne } from "./supabase-helpers";
import type {
  Topic,
  TopicWithOrgs,
  TopicWithSections,
  TopicWithOrgsAndSections,
  CreateTopicInput,
  UpdateTopicInput,
  CreateSectionInput,
  UpdateSectionInput,
  Section,
} from "~/types/course";

/**
 * Get topics visible to a user based on their org memberships
 * Uses admin client to bypass RLS (since we use Clerk for auth, not Supabase Auth)
 * Security is maintained through application-level filtering
 */
export async function getTopicsForUser(
  userId: string,
  orgIds: string[]
): Promise<Topic[]> {
  // Get public topics
  const { data: publicTopics, error: publicError } = await supabaseAdmin
    .from("topics")
    .select("*")
    .eq("is_public", true);

  if (publicError) {
    throw new Error(`Failed to fetch public topics: ${publicError.message}`);
  }

  // Get org-specific topics if user has orgs
  let orgTopics: Topic[] = [];
  if (orgIds.length > 0) {
    const { data: orgTopicsData, error: orgError } = await supabaseAdmin
      .from("topic_organizations")
      .select("topic_id, topics(*)")
      .in("organization_id", orgIds);

    if (orgError) {
      throw new Error(`Failed to fetch org topics: ${orgError.message}`);
    }

    orgTopics = (orgTopicsData || [])
      .map((item: any) => item.topics)
      .filter((topic: Topic | null) => topic !== null) as Topic[];
  }

  // Combine and deduplicate
  const allTopics = [...(publicTopics || []), ...orgTopics];
  const uniqueTopics = Array.from(
    new Map(allTopics.map((topic) => [topic.id, topic])).values()
  );

  return uniqueTopics;
}

/**
 * Get a topic with its sections for a user (if accessible)
 */
export async function getTopicWithSections(
  topicId: string,
  orgIds: string[]
): Promise<TopicWithSections> {
  // First check if topic is accessible
  const { data: topicData, error: topicError } = await supabaseAdmin
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();

  if (topicError || !topicData) {
    throw new Error("Topic not found");
  }

  const topic = topicData as Topic;

  // Check access: must be public OR user's org must have access
  if (!topic.is_public) {
    if (orgIds.length === 0) {
      throw new Error("Access denied");
    }

    const { data: orgAccess } = await supabaseAdmin
      .from("topic_organizations")
      .select("organization_id")
      .eq("topic_id", topicId)
      .in("organization_id", orgIds)
      .limit(1);

    if (!orgAccess || orgAccess.length === 0) {
      throw new Error("Access denied");
    }
  }

  // Get sections ordered by order field
  const { data: sectionsData, error: sectionsError } = await supabaseAdmin
    .from("sections")
    .select("*")
    .eq("topic_id", topicId)
    .order("order", { ascending: true });

  if (sectionsError) {
    throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
  }

  return {
    ...topic,
    sections: (sectionsData || []) as Section[],
  };
}

/**
 * Get all topics (admin only) - uses admin client to bypass RLS
 */
export async function getAllTopics(): Promise<TopicWithOrgs[]> {
  const topics = await fetchMany<Topic>(
    supabaseAdmin
      .from("topics")
      .select("*")
      .order("created_at", { ascending: false })
  );

  // Fetch organizations for each topic
  const topicsWithOrgs = await Promise.all(
    topics.map(async (topic) => {
      const { data: orgData } = await supabaseAdmin
        .from("topic_organizations")
        .select("organization_id")
        .eq("topic_id", topic.id);

      return {
        ...topic,
        organizations: (orgData || []).map((item) => item.organization_id),
      };
    })
  );

  return topicsWithOrgs;
}

/**
 * Get a single topic by ID (admin only) - uses admin client to bypass RLS
 */
export async function getTopicById(topicId: string): Promise<TopicWithOrgsAndSections> {
  const topic = await fetchOne<Topic>(
    supabaseAdmin.from("topics").select("*").eq("id", topicId).single()
  );

  const { data: orgData } = await supabaseAdmin
    .from("topic_organizations")
    .select("organization_id")
    .eq("topic_id", topic.id);

  const { data: sectionsData } = await supabaseAdmin
    .from("sections")
    .select("*")
    .eq("topic_id", topic.id)
    .order("order", { ascending: true });

  return {
    ...topic,
    organizations: (orgData || []).map((item) => item.organization_id),
    sections: (sectionsData || []) as Section[],
  };
}

/**
 * Get the next order value for sections in a topic
 */
async function getNextSectionOrder(topicId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("sections")
    .select("order")
    .eq("topic_id", topicId)
    .order("order", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return (data[0] as Section).order + 1;
  }
  return 1;
}

/**
 * Create a new topic
 */
export async function createTopic(
  topicData: CreateTopicInput,
  userId: string
): Promise<TopicWithOrgs> {
  // Create topic (use admin client to bypass RLS)
  const topic = await insertOne<Topic>(
    supabaseAdmin
      .from("topics")
      .insert({
        title: topicData.title,
        is_public: topicData.is_public,
        created_by: userId,
      })
      .select()
      .single()
  );

  // Create organization associations if not public
  if (!topicData.is_public && topicData.organization_ids.length > 0) {
    const orgInserts = topicData.organization_ids.map((orgId) => ({
      topic_id: topic.id,
      organization_id: orgId,
    }));

    const { error: orgError } = await supabaseAdmin
      .from("topic_organizations")
      .insert(orgInserts);

    if (orgError) {
      // Clean up topic if org insert fails
      await supabaseAdmin.from("topics").delete().eq("id", topic.id);
      throw new Error(`Failed to create topic organizations: ${orgError.message}`);
    }
  }

  return {
    ...topic,
    organizations: topicData.is_public ? [] : topicData.organization_ids,
  };
}

/**
 * Update a topic
 */
export async function updateTopic(
  topicId: string,
  topicData: UpdateTopicInput,
  userId: string
): Promise<TopicWithOrgs> {
  // Get existing topic (use admin client to bypass RLS)
  const existingTopic = await fetchOne<Topic>(
    supabaseAdmin.from("topics").select("*").eq("id", topicId).single()
  );

  // Update topic
  const updateData: Partial<Topic> = {};
  if (topicData.title !== undefined) updateData.title = topicData.title;
  if (topicData.is_public !== undefined) updateData.is_public = topicData.is_public;

  const { data: updatedTopic, error: updateError } = await supabaseAdmin
    .from("topics")
    .update(updateData)
    .eq("id", topicId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update topic: ${updateError.message}`);
  }

  if (!updatedTopic) {
    throw new Error("Topic not found or update returned no data");
  }

  const topic = updatedTopic;

  // Update organization associations if provided
  if (topicData.organization_ids !== undefined) {
    // Delete existing associations
    await supabaseAdmin
      .from("topic_organizations")
      .delete()
      .eq("topic_id", topicId);

    // Create new associations if not public
    if (!topic.is_public && topicData.organization_ids.length > 0) {
      const orgInserts = topicData.organization_ids.map((orgId) => ({
        topic_id: topicId,
        organization_id: orgId,
      }));

      const { error: orgError } = await supabaseAdmin
        .from("topic_organizations")
        .insert(orgInserts);

      if (orgError) {
        throw new Error(`Failed to update topic organizations: ${orgError.message}`);
      }
    }
  }

  // Fetch updated organizations (use admin client to bypass RLS)
  const { data: orgData } = await supabaseAdmin
    .from("topic_organizations")
    .select("organization_id")
    .eq("topic_id", topic.id);

  return {
    ...topic,
    organizations: (orgData || []).map((item) => item.organization_id),
  };
}

/**
 * Delete a topic
 */
export async function deleteTopic(topicId: string): Promise<void> {
  // Delete topic (cascade will delete topic_organizations and sections) - use admin client to bypass RLS
  const { error: deleteError } = await supabaseAdmin
    .from("topics")
    .delete()
    .eq("id", topicId);

  if (deleteError) {
    throw new Error(`Failed to delete topic: ${deleteError.message}`);
  }
}

/**
 * Create a new section
 */
export async function createSection(
  topicId: string,
  sectionData: CreateSectionInput
): Promise<Section> {
  // Get next order if not provided
  const order =
    sectionData.order !== undefined
      ? sectionData.order
      : await getNextSectionOrder(topicId);

  return insertOne<Section>(
    supabaseAdmin
      .from("sections")
      .insert({
        topic_id: topicId,
        title: sectionData.title,
        content: sectionData.content,
        youtube_url: sectionData.youtube_url || null,
        order: order,
      })
      .select()
      .single()
  );
}

/**
 * Update a section
 */
export async function updateSection(
  sectionId: string,
  sectionData: UpdateSectionInput
): Promise<Section> {
  const updateData: Partial<Section> = {};
  if (sectionData.title !== undefined) updateData.title = sectionData.title;
  if (sectionData.content !== undefined) updateData.content = sectionData.content;
  if (sectionData.youtube_url !== undefined)
    updateData.youtube_url = sectionData.youtube_url || null;
  if (sectionData.order !== undefined) updateData.order = sectionData.order;

  return updateOne<Section>(
    supabaseAdmin
      .from("sections")
      .update(updateData)
      .eq("id", sectionId)
      .select()
      .single()
  );
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId: string): Promise<void> {
  await deleteOne(
    supabaseAdmin.from("sections").delete().eq("id", sectionId).select().single()
  );
}

/**
 * Reorder sections within a topic
 */
export async function reorderSections(
  topicId: string,
  sectionIds: string[]
): Promise<void> {
  // Update each section's order based on its position in the array
  const updates = sectionIds.map((sectionId, index) =>
    supabaseAdmin
      .from("sections")
      .update({ order: index + 1 })
      .eq("id", sectionId)
      .eq("topic_id", topicId)
  );

  await Promise.all(updates);
}
