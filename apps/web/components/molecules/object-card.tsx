import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from '@/lib/date-utils'

type ObjectCardProps = {
  id: string
  title: string
  type: string
  content?: string
  createdAt: Date
  onClick?: () => void
}

export function ObjectCard({
  title,
  type,
  content,
  createdAt,
  onClick,
}: ObjectCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-1">
            {type}
          </span>
        </div>
      </CardHeader>
      {content && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDistanceToNow(createdAt)}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
