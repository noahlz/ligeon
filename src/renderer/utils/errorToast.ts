import { toast } from 'sonner'

/**
 * Log an error to the console (with full stack trace) and show a user-facing toast.
 * Use for all user-action failures. 'message' should be human-readable and actionable.
 */
export function showErrorToast(message: string, error?: unknown): void {
  console.error(message, error)
  toast.error(message)
}
