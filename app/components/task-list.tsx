import { useState } from "react"
import { TaskCard } from "./task-card"
import { Button } from "~/components/ui/button"
import type { Task } from "~/types/task"

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all")

  const filteredTasks = tasks.filter((task) => {
    if (filter === "open") return !task.completed
    if (filter === "completed") return task.completed
    return true
  })

  const openCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({tasks.length})
        </Button>
        <Button
          variant={filter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("open")}
        >
          Open ({openCount})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {filter === "open" && "No open tasks"}
            {filter === "completed" && "No completed tasks"}
            {filter === "all" && "No tasks"}
          </p>
        </div>
      ) : (
        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className="stagger-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
