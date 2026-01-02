import { Link, Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Pencil, Trash2, ExternalLink } from "lucide-react"
import type { AppWithOrgs } from "~/types/app"

interface AppListProps {
  apps: AppWithOrgs[]
  isDeleting?: string | null
}

export function AppList({ apps, isDeleting }: AppListProps) {
  if (apps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No apps yet. Create your first app to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {apps.map((app) => (
        <div
          key={app.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-4 flex-1">
            {app.icon_url ? (
              <img
                src={app.icon_url}
                alt={app.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <span className="text-lg font-semibold text-muted-foreground">
                  {app.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{app.name}</h3>
                {app.is_public && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Public
                  </span>
                )}
              </div>
              {app.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {app.description}
                </p>
              )}
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {app.url}
                </a>
                {!app.is_public && app.organizations.length > 0 && (
                  <span>
                    {app.organizations.length} org{app.organizations.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/admin/apps/${app.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="appId" value={app.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isDeleting === app.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Form>
          </div>
        </div>
      ))}
    </div>
  )
}
