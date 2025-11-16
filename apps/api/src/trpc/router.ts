import { router } from './init'
import { objectRouter } from './routers/object'
import { tagRouter } from './routers/tag'
import { collectionRouter } from './routers/collection'
import { queryRouter } from './routers/query'

export const appRouter = router({
  object: objectRouter,
  tag: tagRouter,
  collection: collectionRouter,
  query: queryRouter,
})

export type AppRouter = typeof appRouter
