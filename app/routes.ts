import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/admin/apps", "routes/admin.apps.tsx"),
  route("dashboard/admin/apps/new", "routes/admin.apps.new.tsx"),
  route("dashboard/admin/apps/:id", "routes/admin.apps.$id.tsx"),
] satisfies RouteConfig;
