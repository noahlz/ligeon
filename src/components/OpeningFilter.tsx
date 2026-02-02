import { useState, useEffect, useRef } from 'react'
import { searchOpenings, getAllOpenings, type Opening } from '../utils/openings.js'

interface OpeningFilterProps {
  value: string[] // Array of ECO codes
  onChange: (ecos: string[]) => void
}

export default function OpeningFilter({ value, onChange }: OpeningFilterProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Opening[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search openings as user types (show all if query is empty)
  useEffect(() => {
    if (query.length === 0) {
      // Show all openings when dropdown is focused with empty query
      const matches = getAllOpenings()
      setResults(matches)
      setSelectedIndex(0)
      return
    }

    const matches = searchOpenings(query, 20)
    setResults(matches)
    setSelectedIndex(0)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isSelected = (eco: string) => value.includes(eco)

  const handleToggle = (opening: Opening) => {
    if (isSelected(opening.eco)) {
      onChange(value.filter((eco) => eco !== opening.eco))
    } else {
      onChange([...value, opening.eco])
    }
    // Keep dropdown open for multi-select
    setShowDropdown(true)
    // Refocus input to maintain dropdown visibility
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleToggle(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleRemoveTag = (eco: string) => {
    onChange(value.filter((e) => e !== eco))
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected opening tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((eco) => (
            <span
              key={eco}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-ui-accent text-white text-xs rounded"
            >
              {eco}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveTag(eco)
                }}
                className="hover:opacity-80"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search section with dropdown */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search openings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          className="w-full px-2 py-1.5 bg-ui-bg-element rounded text-ui-text placeholder-ui-text-dimmer text-sm border border-ui-border outline-none"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-ui-bg-box border border-ui-border rounded shadow-lg max-h-60 overflow-y-auto"
          >
            {results.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-ui-text-dim">No openings found</div>
            ) : (
              results.map((opening, idx) => (
                <div
                  key={opening.eco}
                  onClick={() => handleToggle(opening)}
                  className={`px-2 py-1.5 cursor-pointer text-sm flex items-center gap-2 ${
                    isSelected(opening.eco) ? 'border-l-4 border-ui-accent bg-ui-bg-hover' : ''
                  } ${idx === selectedIndex && !isSelected(opening.eco) ? 'bg-ui-bg-hover' : 'hover:bg-ui-bg-hover'}`}
                >
                  <span className="font-semibold text-ui-accent">{opening.eco}</span>
                  <span className="text-ui-text-dim">{opening.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
