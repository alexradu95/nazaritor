'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/templates/main-layout'
import { PageHeader } from '@/components/molecules/page-header'
import { EmptyState } from '@/components/molecules/empty-state'
import { CollectionFormDialog } from '@/components/organisms/collection-form-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folders } from 'lucide-react'
import { trpc } from '@/app/lib/trpc'

export default function CollectionsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch collections
  const { data: collections, isLoading } = trpc.collection.list.useQuery()

  // Create mutation
  const utils = trpc.useUtils()
  const createMutation = trpc.collection.create.useMutation({
    onSuccess: () => {
      utils.collection.list.invalidate()
    },
  })

  const handleCreate = (data: {
    title: string
    content: string
    properties: { objectType: string }
  }) => {
    createMutation.mutate({
      title: data.title,
      content: data.content,
      properties: data.properties,
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Collections"
          description="Organize objects into collections"
          icon={Folders}
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
        title="Collections"
        description="Organize objects into collections"
        icon={Folders}
        action={{
          label: 'Create Collection',
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      {!collections || collections.length === 0 ? (
        <EmptyState
          icon={Folders}
          title="No collections yet"
          description="Create collections to group related objects together."
          actionLabel="Create Collection"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => {
                console.log('View collection', collection.id)
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{collection.title}</CardTitle>
                  <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-1">
                    {collection.properties.objectType}
                  </span>
                </div>
              </CardHeader>
              {collection.content && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {collection.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <CollectionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </MainLayout>
  )
}
