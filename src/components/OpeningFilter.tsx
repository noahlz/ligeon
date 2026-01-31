import { useState, useEffect, useRef } from 'react'
import { searchOpenings, type Opening } from '../utils/openings.js'

interface OpeningFilterProps {
  value: string // ECO code
  onChange: (eco: string) => void
}

export default function OpeningFilter({ value, onChange }: OpeningFilterProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Opening[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search openings as user types
  useEffect(() => {
    if (query.length === 0) {
      setResults([])
      setShowDropdown(false)
      return
    }

    const matches = searchOpenings(query, 20)
    setResults(matches)
    setShowDropdown(matches.length > 0)
    setSelectedIndex(0)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (opening: Opening) => {
    onChange(opening.eco)
    setQuery('')
    setShowDropdown(false)
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
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setQuery('')
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search openings..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true)
        }}
        className="w-full px-2 py-1.5 bg-ui-bg-element rounded text-ui-text placeholder-ui-text-dimmer text-sm border border-ui-border"
      />

      {/* Selected opening display */}
      {value && !query && (
        <div className="mt-1 flex items-center justify-between px-2 py-1 bg-ui-bg-element rounded text-xs">
          <span className="text-ui-text-dim">{value}</span>
          <button
            onClick={handleClear}
            className="text-ui-text-dimmer hover:text-ui-text-dim"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-ui-bg-box border border-ui-border rounded shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((opening, idx) => (
            <div
              key={opening.eco}
              onClick={() => handleSelect(opening)}
              className={`px-2 py-1.5 cursor-pointer text-sm ${
                idx === selectedIndex ? 'bg-ui-bg-hover' : 'hover:bg-ui-bg-hover'
              }`}
            >
              <span className="font-semibold text-ui-accent">{opening.eco}</span>
              <span className="text-ui-text-dim ml-2">{opening.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
