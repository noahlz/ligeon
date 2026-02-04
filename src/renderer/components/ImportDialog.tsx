import { deriveSuggestedName } from '@/utils/filenameConverter.js'
import { useImportDialog } from '../hooks/useImportDialog.js'
import { useImportProgress } from '../hooks/useImportProgress.js'

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

  if (!isOpen || !filePath) return null

  const percent =
    progress.parsed > 0 ? Math.round((progress.indexed / progress.parsed) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-bg-box rounded-lg shadow-xl w-96 max-h-screen overflow-auto">
        {!isIndexing ? (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3">Import Collection</h2>
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
              className="w-full px-2 py-1.5 border rounded mb-3 bg-ui-bg-element border-ui-border text-ui-text placeholder-ui-text-dimmer text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={startImport}
                className="flex-1 bg-ui-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
              >
                Import
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-1.5 bg-ui-bg-element hover:bg-ui-bg-hover text-white rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3">{isComplete ? 'Import Complete' : 'Indexing'}</h2>
            {!isComplete && (
              <div className="w-full bg-ui-bg-element rounded-full h-2 mb-3">
                <div
                  className="bg-ui-primary h-full transition-all rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
            <p className="text-xs text-ui-text-dim mb-3">
              {isComplete
                ? 'Import finished successfully.'
                : `Indexed: ${progress.indexed.toLocaleString()} / ${progress.parsed.toLocaleString()}${progress.skipped > 0 ? ` (${progress.skipped} skipped)` : ''}`}
            </p>
            <div className="border rounded bg-ui-bg-page p-2 h-48 overflow-y-auto font-mono text-sm border-ui-border whitespace-pre-wrap">
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
            <button
              onClick={handleClose}
              className="w-full mt-3 bg-ui-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
