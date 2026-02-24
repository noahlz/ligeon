import { toast } from 'sonner'
import { IpcError } from '../../shared/types/ipcError.js'

/**
 * Show a user-facing error toast and log to console when appropriate.
 * Use for all user-action failures. 'message' should be human-readable and actionable.
 * If the error is an IpcError, the userMessage from the main process is shown instead.
 * IpcErrors are already logged to Winston in the main process, so console.error is skipped for them.
 */
export function showErrorToast(fallbackMessage: string, error?: unknown): void {
  const ipcMessage = IpcError.getUserMessage(error)
  if (!ipcMessage) console.error(fallbackMessage, error)
  toast.error(ipcMessage ?? fallbackMessage)
}
