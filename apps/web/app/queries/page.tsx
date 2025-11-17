'use client'

import { MainLayout } from '@/components/templates/main-layout'
import { PageHeader } from '@/components/molecules/page-header'
import { EmptyState } from '@/components/molecules/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { trpc } from '@/app/lib/trpc'

export default function QueriesPage() {
  // Fetch queries
  const { data: queries, isLoading } = trpc.query.list.useQuery()

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Queries"
          description="Saved searches for quick access"
          icon={Search}
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
        title="Queries"
        description="Saved searches for quick access"
        icon={Search}
        action={{
          label: 'Create Query',
          onClick: () => {
            console.log('Create query - Coming soon')
          },
        }}
      />

      {!queries || queries.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No queries yet"
          description="Create saved queries to quickly find objects based on filters and criteria."
          actionLabel="Create Query"
          onAction={() => {
            console.log('Create query - Coming soon')
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queries.map((query) => (
            <Card
              key={query.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => {
                console.log('View query', query.id)
              }}
            >
              <CardHeader>
                <CardTitle>{query.title}</CardTitle>
              </CardHeader>
              {query.content && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {query.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  )
}
