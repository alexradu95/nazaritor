# Next.js Frontend Guide

## Overview

This guide explains how to use Next.js in a **minimal way** to build the AI-first frontend. The focus is on leveraging Vercel AI SDK's `streamUI` while keeping Next.js complexity low.

---

## Minimal Next.js Philosophy

### What We Use

✅ **App Router** - Required for `streamUI` support
✅ **Server Actions** - ONE file only (`app/actions/chat.tsx`)
✅ **Client Components** - 90% of our code
✅ **Basic File Routing** - Simple page structure
✅ **Image Optimization** - Free benefit (if we add images)

### What We Avoid (Initially)

❌ Server Components everywhere (only in the chat action)
❌ Complex data fetching patterns (backend API handles this)
❌ SSR/SSG/ISR (SPA-style is fine for our use case)
❌ Middleware (unless auth absolutely requires it)
❌ Advanced routing features (parallel routes, intercepting, etc.)

---

## Project Setup

### Installation

```bash
# Create Next.js app
cd apps/web
pnpm create next-app@latest .

# Configuration during setup:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: No
# - App Router: Yes
# - Import alias: @/*
```

### Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ai": "^3.x",                          // Vercel AI SDK
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zod": "^3.x",
    "@repo/schemas": "workspace:*",        // Shared schemas
    "@repo/types": "workspace:*",          // Shared types
    "cmdk": "^1.0.0",                      // Command palette
    "lexical": "^0.12.0",                  // Rich text editor
    "@lexical/react": "^0.12.0",
    "fuse.js": "^7.0.0",                   // Fuzzy search
    "lucide-react": "^0.300.0",            // Icons
    "tailwindcss": "^3.4.0"
  }
}
```

---

## File Structure (Minimal)

```
apps/web/
├── app/
│   ├── layout.tsx                  # Root layout (basic)
│   ├── page.tsx                    # Home page (chat interface)
│   ├── globals.css                 # Global styles
│   │
│   ├── actions/
│   │   └── chat.tsx                # 🔥 ONLY server action file
│   │
│   ├── components/                 # All client components
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-list.tsx
│   │   │   └── input-box.tsx
│   │   ├── objects/
│   │   │   ├── object-card.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── ... (one per object type)
│   │   ├── views/
│   │   │   ├── table-view.tsx
│   │   │   ├── kanban-view.tsx
│   │   │   ├── calendar-view.tsx
│   │   │   └── graph-view.tsx
│   │   └── ui/                     # shadcn/ui components
│   │
│   └── lib/
│       ├── trpc.tsx                # tRPC client setup
│       ├── providers.tsx           # React Query provider
│       └── utils.ts                # Utilities
│
├── public/                         # Static assets
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Server Action (The Only Server File)

### `app/actions/chat.tsx`

This is the **ONLY** file that uses `'use server'`:

