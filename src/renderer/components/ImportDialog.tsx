import { useEffect, useRef } from 'react'
import { deriveSuggestedName } from '@/utils/filenameConverter.js'
import { useImportDialog } from '../hooks/useImportDialog.js'
import { useImportProgress } from '../hooks/useImportProgress.js'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Button } from '@/components/ui/button.js'
import { Input } from '@/components/ui/input.js'
import { Progress } from '@/components/ui/progress.js'

interface ImportDialogProps {
  isOpen: boolean
  filePath: string | null
  onComplete?: (collectionId: string) => void
  onClose?: () => void
}

export default function ImportDialog({ isOpen, filePath, onComplete, onClose }: ImportDialogProps) {
  const suggestedName = filePath ? deriveSuggestedName(filePath) : ''

  const {
    collectionName,
    setCollectionName,
    isIndexing,
    isComplete,
    handleImport,
    handleClose,
    setIsComplete,
    setImportedCollectionId,
  } = useImportDialog({ isOpen, filePath, suggestedName, onComplete, onClose })

  const { progress, logEndRef, resetProgress } = useImportProgress({
    onComplete: setImportedCollectionId,
    onMarkComplete: () => setIsComplete(true),
  })

  const startImport = async () => {
    resetProgress()
    await handleImport()
  }

  // Auto-close for small imports (≤1000 games) to avoid UI flicker
  const PROGRESS_THRESHOLD = 1000
  const showProgress = isIndexing && progress.parsed > PROGRESS_THRESHOLD
  const autoCloseFired = useRef(false)

  useEffect(() => {
    if (isComplete && progress.parsed <= PROGRESS_THRESHOLD && !autoCloseFired.current) {
      autoCloseFired.current = true
      handleClose()
    }
  }, [isComplete, progress.parsed, handleClose])

  // Reset auto-close guard when dialog reopens
  useEffect(() => {
    if (isOpen) autoCloseFired.current = false
  }, [isOpen])

  if (!filePath) return null

  const percent =
    progress.parsed > 0 ? Math.round((progress.indexed / progress.parsed) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {!showProgress ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Collection</DialogTitle>
            </DialogHeader>
            <Input
              type="text"
              placeholder={suggestedName}
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              onFocus={() => {
                if (!collectionName && suggestedName) {
                  setCollectionName(suggestedName)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  startImport()
                }
              }}
              className="bg-ui-bg-element border-ui-border"
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="cursor-pointer">
                Cancel
              </Button>
              <Button onClick={startImport} className="bg-ui-primary hover:bg-blue-600 text-white cursor-pointer">
                Import
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isComplete ? 'Import Complete' : 'Indexing'}</DialogTitle>
            </DialogHeader>
            {!isComplete && (
              <Progress value={percent} className="h-2 bg-ui-bg-element" />
            )}
            <p className="text-xs text-ui-text-dim">
              {isComplete
                ? 'Import finished successfully.'
                : `Indexed: ${progress.indexed.toLocaleString()} / ${progress.parsed.toLocaleString()}${progress.skipped > 0 ? ` (${progress.skipped} skipped)` : ''}`}
            </p>
            <div className="border rounded-sm bg-ui-bg-element p-2 h-48 overflow-y-auto font-mono text-sm border-ui-border whitespace-pre-wrap">
              {progress.logs?.map((log, idx) => (
                <div
                  key={idx}
                  className={log.type === 'error' ? 'text-red-400' : 'text-ui-text-dim'}
                >
                  {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-ui-secondary hover:bg-green-700 text-white cursor-pointer">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
