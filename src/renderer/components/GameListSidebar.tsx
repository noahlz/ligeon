import { useState, useEffect } from 'react'
import { Filter, SquareChevronDown } from 'lucide-react'
import { yyyymmToDisplay } from '../../shared/converters/dateConverter.js'
import { resultNumericToDisplay, RESULT_FILTER_OPTIONS } from '../../shared/converters/resultConverter.js'
import CollectionSelector from './CollectionSelector.js'
import OpeningFilter from './OpeningFilter.js'
import { getOpeningByEco } from '../utils/openings.js'
import type { GameRow, GameSearchResult } from '../../shared/types/game.js'

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
  selectedGame: GameRow | null
  selectedGameCollectionId: string | null
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
  selectedGame,
  selectedGameCollectionId,
}: GameListSidebarProps) {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [totalGameCount, setTotalGameCount] = useState(0)
  const [availableDates, setAvailableDates] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{
    result: number | null
    dateFrom: number | null
    dateTo: number | null
    ecoCodes: string[]
  }>({
    result: null,
    dateFrom: null,
    dateTo: null,
    ecoCodes: [],
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Fetch total game count and available dates when collection changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!collectionId) {
        setTotalGameCount(0)
        setAvailableDates([])
        setFilters({
          result: null,
          dateFrom: null,
          dateTo: null,
          ecoCodes: [],
        })
        return
      }

      const count = await window.electron.getGameCount(collectionId)
      setTotalGameCount(count)

      // Get available dates (YYYYMM format)
      const dates = await window.electron.getAvailableDates(collectionId)
      setAvailableDates(dates)
    }
    fetchMetadata()
  }, [collectionId])

  // Search games with filters
  useEffect(() => {
    const searchGames = async () => {
      if (!collectionId) {
        setGames([])
        return
      }

      const results = await window.electron.searchGames(collectionId, {
        player: searchTerm || undefined,
        result: filters.result ?? undefined,
        dateFrom: filters.dateFrom ?? undefined,
        dateTo: filters.dateTo ?? undefined,
        ecoCodes: filters.ecoCodes.length > 0 ? filters.ecoCodes : undefined,
        limit: 200,
      })
      setGames(results)
    }
    searchGames()
  }, [collectionId, searchTerm, filters])

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
          {games.length < totalGameCount ? `${games.length} of ${totalGameCount} games` : `${totalGameCount} games`}
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
                <select
                  value={filters.dateFrom ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null
                    // Only update if valid (start <= end or one is null)
                    if (value === null || filters.dateTo === null || value <= filters.dateTo) {
                      setFilters({ ...filters, dateFrom: value })
                    }
                  }}
                  className="w-full px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                >
                  <option value="">All</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {yyyymmToDisplay(date)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-ui-text-dimmer text-xs">To</label>
                <select
                  value={filters.dateTo ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null
                    // Only update if valid (start <= end or one is null)
                    if (value === null || filters.dateFrom === null || filters.dateFrom <= value) {
                      setFilters({ ...filters, dateTo: value })
                    }
                  }}
                  className="w-full px-2 py-1 bg-ui-bg-element rounded text-ui-text text-xs border border-ui-border"
                >
                  <option value="">All</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {yyyymmToDisplay(date)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <label className="text-ui-text-dim">Opening:</label>
            <OpeningFilter
              collectionId={collectionId || ''}
              value={filters.ecoCodes}
              onChange={(ecos) => setFilters({ ...filters, ecoCodes: ecos })}
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('')
              setFilters({
                result: null,
                dateFrom: null,
                dateTo: null,
                ecoCodes: [],
              })
            }}
            className="w-full px-2 py-1.5 bg-ui-bg-hover hover:bg-ui-bg-element rounded text-sm"
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
            className={`p-2 mb-1.5 rounded cursor-pointer text-sm ${
              selectedGame?.id === game.id && selectedGameCollectionId === collectionId
                ? 'border-2 border-ui-accent bg-ui-bg-element'
                : 'bg-ui-bg-element hover:bg-ui-bg-hover'
            }`}
          >
            <p className="font-semibold">
              {game.white} vs {game.black}
            </p>
            <p className="text-ui-text-dim text-xs flex gap-1 whitespace-nowrap">
              <span>
                {yyyymmToDisplay(game.date)} - {resultNumericToDisplay(game.result)}
              </span>
              {game.ecoCode && (
                <span
                  className="truncate"
                  title={`${game.ecoCode}${getOpeningByEco(game.ecoCode) ? ` ${getOpeningByEco(game.ecoCode)?.name}` : ''}`}
                >
                  - {game.ecoCode} {getOpeningByEco(game.ecoCode)?.name}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
