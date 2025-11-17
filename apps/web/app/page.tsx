'use client'

import { MainLayout } from '@/components/templates/main-layout'
import { PageHeader } from '@/components/molecules/page-header'
import { Home } from 'lucide-react'

export default function HomePage() {
  return (
    <MainLayout>
      <PageHeader
        title="Welcome to Nazaritor"
        description="AI-First Knowledge Management System"
        icon={Home}
      />
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted-foreground mb-4">
            Nazaritor helps you manage your knowledge, tasks, and projects through an intuitive interface.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and organize objects (notes, tasks, projects)</li>
            <li>• Group objects into collections</li>
            <li>• Tag objects for easy categorization</li>
            <li>• Build custom queries to find what you need</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
