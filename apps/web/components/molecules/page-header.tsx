import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

type PageHeaderProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
