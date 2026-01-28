import { useState, useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between border border-ui-border rounded cursor-pointer"
        onClick={() => setShowMenu(!showMenu)} >
        <span className="text-sm cursor-pointer select-none">
          {selected?.name || 'Select Collection'}
        </span>
        <button className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded" >
          <LibraryBig size={18} />
        </button>
      </div>
      {showMenu && (
        <div className="absolute top-full mt-1 bg-ui-bg-element rounded shadow-lg z-50 min-w-full border-2 border-ui-text-dimmer">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => {
                onSelect(col.id)
                setShowMenu(false)
              }}
              className={`block w-full text-left px-3 py-1.5 hover:bg-ui-bg-hover whitespace-nowrap text-sm ${selectedId === col.id ? 'bg-ui-bg-hover' : ''
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
            Import...
          </button>
        </div>
      )}
    </div>
  )
}
