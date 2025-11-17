import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/context'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// tRPC UI Panel (development only)
app.get('/panel', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.text('Not Found', 404)
  }

  const { renderTrpcPanel } = await import('trpc-ui')

  return c.html(
    renderTrpcPanel(appRouter, {
      url: `http://localhost:${port}/trpc`,
      meta: {
        title: 'Nazaritor API',
        description: 'AI-First Knowledge Management System tRPC API',
      },
    })
  )
})

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
)

// Start server
const port = parseInt(process.env.PORT || '3001')

const server: { port: number; fetch: typeof app.fetch } = {
  port,
  fetch: app.fetch.bind(app),
}

export default server

console.log(`🚀 Server running at http://localhost:${port}`)
