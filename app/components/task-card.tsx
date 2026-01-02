import { useFetcher } from "react-router"
import { CheckCircle2, Circle } from "lucide-react"
import { useState, useEffect } from "react"
import type { Task } from "~/types/task"

interface TaskCardProps {
  task: Task
  showCompletion?: boolean
}

export function TaskCard({ task, showCompletion = true }: TaskCardProps) {
  const fetcher = useFetcher()
  const [optimisticTask, setOptimisticTask] = useState(task)
  const isSubmitting = fetcher.state !== "idle"

  // Update optimistic state when fetcher completes
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      // The parent will update the task list, so we'll get new props
      // But we can also update optimistically here
    }
  }, [fetcher.state, fetcher.data])

  // Optimistic update when submitting
  useEffect(() => {
    if (isSubmitting && fetcher.formData) {
      const intent = fetcher.formData.get("intent")
      if (intent === "complete" || intent === "uncomplete") {
        setOptimisticTask({
          ...optimisticTask,
          completed: intent === "complete",
          completed_at: intent === "complete" ? new Date().toISOString() : null,
        })
      }
    }
  }, [isSubmitting, fetcher.formData])

  // Sync with prop changes
  useEffect(() => {
    setOptimisticTask(task)
  }, [task])

  const handleToggle = () => {
    const formData = new FormData()
    formData.append("intent", optimisticTask.completed ? "uncomplete" : "complete")
    formData.append("taskId", optimisticTask.id)
    fetcher.submit(formData, { method: "post" })
  }

  const displayTask = optimisticTask

  return (
    <div className="card-enter rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50">
      <div className="flex items-start gap-3">
        {showCompletion && (
          <button
            onClick={handleToggle}
            disabled={isSubmitting}
            className="mt-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {displayTask.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 transition-all" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold transition-all ${
            displayTask.completed 
              ? "line-through text-muted-foreground" 
              : ""
          }`}>
            {displayTask.title}
          </h3>
          {displayTask.description && (
            <p className={`text-sm text-muted-foreground mt-1 transition-all ${
              displayTask.completed ? "line-through" : ""
            }`}>
              {displayTask.description}
            </p>
          )}
          {displayTask.completed && displayTask.completed_at && (
            <p className="text-xs text-muted-foreground mt-2 animate-in fade-in slide-in-from-bottom-2">
              Completed {new Date(displayTask.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
