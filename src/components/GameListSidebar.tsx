import { useState, useEffect } from 'react'
import { Filter, SquareChevronDown } from 'lucide-react'
import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay, RESULT_FILTER_OPTIONS } from '../utils/resultConverter.js'
import CollectionSelector from './CollectionSelector.js'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{ result: number | null }>({ result: null })
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    const searchGames = async () => {
      if (!collectionId) {
        setGames([])
        return
      }
      const results = await window.electron.searchGames(collectionId, {
        white: searchTerm || undefined,
        black: searchTerm || undefined,
        result: filters.result ?? undefined,
        limit: 1000,
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
        <span className="text-ui-text-dim text-xs">{games.length} games</span>
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
            <label className="text-ui-text-dim">Result</label>
            <div className="flex gap-2">
              {RESULT_FILTER_OPTIONS.map((option, i) => (
                <label key={i} className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={filters.result === option.value}
                    onChange={() => setFilters({ result: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSearchTerm('')
              setFilters({ result: null })
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
