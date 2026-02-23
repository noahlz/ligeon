import { toast } from 'sonner'
import { IpcError } from '../../shared/types/ipcError.js'

/**
 * Log an error to the console (with full stack trace) and show a user-facing toast.
 * Use for all user-action failures. 'message' should be human-readable and actionable.
 * If the error is an IpcError, the userMessage from the main process is shown instead.
 */
export function showErrorToast(fallbackMessage: string, error?: unknown): void {
  console.error(fallbackMessage, error)
  toast.error(IpcError.getUserMessage(error) ?? fallbackMessage)
}
