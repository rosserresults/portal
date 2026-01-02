import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/assets", "routes/assets.tsx"),
  route("dashboard/tasks", "routes/tasks.tsx"),
  route("dashboard/learning", "routes/learning.tsx"),
  route("dashboard/learning/:topicId", "routes/learning.$topicId.tsx"),
  route("dashboard/learning/:topicId/:sectionId", "routes/learning.$topicId.$sectionId.tsx"),
  route("dashboard/admin/apps", "routes/admin.apps.tsx"),
  route("dashboard/admin/apps/new", "routes/admin.apps.new.tsx"),
  route("dashboard/admin/apps/:id", "routes/admin.apps.$id.tsx"),
  route("dashboard/admin/assets", "routes/admin.assets.tsx"),
  route("dashboard/admin/tasks", "routes/admin.tasks.tsx"),
  route("dashboard/admin/tasks/new", "routes/admin.tasks.new.tsx"),
  route("dashboard/admin/tasks/:id", "routes/admin.tasks.$id.tsx"),
  route("dashboard/admin/topics", "routes/admin.topics.tsx"),
  route("dashboard/admin/topics/new", "routes/admin.topics.new.tsx"),
  route("dashboard/admin/topics/:id", "routes/admin.topics.$id.tsx"),
] satisfies RouteConfig;
