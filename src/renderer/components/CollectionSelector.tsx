import { useState, useEffect, useRef } from 'react'
import { LibraryBig, Trash2, Pencil, Check, X } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.js'
import { validateCollectionName } from '../utils/collectionValidator.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.js'
import { Input } from '@/components/ui/input.js'
import { Button } from '@/components/ui/button.js'

interface Collection {
  id: string
  name: string
  gameCount?: number
  createdAt?: string
  lastModified?: string
}

interface CollectionSelectorProps {
  collections: Collection[]
  selectedId: string | null
  onSelect: (collectionId: string) => void
  onImport?: () => void
  onDelete?: (collectionId: string) => void
  onRename?: () => void
}

export default function CollectionSelector({
  collections,
  selectedId,
  onSelect,
  onImport,
  onDelete,
  onRename,
}: CollectionSelectorProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const selected = collections.find((c) => c.id === selectedId)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleConfirmDelete = () => {
    if (collectionToDelete) {
      onDelete?.(collectionToDelete.id)
      setCollectionToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setCollectionToDelete(null)
  }

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editingCollectionId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCollectionId])

  const handleStartEdit = (col: Collection) => {
    setEditingCollectionId(col.id)
    setEditValue(col.name)
  }

  const handleCancelEdit = () => {
    setEditingCollectionId(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingCollectionId) return

    const validation = validateCollectionName(editValue, collections, editingCollectionId)
    if (!validation.valid) {
      return
    }

    try {
      await window.electron.renameCollection(editingCollectionId, editValue.trim())
      setEditingCollectionId(null)
      setEditValue('')
      onRename?.()
    } catch (error) {
      console.error('Failed to rename collection:', error)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div className="relative bg-ui-bg-element rounded-lg">
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center border border-ui-border rounded-sm cursor-pointer">
            <span className="text-sm cursor-pointer select-none truncate font-bold flex-1 min-w-0 px-2" title={selected?.name}>
              {selected?.name || 'Select Collection'}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded-sm shrink-0">
              <LibraryBig size={18} />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full max-w-xs bg-ui-bg-element border-2 border-ui-text-dimmer" align="start">
          {collections.map((col) => (
            <div
              key={col.id}
              className={`group flex items-center gap-2 px-3 py-1.5 hover:bg-ui-bg-hover text-sm ${
                selectedId === col.id ? 'bg-ui-bg-hover' : ''
              }`}
            >
              {editingCollectionId === col.id ? (
                <>
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 h-7 px-2 py-0.5 bg-ui-bg-page border-ui-border text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancelEdit}
                    className="h-6 w-6 p-1 hover:bg-ui-bg-page opacity-60 hover:opacity-100"
                    title="Cancel"
                  >
                    <X size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSaveEdit}
                    className="h-6 w-6 p-1 hover:bg-ui-bg-page opacity-60 hover:opacity-100"
                    title="Save"
                  >
                    <Check size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onSelect(col.id)
                      setShowMenu(false)
                    }}
                    className="flex-1 text-left truncate min-w-0 cursor-pointer"
                    title={col.name}
                  >
                    {col.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(col)
                    }}
                    className="h-6 w-6 p-1 hover:bg-ui-bg-page rounded-sm opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                    title="Rename collection"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCollectionToDelete(col)
                      setShowMenu(false)
                    }}
                    className="h-6 w-6 p-1 hover:bg-ui-bg-page rounded-sm opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                    title="Delete collection"
                  >
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          ))}
          <DropdownMenuSeparator className="bg-ui-border" />
          <DropdownMenuItem
            onClick={() => {
              onImport?.()
              setShowMenu(false)
            }}
          >
            + Import
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        isOpen={!!collectionToDelete}
        title="Delete Collection"
        message={`Delete collection "${collectionToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmIcon="trash"
      />
    </div>
  )
}
