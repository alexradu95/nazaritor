import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { db } from '@repo/database'

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    db,
    req: opts.req,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