```typescript
'use server'

import { streamUI } from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { ObjectCard } from '../components/objects/object-card'
import { TableView } from '../components/views/table-view'
import { KanbanView } from '../components/views/kanban-view'

export async function continueConversation(messages: any[]) {
  return streamUI({
    model: openai('gpt-4-turbo'),
    messages,
    text: ({ content }) => <div className="markdown">{content}</div>,
    tools: {
      // Tool: Create an object
      createObject: {
        description: 'Create a new object in the knowledge base',
        parameters: z.object({
          type: z.string(),
          title: z.string(),
          properties: z.record(z.any()).optional(),
        }),
        generate: async ({ type, title, properties }) => {
          // Call backend API via tRPC (server-side)
          const object = await fetch('http://localhost:3001/trpc/object.create', {
            method: 'POST',
            body: JSON.stringify({ type, title, properties }),
          })

          return <ObjectCard object={object} />
        },
      },

      // Tool: Show a view
      showView: {
        description: 'Display objects in a specific view (table, kanban, etc.)',
        parameters: z.object({
          viewType: z.enum(['table', 'kanban', 'calendar', 'graph']),
          filters: z.object({
            type: z.string().optional(),
            tags: z.array(z.string()).optional(),
          }).optional(),
        }),
        generate: async ({ viewType, filters }) => {
          // Fetch data from backend
          const objects = await fetch('http://localhost:3001/trpc/object.list', {
            method: 'POST',
            body: JSON.stringify({ ...filters }),
          })

          // Return appropriate view component
          switch (viewType) {
            case 'table':
              return <TableView objects={objects} />
            case 'kanban':
              return <KanbanView objects={objects} />
            // ... other views
          }
        },
      },

      // Tool: Display single object
      showObject: {
        description: 'Display a specific object by ID',
        parameters: z.object({
          objectId: z.string().uuid(),
        }),
        generate: async ({ objectId }) => {
          const object = await fetch(`http://localhost:3001/trpc/object.getById`, {
            method: 'POST',
            body: JSON.stringify({ id: objectId }),
          })

          return <ObjectCard object={object} />
        },
      },
    },
  })
}
```

**Key Points:**
- This is the **ONLY** file with `'use server'`
- Uses Vercel AI SDK's `streamUI` for dynamic component generation
- AI can call tools to fetch data and generate UI
- Returns React components that stream to the client

---

## Client Components (Everything Else)

### Main Chat Interface

```typescript
// app/page.tsx (client component)
'use client'

import { useState } from 'react'
import { ChatInterface } from './components/chat/chat-interface'
import { Providers } from './lib/providers'

export default function HomePage() {
  return (
    <Providers>
      <main className="h-screen flex flex-col">
        <ChatInterface />
      </main>
    </Providers>
  )
}
```

### Chat Interface Component

```typescript
// app/components/chat/chat-interface.tsx
'use client'

import { useState } from 'react'
import { continueConversation } from '@/app/actions/chat'
import { MessageList } from './message-list'
import { InputBox } from './input-box'

export function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (input: string) => {
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call server action
      const response = await continueConversation([...messages, userMessage])

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response, // This is a React component!
      }])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputBox onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
```

### Object Card Component

```typescript
// app/components/objects/object-card.tsx
'use client'

import { BaseObject } from '@repo/types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface ObjectCardProps {
  object: BaseObject
}

