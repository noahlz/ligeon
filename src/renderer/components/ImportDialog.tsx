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

  if (!filePath) return null

  const percent =
    progress.parsed > 0 ? Math.round((progress.indexed / progress.parsed) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {!isIndexing ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Collection</DialogTitle>
            </DialogHeader>
            <input
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
              className="w-full px-2 py-1.5 border rounded-sm bg-ui-bg-element border-ui-border text-ui-text placeholder-ui-text-dimmer text-sm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={startImport} className="bg-ui-primary hover:bg-blue-600 text-white">
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
              <div className="w-full bg-ui-bg-element rounded-full h-2">
                <div
                  className="bg-ui-primary h-full transition-all rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
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
              <Button onClick={handleClose} className="bg-ui-secondary hover:bg-green-700 text-white">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
