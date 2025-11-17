# Nazaritor Web App

AI-First Knowledge Management System - Frontend Application

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript (strict mode)
- **Data Fetching**: tRPC + React Query
- **Design Pattern**: Atomic Design

## Getting Started

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 20.0.0

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your API URL:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Installation

From the monorepo root:

```bash
# Install dependencies
bun install

# Build packages
bun run build:packages

# Start both servers (recommended)
bun run dev:all
```

The app will be available at **http://localhost:3000** and the API at **http://localhost:3001**

### Running Separately

If you prefer to run the servers separately:

```bash
# Terminal 1 - API server
bun run dev

# Terminal 2 - Web app
bun run dev:web
```

## Project Structure

```
apps/web/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page
│   ├── objects/             # Objects management
│   ├── collections/         # Collections management
│   ├── tags/                # Tags management
│   ├── queries/             # Queries management
│   ├── lib/                 # App-level utilities
│   │   ├── trpc.tsx        # tRPC client setup
│   │   └── providers.tsx   # React providers
│   └── globals.css          # Global styles
├── components/              # Atomic Design components
│   ├── ui/                 # Atoms (shadcn/ui components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── molecules/          # Combinations of atoms
│   │   ├── object-card.tsx
│   │   ├── empty-state.tsx
│   │   └── page-header.tsx
│   ├── organisms/          # Complex UI sections
│   │   ├── navigation.tsx
│   │   ├── header.tsx
│   │   ├── object-form-dialog.tsx
│   │   ├── collection-form-dialog.tsx
│   │   └── tag-form-dialog.tsx
│   └── templates/          # Page layouts
│       └── main-layout.tsx
├── lib/                    # Shared utilities
│   ├── utils.ts           # General utilities (cn)
│   └── date-utils.ts      # Date formatting utilities
└── components.json         # shadcn/ui configuration
```

## Features

### Current Features

- ✅ **Objects Management**: Create and list objects (notes, tasks, projects, etc.)
- ✅ **Collections Management**: Create and organize collections
- ✅ **Tags Management**: Create and manage tags
- ✅ **Queries**: View saved queries
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Dark Mode Support**: CSS variables for theming
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Real-time Updates**: Optimistic UI updates with React Query

### Component Library

All components follow the atomic design pattern:

- **Atoms**: Basic UI components from shadcn/ui
- **Molecules**: Reusable combinations like cards and headers
- **Organisms**: Complex components like forms and navigation
- **Templates**: Page layouts with consistent structure

### tRPC Integration

The app uses tRPC for type-safe API calls:

```tsx
// Query example
const { data, isLoading } = trpc.object.list.useQuery({
  limit: 50,
  offset: 0,
})

// Mutation example
const createMutation = trpc.object.create.useMutation({
  onSuccess: () => {
    utils.object.list.invalidate()
  },
})
```

## Development

### Adding New Pages

1. Create a new page in `app/[page-name]/page.tsx`
2. Add navigation link in `components/organisms/navigation.tsx`
3. Implement data fetching with tRPC hooks
4. Use existing components from the component library

### Adding New Components

1. Determine the atomic level (atom, molecule, organism, template)
2. Create the component in the appropriate directory
3. Follow existing naming conventions
4. Export from the component file

### Adding shadcn/ui Components

```bash
bunx shadcn@latest add [component-name]
```

## Scripts

```bash
# Development
bun run dev           # Start dev server

# Build
bun run build         # Build for production
bun run start         # Start production server

# Quality
bun run lint          # Run ESLint
bun run lint:fix      # Fix ESLint errors
bun run type-check    # Run TypeScript compiler
```

## Deployment

### Production Build

```bash
bun run build
```

### Environment Variables

Required for production:

- `NEXT_PUBLIC_API_URL`: Your production API URL

## Contributing

When contributing to this project:

1. Follow the atomic design pattern
2. Maintain type safety
3. Use existing shadcn/ui components when possible
4. Write semantic, accessible HTML
5. Test on both desktop and mobile

## License

Private - All Rights Reserved
