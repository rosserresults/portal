import { Link, useLocation } from "react-router"
import { cn } from "~/lib/utils"
import type { TopicWithSections } from "~/types/course"

interface SectionsSidebarProps {
  topic: TopicWithSections
}

export function SectionsSidebar({ topic }: SectionsSidebarProps) {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="w-64 shrink-0 h-full flex flex-col">
      <div className="rounded-lg border bg-card shadow-sm h-full flex flex-col">
        <div className="border-b p-4 shrink-0">
          <h3 className="text-sm font-semibold">{topic.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {topic.sections.length} section{topic.sections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="space-y-1">
            {topic.sections.map((section) => {
              const sectionPath = `/dashboard/learning/${topic.id}/${section.id}`
              const isActive = currentPath === sectionPath

              return (
                <Link
                  key={section.id}
                  to={sectionPath}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {section.order}
                  </span>
                  <span className="truncate">{section.title}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