export function ObjectCard({ object }: ObjectCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{object.title}</h3>
          <p className="text-sm text-muted-foreground">{object.type}</p>
        </div>
        <div className="flex gap-1">
          {object.metadata.tags.map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>

      {object.content && (
        <div className="mt-2 text-sm">
          {object.content.substring(0, 150)}...
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        Created {new Date(object.metadata.createdAt).toLocaleDateString()}
      </div>
    </Card>
  )
}
```

---

## tRPC Client Setup

### Provider Setup

```typescript
// app/lib/providers.tsx
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './trpc'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3001/trpc',
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

### tRPC Client Definition

```typescript
// app/lib/trpc.tsx
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../../api/src/trpc/router'

export const trpc = createTRPCReact<AppRouter>()
```

### Using tRPC in Components

```typescript
'use client'

import { trpc } from '@/lib/trpc'

export function TaskList() {
  // Query - auto-typed!
  const { data, isLoading } = trpc.object.list.useQuery({
    type: 'task',
    limit: 20,
  })

  // Mutation
  const createTask = trpc.object.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch
      trpc.useUtils().object.list.invalidate()
    },
  })

  const handleCreate = () => {
    createTask.mutate({
      type: 'task',
      title: 'New task',
      content: '',
      properties: { status: 'todo' },
      relations: [],
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.objects.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
      <button onClick={handleCreate}>Create Task</button>
    </div>
  )
}
```

**Benefits:**
- ✅ Fully type-safe (TypeScript autocomplete)
- ✅ No manual API calls
- ✅ Automatic caching via React Query
- ✅ Simple and clean code

---

## View Components

### Table View

```typescript
// app/components/views/table-view.tsx
'use client'

import { BaseObject } from '@repo/types'

interface TableViewProps {
  objects: BaseObject[]
}

export function TableView({ objects }: TableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Created</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {objects.map(obj => (
            <tr key={obj.id}>
              <td>{obj.title}</td>
              <td>{obj.type}</td>
              <td>{new Date(obj.metadata.createdAt).toLocaleDateString()}</td>
              <td>{obj.metadata.tags.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Kanban View

```typescript
// app/components/views/kanban-view.tsx
'use client'

import { BaseObject } from '@repo/types'
import { useState } from 'react'

interface KanbanViewProps {
  objects: BaseObject[]
}

export function KanbanView({ objects }: KanbanViewProps) {
  const columns = ['todo', 'in-progress', 'done']

  const groupByStatus = (status: string) =>
    objects.filter(obj => obj.properties.status === status)

  return (
    <div className="flex gap-4">
      {columns.map(column => (
        <div key={column} className="flex-1 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-4">{column}</h3>
          <div className="space-y-2">
            {groupByStatus(column).map(obj => (
              <div key={obj.id} className="bg-white p-3 rounded shadow">
                {obj.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## AI State Synchronization

### CopilotKit-Style Pattern

```typescript
// app/lib/ai-state.ts
import { create } from 'zustand'
import { BaseObject } from '@repo/types'

interface AIState {
  activeObjects: BaseObject[]
  currentView: string
  aiContext: {
    recentQueries: string[]
    workingMemory: Map<string, any>
  }

  // Actions AI can call
  setActiveObjects: (objects: BaseObject[]) => void
  setCurrentView: (view: string) => void
  addToWorkingMemory: (key: string, value: any) => void
}

export const useAIState = create<AIState>((set) => ({
  activeObjects: [],
  currentView: 'dashboard',
  aiContext: {
    recentQueries: [],
    workingMemory: new Map(),
  },

  setActiveObjects: (objects) => set({ activeObjects: objects }),
  setCurrentView: (view) => set({ currentView: view }),
  addToWorkingMemory: (key, value) =>
    set((state) => ({
      aiContext: {
        ...state.aiContext,
        workingMemory: new Map(state.aiContext.workingMemory).set(key, value),
      },
    })),
}))
```

### Using AI State in Components

```typescript
'use client'

import { useAIState } from '@/lib/ai-state'

export function ActiveObjectsPanel() {
  const activeObjects = useAIState((state) => state.activeObjects)

  return (
    <div>
      <h3>Active Objects</h3>
      {activeObjects.map(obj => (
        <div key={obj.id}>{obj.title}</div>
      ))}
    </div>
  )
}
```

---

## Styling with Tailwind

### Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... shadcn/ui color variables
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### Global Styles

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

---

## Performance Optimization

### Code Splitting

Next.js automatically code-splits, but you can manually optimize:

```typescript
import dynamic from 'next/dynamic'

// Lazy load heavy components
const GraphView = dynamic(() => import('./views/graph-view'), {
  loading: () => <div>Loading graph...</div>,
  ssr: false, // Disable SSR for this component
})
```

### React Query Optimization

```typescript
// app/lib/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Development Tips

### Hot Reload

Next.js has fast refresh built-in. Changes to client components reload instantly.

### Debugging

```typescript
// Enable tRPC DevTools
const [trpcClient] = useState(() =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3001/trpc',
      }),
      loggerLink(), // Add logging
    ],
  })
)
```

### Type Checking

```bash
# Run TypeScript compiler
pnpm type-check

# Auto-fix lint issues
pnpm lint:fix
```

---

## Summary

**Minimal Next.js Approach:**

- **One server action file** (`app/actions/chat.tsx`) for AI streaming
- **Everything else is client components** (90% of code)
- **tRPC for backend communication** (type-safe, simple)
- **React Query for state management** (built into tRPC)
- **Tailwind + shadcn/ui** for styling
- **AI SDK's streamUI** for dynamic component generation

**Mental Model:**

Think of Next.js as "React + AI Streaming" rather than a full server-side framework. Most of your code is regular React with `'use client'`, and you use ONE server action for the AI chat feature.

This approach gives you the benefits of `streamUI` without the complexity of fully embracing Next.js server patterns.
