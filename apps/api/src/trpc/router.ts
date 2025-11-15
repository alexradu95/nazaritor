import { router } from './init'
import { objectRouter } from './routers/object'

export const appRouter = router({
  object: objectRouter,
})

export type AppRouter = typeof appRouter
