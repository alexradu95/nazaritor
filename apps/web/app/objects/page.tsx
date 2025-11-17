'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/templates/main-layout'
import { PageHeader } from '@/components/molecules/page-header'
import { EmptyState } from '@/components/molecules/empty-state'
import { ObjectCard } from '@/components/molecules/object-card'
import { ObjectFormDialog } from '@/components/organisms/object-form-dialog'
import { Package } from 'lucide-react'
import { trpc } from '@/app/lib/trpc'
import type { ObjectType } from '@repo/schemas'

export default function ObjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch objects
  const { data: objectsData, isLoading } = trpc.object.list.useQuery({
    limit: 50,
    offset: 0,
  })

  // Create mutation
  const utils = trpc.useUtils()
  const createMutation = trpc.object.create.useMutation({
    onSuccess: () => {
      utils.object.list.invalidate()
    },
  })

  const handleCreate = (data: { title: string; type: string; content: string }) => {
    createMutation.mutate({
      title: data.title,
      type: data.type as ObjectType,
      content: data.content,
      properties: {},
    })
  }

  const objects = objectsData?.objects || []

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Objects"
          description="Manage your notes, tasks, and other objects"
          icon={Package}
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
        title="Objects"
        description="Manage your notes, tasks, and other objects"
        icon={Package}
        action={{
          label: 'Create Object',
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      {objects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No objects yet"
          description="Create your first object to get started organizing your knowledge."
          actionLabel="Create Object"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {objects.map((object) => (
            <ObjectCard
              key={object.id}
              id={object.id}
              title={object.title}
              type={object.type}
              content={object.content}
              createdAt={new Date(object.createdAt)}
              onClick={() => {
                // TODO: Navigate to object detail
                console.log('View object', object.id)
              }}
            />
          ))}
        </div>
      )}

      <ObjectFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </MainLayout>
  )
}
