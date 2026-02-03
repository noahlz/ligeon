import { useState, useEffect, useCallback } from 'react'

export interface UseImportDialogParams {
  /** Whether the dialog is currently open */
  isOpen: boolean
  /** Path to the selected PGN file */
  filePath: string | null
  /** Name suggested from the filename */
  suggestedName: string
  /** Called on successful import with the new collection ID */
  onComplete?: (collectionId: string) => void
  /** Called when dialog is dismissed without importing */
  onClose?: () => void
}

export interface UseImportDialogReturn {
  /** User-entered collection name */
  collectionName: string
  setCollectionName: (name: string) => void
  /** True while import is running or showing results */
  isIndexing: boolean
  /** True after the import has finished successfully */
  isComplete: boolean
  /** The collection ID produced by a successful import */
  importedCollectionId: string | null
  /** Start the import process */
  handleImport: () => Promise<void>
  /** Close the dialog, firing onComplete or onClose as appropriate */
  handleClose: () => void
  // Setters exposed for useImportProgress coordination
  setIsIndexing: (v: boolean) => void
  setIsComplete: (v: boolean) => void
  setImportedCollectionId: (id: string | null) => void
}

/**
 * Manages ImportDialog lifecycle: name input, triggering the import,
 * and routing the close action to the correct callback.
 */
export function useImportDialog({
  isOpen,
  filePath,
  suggestedName,
  onComplete,
  onClose,
}: UseImportDialogParams): UseImportDialogReturn {
  const [collectionName, setCollectionName] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [importedCollectionId, setImportedCollectionId] = useState<string | null>(null)

  // Reset state when dialog opens with a new file
  useEffect(() => {
    if (isOpen && filePath) {
      setCollectionName('')
      setIsIndexing(false)
      setIsComplete(false)
      setImportedCollectionId(null)
    }
  }, [isOpen, filePath])

  const handleImport = useCallback(async () => {
    if (!filePath) return
    setIsIndexing(true)
    const collectionId = crypto.randomUUID()
    const finalName = collectionName || suggestedName
    await window.electron.importPgn(filePath, collectionId, finalName)
  }, [filePath, collectionName, suggestedName])

  const handleClose = useCallback(() => {
    setCollectionName('')
    setIsIndexing(false)
    const wasComplete = isComplete
    const collectionId = importedCollectionId
    setIsComplete(false)
    setImportedCollectionId(null)
    if (wasComplete && collectionId) {
      onComplete?.(collectionId)
    } else {
      onClose?.()
    }
  }, [isComplete, importedCollectionId, onComplete, onClose])

  return {
    collectionName,
    setCollectionName,
    isIndexing,
    isComplete,
    importedCollectionId,
    handleImport,
    handleClose,
    setIsIndexing,
    setIsComplete,
    setImportedCollectionId,
  }
}
