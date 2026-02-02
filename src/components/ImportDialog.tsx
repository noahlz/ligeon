import { useEffect, useRef, useState } from 'react'
import { deriveSuggestedName } from '../utils/filenameConverter.js'

interface ImportProgress {
  parsed: number
  indexed: number
  skipped: number
  logs: Array<{ message: string; type: 'info' | 'error' }>
}

interface ImportDialogProps {
  isOpen: boolean
  filePath: string | null
  onComplete?: () => void
  onClose?: () => void
}

export default function ImportDialog({ isOpen, filePath, onComplete, onClose }: ImportDialogProps) {
  const [collectionName, setCollectionName] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    parsed: 0,
    indexed: 0,
    skipped: 0,
    logs: [],
  })
  const logEndRef = useRef<HTMLDivElement>(null)

  const suggestedName = filePath ? deriveSuggestedName(filePath) : ''

  // Reset state when dialog opens with a new file
  useEffect(() => {
    if (isOpen && filePath) {
      setCollectionName('')
      setIsIndexing(false)
      setIsComplete(false)
      setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
    }
  }, [isOpen, filePath])

  useEffect(() => {
    const unsubscribe = window.electron.onImportProgress((data: any) => {
      if (data.type === 'progress') {
        setProgress((prev) => ({
          ...prev,
          parsed: data.parsed ?? prev.parsed,
          indexed: data.indexed ?? prev.indexed,
          skipped: data.skipped ?? prev.skipped,
        }))
      } else if (data.type === 'log') {
        setProgress((prev) => ({
          ...prev,
          logs: [...prev.logs, ...data.logs],
        }))
      } else if (data.type === 'complete') {
        // Keep isIndexing=true so we stay in the progress/complete view
        // isIndexing will be reset when handleClose() is called
        setIsComplete(true)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progress.logs])

  const handleImport = async () => {
    if (!filePath) return
    setIsIndexing(true)
    setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
    const collectionId = crypto.randomUUID()
    const finalName = collectionName || suggestedName
    await window.electron.importPgn(filePath, collectionId, finalName)
  }

  const handleClose = () => {
    setCollectionName('')
    setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
    setIsIndexing(false)
    const wasComplete = isComplete
    setIsComplete(false)
    if (wasComplete) {
      onComplete?.()
    } else {
      onClose?.()
    }
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
                  handleImport()
                }
              }}
              className="w-full px-2 py-1.5 border rounded mb-3 bg-ui-bg-element border-ui-border text-ui-text placeholder-ui-text-dimmer text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
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
