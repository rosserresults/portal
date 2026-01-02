import { ExternalLink } from "lucide-react"
import type { App } from "~/types/app"
import { cn } from "~/lib/utils"

interface AppCardProps {
  app: App
  className?: string
}

export function AppCard({ app, className }: AppCardProps) {
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "card-enter group relative flex flex-col gap-3 rounded-lg border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
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
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {app.name}
            </h3>
            {app.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {app.description}
              </p>
            )}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  )
}
