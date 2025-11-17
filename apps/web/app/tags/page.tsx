'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/templates/main-layout'
import { PageHeader } from '@/components/molecules/page-header'
import { EmptyState } from '@/components/molecules/empty-state'
import { TagFormDialog } from '@/components/organisms/tag-form-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tags } from 'lucide-react'
import { trpc } from '@/app/lib/trpc'

export default function TagsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch tags
  const { data: tags, isLoading } = trpc.tag.list.useQuery()

  // Create mutation
  const utils = trpc.useUtils()
  const createMutation = trpc.tag.create.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate()
    },
  })

  const handleCreate = (data: { title: string; content: string }) => {
    createMutation.mutate({
      title: data.title,
      content: data.content,
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Tags"
          description="Categorize and organize with tags"
          icon={Tags}
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageHeader
        title="Tags"
        description="Categorize and organize with tags"
        icon={Tags}
        action={{
          label: 'Create Tag',
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      {!tags || tags.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No tags yet"
          description="Create tags to categorize your objects and make them easier to find."
          actionLabel="Create Tag"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <Card
              key={tag.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => {
                console.log('View tag', tag.id)
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  {tag.title}
                </CardTitle>
              </CardHeader>
              {tag.content && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tag.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <TagFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </MainLayout>
  )
}
