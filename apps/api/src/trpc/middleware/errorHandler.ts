import { TRPCError } from '@trpc/server'
import { middleware, publicProcedure } from '../init'

/**
 * Error handling middleware for tRPC procedures
 * Catches and transforms database errors into user-friendly messages
 */
export const errorHandlerMiddleware = middleware(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    // Log error for debugging (in production, send to logging service)
    console.error('[tRPC Error]', error)

    // Already a TRPCError, just re-throw
    if (error instanceof TRPCError) {
      throw error
    }

    // SQLite constraint violation errors
    if (
      error instanceof Error &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      const sqliteError = error as Error & { code: string; message: string }

      // Check constraint violation
      if (sqliteError.code === 'SQLITE_CONSTRAINT') {
        // Parse constraint type from message
        if (sqliteError.message.includes('UNIQUE constraint failed')) {
          const field = sqliteError.message.match(
            /UNIQUE constraint failed: (\w+)\.(\w+)/
          )?.[2]
          throw new TRPCError({
            code: 'CONFLICT',
            message: field
              ? `A record with this ${field} already exists`
              : 'This record already exists',
            cause: error,
          })
        }

        if (sqliteError.message.includes('CHECK constraint failed')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid data: constraint validation failed',
            cause: error,
          })
        }

        if (sqliteError.message.includes('FOREIGN KEY constraint failed')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Referenced object does not exist',
            cause: error,
          })
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Data validation failed',
          cause: error,
        })
      }

      // Database connection errors
      if (
        sqliteError.code === 'SQLITE_CANTOPEN' ||
        sqliteError.code === 'SQLITE_BUSY'
      ) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database temporarily unavailable, please try again',
          cause: error,
        })
      }
    }

    // Zod validation errors (should be handled by tRPC, but catch just in case)
    if (error instanceof Error && error.name === 'ZodError') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input data',
        cause: error,
      })
    }

    // Generic error fallback
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
      cause: error,
    })
  }
})

/**
 * Public procedure with error handling
 * Use this instead of publicProcedure for automatic error handling
 */
export const protectedProcedure = publicProcedure.use(errorHandlerMiddleware)
