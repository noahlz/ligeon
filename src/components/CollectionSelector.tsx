import { useState } from 'react'
import { LibraryBig } from 'lucide-react'

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
}

export default function CollectionSelector({
  collections,
  selectedId,
  onSelect,
  onImport,
}: CollectionSelectorProps) {
  const [showMenu, setShowMenu] = useState(false)
  const selected = collections.find((c) => c.id === selectedId)

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <span className="text-sm">{selected?.name || 'Select Collection'}</span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded"
        >
          <LibraryBig size={18} />
        </button>
      </div>
      {showMenu && (
        <div className="absolute top-full mt-1 bg-ui-bg-element rounded shadow-lg z-50 min-w-full">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => {
                onSelect(col.id)
                setShowMenu(false)
              }}
              className={`block w-full text-left px-3 py-1.5 hover:bg-ui-bg-hover whitespace-nowrap text-sm ${
                selectedId === col.id ? 'bg-ui-bg-hover' : ''
              }`}
            >
              {col.name}
            </button>
          ))}
          <div className="border-t border-ui-border" />
          <button
            onClick={() => {
              onImport?.()
              setShowMenu(false)
            }}
            className="block w-full text-left px-3 py-1.5 hover:bg-ui-bg-hover text-sm"
          >
            + Import
          </button>
        </div>
      )}
    </div>
  )
}
