import { useState, useEffect } from 'react'
import { Filter, SquareChevronDown } from 'lucide-react'
import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay, RESULT_FILTER_OPTIONS } from '../../lib/converters/resultConverter.js'
import CollectionSelector from './CollectionSelector.js'
import OpeningFilter from './OpeningFilter.js'

interface GameSearchResult {
  id: number
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
}

interface Collection {
  id: string
  name: string
}

interface GameListSidebarProps {
  collectionId: string | null
  onGameSelect: (game: GameSearchResult) => void
  collections: Collection[]
  selectedCollectionId: string | null
  onSelectCollection: (id: string) => void
  onImport: () => void
  onDeleteCollection: (id: string) => void
  onRenameCollection?: () => void
}

export default function GameListSidebar({
  collectionId,
  onGameSelect,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onImport,
  onDeleteCollection,
  onRenameCollection,
}: GameListSidebarProps) {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [totalGameCount, setTotalGameCount] = useState(0)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{
    result: number | null
    yearFrom: number | null
    monthFrom: number | null
    yearTo: number | null
    monthTo: number | null
    ecoCode: string
  }>({
    result: null,
    yearFrom: null,
    monthFrom: null,
    yearTo: null,
    monthTo: null,
    ecoCode: '',
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Fetch total game count and available years when collection changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!collectionId) {
        setTotalGameCount(0)
        setAvailableYears([])
        setFilters({
          result: null,
          yearFrom: null,
          monthFrom: null,
          yearTo: null,
          monthTo: null,
          ecoCode: '',
        })
        return
      }

      const count = await window.electron.getGameCount(collectionId)
      setTotalGameCount(count)

      // Get available years
      const years = await window.electron.getAvailableYears(collectionId)
      setAvailableYears(years)

      // Set initial date range to full collection range
      if (years.length > 0) {
        setFilters({
          result: null,
          yearFrom: years[0],
          monthFrom: 1,
          yearTo: years[years.length - 1],
          monthTo: 12,
          ecoCode: '',
        })
      }
    }
    fetchMetadata()
  }, [collectionId])

  // Convert year/month to timestamp
  const dateToTimestamp = (year: number | null, month: number | null): number | null => {
    if (year === null) return null
    const m = month ?? 1
    return new Date(year, m - 1, 1).getTime()
  }

  // Convert year/month to end-of-month timestamp
  const dateToEndTimestamp = (year: number | null, month: number | null): number | null => {
    if (year === null) return null
    const m = month ?? 12
    // Last day of month: set to day 0 of next month
    return new Date(year, m, 0, 23, 59, 59, 999).getTime()
  }

  // Search games with filters
  useEffect(() => {
    const searchGames = async () => {
      if (!collectionId) {
        setGames([])
        return
      }

      const dateFrom = dateToTimestamp(filters.yearFrom, filters.monthFrom)
      const dateTo = dateToEndTimestamp(filters.yearTo, filters.monthTo)

      const results = await window.electron.searchGames(collectionId, {
        player: searchTerm || undefined,
        result: filters.result ?? undefined,
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? undefined,
        ecoCode: filters.ecoCode || undefined,
        limit: 1000,
      })
      setGames(results)
    }
    searchGames()
  }, [collectionId, searchTerm, filters])

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm.length > 0 ||
    filters.result !== null ||
    filters.yearFrom !== null ||
    filters.yearTo !== null ||
    filters.ecoCode.length > 0

  return (
    <div data-testid="game-list-sidebar" className="flex flex-col gap-2 h-full">
      <CollectionSelector
        collections={collections}
        selectedId={selectedCollectionId}
        onSelect={onSelectCollection}
        onImport={onImport}
        onDelete={onDeleteCollection}
        onRename={onRenameCollection}
      />
      {/* Filter Panel */}
      <div className="flex items-center justify-between">
        <span className="text-ui-text-dim text-xs">
          {hasActiveFilters ? `${games.length} of ${totalGameCount} games` : `${totalGameCount} games`}
        </span>
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="p-1 rounded border border-ui-border hover:bg-ui-bg-hover"
          title={filtersExpanded ? 'Collapse filters' : 'Expand filters'}
        >
          {filtersExpanded ? (
            <SquareChevronDown size={16} className="text-ui-text-dim" />
          ) : (
            <Filter size={16} className="text-ui-text-dim" />
          )}
        </button>
      </div>

      {filtersExpanded && (
        <div className="space-y-2 p-2 border border-ui-border rounded bg-ui-bg-element/50">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1.5 bg-ui-bg-element rounded text-ui-text placeholder-ui-text-dimmer text-sm border border-ui-border"
          />

          <div className="text-xs space-y-1">
            <label className="text-ui-text-dim">Winner:</label>
            <div className="flex gap-2">
              {RESULT_FILTER_OPTIONS.map((option, i) => (
                <label key={i} className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={filters.result === option.value}
                    onChange={() => setFilters({ ...filters, result: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-xs space-y-1">
            <label className="text-ui-text-dim">Date Range:</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-ui-text-dimmer text-xs">From</label>
                <div className="flex gap-1">
                  <select
                    value={filters.yearFrom ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearFrom: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="flex-1 px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                  >
                    <option value="">Year</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.monthFrom ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        monthFrom: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="flex-1 px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-ui-text-dimmer text-xs">To</label>
                <div className="flex gap-1">
                  <select
                    value={filters.yearTo ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearTo: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="flex-1 px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                  >
                    <option value="">Year</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.monthTo ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        monthTo: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="flex-1 px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <label className="text-ui-text-dim">Opening:</label>
            <OpeningFilter
              value={filters.ecoCode}
              onChange={(eco) => setFilters({ ...filters, ecoCode: eco })}
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('')
              setFilters({
                result: null,
                yearFrom: null,
                monthFrom: null,
                yearTo: null,
                monthTo: null,
                ecoCode: '',
              })
            }}
            className="px-2 py-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded text-sm"
          >
            Reset
          </button>
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => onGameSelect(game)}
            className="p-2 mb-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded cursor-pointer text-sm"
          >
            <p className="font-semibold">
              {game.white} vs {game.black}
            </p>
            <p className="text-ui-text-dim text-xs">
              {timestampToDisplay(game.date)} - {resultNumericToDisplay(game.result)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
