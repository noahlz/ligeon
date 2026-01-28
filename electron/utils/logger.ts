/**
 * Shared logging utilities for error handling across the application.
 */

/**
 * Logs an error with structured context information.
 *
 * @param module - The module or file where the error occurred
 * @param operation - The operation or function that failed
 * @param context - Additional context data (e.g., parameters, state)
 * @param error - The error object or unknown error value
 */
export function logError(
  module: string,
  operation: string,
  context: Record<string, unknown>,
  error: unknown
): void {
  console.error(`[${module}] ${operation} failed:`, {
    context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
}
