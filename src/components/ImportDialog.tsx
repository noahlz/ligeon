import { useEffect, useRef, useState } from 'react'

interface ImportProgress {
  parsed: number
  indexed: number
  skipped: number
  logs: Array<{ message: string; type: 'info' | 'error' }>
}

interface ImportDialogProps {
  isOpen: boolean
  onComplete?: () => void
  onClose?: () => void
}

export default function ImportDialog({ isOpen, onComplete, onClose }: ImportDialogProps) {
  const [collectionName, setCollectionName] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    parsed: 0,
    indexed: 0,
    skipped: 0,
    logs: [],
  })
  const logEndRef = useRef<HTMLDivElement>(null)

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
        setIsIndexing(false)
        setTimeout(() => {
          setCollectionName('')
          setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
          onComplete?.()
        }, 1500)
      }
    })
    return unsubscribe
  }, [onComplete])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progress.logs])

  const handleImport = async () => {
    setIsIndexing(true)
    setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
    const filePath = await window.electron.selectFile()
    if (filePath) {
      const collectionId = crypto.randomUUID()
      await window.electron.importPgn(filePath, collectionId, collectionName || 'Untitled')
    } else {
      setIsIndexing(false)
    }
  }

  const handleClose = () => {
    if (!isIndexing) {
      setCollectionName('')
      setProgress({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
      onClose?.()
    }
  }

  if (!isOpen) return null

  const percent =
    progress.parsed > 0 ? Math.round((progress.indexed / progress.parsed) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-96 max-h-screen overflow-auto">
        {!isIndexing ? (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Import Collection</h2>
            <input
              type="text"
              placeholder="Collection Name (optional)"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Select PGN & Import
              </button>
              {onClose && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Indexing</h2>
            <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-full transition-all rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Indexed: {progress.indexed.toLocaleString()} / {progress.parsed.toLocaleString()}
              {progress.skipped > 0 && ` (${progress.skipped} skipped)`}
            </p>
            <div className="border rounded bg-slate-900 p-3 h-48 overflow-y-auto font-mono text-xs border-slate-700">
              {progress.logs?.map((log, idx) => (
                <div
                  key={idx}
                  className={log.type === 'error' ? 'text-red-500' : 'text-gray-300'}
                >
                  {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
