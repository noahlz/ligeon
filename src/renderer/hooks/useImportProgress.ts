import { useState, useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'

export interface ImportProgress {
  parsed: number
  indexed: number
  skipped: number
  logs: Array<{ message: string; type: 'info' | 'error' }>
}

const INITIAL_PROGRESS: ImportProgress = {
  parsed: 0,
  indexed: 0,
  skipped: 0,
  logs: [],
}

export interface UseImportProgressParams {
  /** Called when IPC fires a successful 'complete' event with the collectionId */
  onComplete?: (collectionId: string) => void
  /** Called when IPC fires any 'complete' event (success or failure) */
  onMarkComplete?: () => void
}

export interface UseImportProgressReturn {
  /** Live progress counters and log entries */
  progress: ImportProgress
  /** Ref to attach to the sentinel element at the bottom of the log list */
  logEndRef: RefObject<HTMLDivElement>
  /** Reset progress to initial state (call before starting a new import) */
  resetProgress: () => void
}

/**
 * Subscribes to IPC import-progress events and auto-scrolls the log view.
 * Wire onComplete/onMarkComplete to useImportDialog's setters for coordination.
 */
export function useImportProgress({
  onComplete,
  onMarkComplete,
}: UseImportProgressParams): UseImportProgressReturn {
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Subscribe to IPC progress events for the lifetime of the component
  useEffect(() => {
    const unsubscribe = window.electron.onImportProgress((data: any) => {
      if (data.type === 'progress') {
        setProgress(prev => ({
          ...prev,
          parsed: data.parsed ?? prev.parsed,
          indexed: data.indexed ?? prev.indexed,
          skipped: data.skipped ?? prev.skipped,
        }))
      } else if (data.type === 'log') {
        setProgress(prev => ({
          ...prev,
          logs: [...prev.logs, ...data.logs],
        }))
      } else if (data.type === 'complete') {
        if (data.success && data.collectionId) {
          onComplete?.(data.collectionId)
        }
        onMarkComplete?.()
      }
    })
    return unsubscribe
  }, [onComplete, onMarkComplete])

  // Auto-scroll log list when new entries arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progress.logs])

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS)
  }, [])

  return {
    progress,
    logEndRef,
    resetProgress,
  }
}
