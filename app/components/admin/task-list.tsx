import { Link, Form } from "react-router"
import { Button } from "~/components/ui/button"
import { Pencil, Trash2, CheckCircle2, Circle } from "lucide-react"
import { Checkbox } from "~/components/ui/checkbox"
import type { Task } from "~/types/task"

interface TaskListProps {
  tasks: Task[]
  isDeleting?: string | null
}

export function TaskList({ tasks, isDeleting }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="card-enter flex items-start justify-between rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="mt-1">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-sm text-muted-foreground mt-1 ${task.completed ? "line-through" : ""}`}>
                  {task.description}
                </p>
              )}
              {task.completed && task.completed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Completed {new Date(task.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/admin/tasks/${task.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="taskId" value={task.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isDeleting === task.id}
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
