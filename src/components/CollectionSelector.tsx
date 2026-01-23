import { useState } from 'react'

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
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
      >
        {selected?.name || 'Select Collection'} ▼
      </button>
      {showMenu && (
        <div className="absolute top-full mt-1 bg-slate-700 rounded shadow-lg z-50 min-w-full">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => {
                onSelect(col.id)
                setShowMenu(false)
              }}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 whitespace-nowrap ${
                selectedId === col.id ? 'bg-slate-600' : ''
              }`}
            >
              {col.name}
            </button>
          ))}
          <div className="border-t border-slate-600" />
          <button
            onClick={() => {
              onImport?.()
              setShowMenu(false)
            }}
            className="block w-full text-left px-4 py-2 hover:bg-slate-600"
          >
            + Import
          </button>
        </div>
      )}
    </div>
  )
}
