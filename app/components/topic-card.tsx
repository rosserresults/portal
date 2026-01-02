import { Link } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { BookOpen } from "lucide-react"
import type { Topic } from "~/types/course"

interface TopicCardProps {
  topic: Topic
  index?: number
}

export function TopicCard({ topic, index = 0 }: TopicCardProps) {
  return (
    <Link to={`/dashboard/learning/${topic.id}`}>
      <Card
        className="card-enter transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer h-full"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{topic.title}</CardTitle>
            </div>
            {topic.is_public && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Public
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click to start learning
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
