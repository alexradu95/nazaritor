import { initTRPC } from '@trpc/server'
import type { Context } from './context'
import { TRPCPanelMeta } from 'trpc-ui'

const t = initTRPC.context<Context>().meta<TRPCPanelMeta>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
export const createCallerFactory = t.createCallerFactory
