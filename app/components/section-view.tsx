import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { Section } from "~/types/course"

interface SectionViewProps {
  section: Section
  index?: number
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string | null): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export function SectionView({ section, index = 0 }: SectionViewProps) {
  const youtubeId = extractYouTubeId(section.youtube_url)

  return (
    <div
      className="card-enter space-y-6"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="space-y-4">
        {youtubeId && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={section.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {section.content}
          </div>
        </div>
      </div>
    </div>
  )
}
