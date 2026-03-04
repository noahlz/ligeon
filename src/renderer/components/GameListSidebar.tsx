import { useEffect } from 'react'
import { AlertTriangle, Filter, SquareChevronDown } from 'lucide-react'
import { yyyymmddToDisplay } from '../../shared/converters/dateConverter.js'
import { resultNumericToDisplay, RESULT_FILTER_OPTIONS } from '../../shared/converters/resultConverter.js'
import CollectionSelector from './runtime/CollectionSelector.js'
import OpeningFilter from './OpeningFilter.js'
import { formatEcoWithOpening } from '../utils/formatters.js'
import { useGameFilters } from '../hooks/useGameFilters.js'
import { useGameSearch } from '../hooks/ipc/useGameSearch.js'
import type { GameRow, GameSearchResult, GameListLimit } from '../../shared/types/game.js'
import { GameListSection } from './settings/GameListSection.js'
import { Input } from '@/components/ui/input.js'
import { Label } from '@/components/ui/label.js'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.js'

import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

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
  gameListLimit: GameListLimit
  onGameListLimitChange: (limit: GameListLimit) => void
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
  gameListLimit,
  onGameListLimitChange,
}: GameListSidebarProps) {
  const {
    searchTerm,
    setSearchTerm,
    filters,
    filtersExpanded,
    setFiltersExpanded,
    setResultsFilter,
    setDateFrom,
    setDateTo,
    setEcoCodes,
    resetFilters,
  } = useGameFilters()

  const { games, totalGameCount, availableDates, staleDateFrom, staleDateTo } = useGameSearch({
    collectionId,
    searchTerm,
    filters,
    limit: gameListLimit,
    onCollectionChange: resetFilters,
  })

  // Clear stale date selections when they become invalid
  useEffect(() => {
    if (staleDateFrom) setDateFrom(null)
    if (staleDateTo) setDateTo(null)
  }, [staleDateFrom, staleDateTo, setDateFrom, setDateTo])

  return (
    <div id="tour-game-filter" data-testid="game-list-sidebar" className="flex flex-col gap-2 h-full">
      <CollectionSelector
        collections={collections}
        selectedId={selectedCollectionId}
        onSelect={onSelectCollection}
        onImport={onImport}
        onDelete={onDeleteCollection}
        onRename={onRenameCollection}
      />
      {/* Filter Panel */}
      <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <span className="text-ui-text-dim text-sm px-2">
              {games.length < totalGameCount ? `${games.length} of ${totalGameCount} games` : `${totalGameCount} games`}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-1 bg-ui-bg-element hover:bg-ui-bg-hover transition-colors cursor-pointer"
                >
                  {filtersExpanded ? (
                    <SquareChevronDown size={16} className="text-ui-text-dim" />
                  ) : (
                    <Filter size={16} className="text-ui-text-dim" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{filtersExpanded ? 'Collapse filters' : 'Expand filters'}</TooltipContent>
            </Tooltip>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="space-y-3 p-3 mt-1 ml-1 border-l-2 border-ui-text-dim/20 bg-ui-bg-element/20 rounded-r-md" >
            {/* Search Input */}
            <Input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 bg-ui-bg-element text-ui-text placeholder-ui-text-dimmer text-sm border-ui-border"
            />

            {/* Opening Filter */}
            <div className="text-xs space-y-1">
              <OpeningFilter
                collectionId={collectionId || ''}
                value={filters.ecoCodes}
                onChange={setEcoCodes}
                player={searchTerm || undefined}
                results={filters.results}
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
              />
            </div>

            {/* Date Range Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-ui-text-dimmer text-xs">From</Label>
                <Select
                  value={filters.dateFrom?.toString() ?? 'all'}
                  onValueChange={(value) => setDateFrom(value === 'all' ? null : parseInt(value, 10))}
                >
                  <SelectTrigger className="h-7 bg-ui-bg-element text-ui-text text-xs border-ui-border">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-ui-bg-box border-ui-border">
                    <SelectItem value="all" className="text-xs">All</SelectItem>
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date.toString()} className="text-xs">
                        {yyyymmddToDisplay(date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-ui-text-dimmer text-xs">To</Label>
                <Select
                  value={filters.dateTo?.toString() ?? 'all'}
                  onValueChange={(value) => setDateTo(value === 'all' ? null : parseInt(value, 10))}
                >
                  <SelectTrigger className="h-7 bg-ui-bg-element text-ui-text text-xs border-ui-border">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-ui-bg-box border-ui-border">
                    <SelectItem value="all" className="text-xs">All</SelectItem>
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date.toString()} className="text-xs">
                        {yyyymmddToDisplay(date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Winner Toggles (Centered Axis) */}
            <div className="flex items-center gap-3 py-1">
              <Label className="text-ui-text-dim text-xs whitespace-nowrap">
                Winner:
              </Label>
              <ToggleGroup
                type="multiple"
                value={filters.results.map(String)}
                onValueChange={(values: string[]) => setResultsFilter(values.map(parseFloat))}
                className="flex gap-2 justify-start"
              >
                {RESULT_FILTER_OPTIONS.map((option, i) => (
                  <ToggleGroupItem
                    key={i}
                    value={option.value.toString()}
                    aria-label={option.label}
                    className="h-7 px-2 text-xs cursor-pointer bg-ui-bg-hover hover:bg-ui-bg-element data-[state=on]:bg-ui-accent data-[state=on]:text-white transition-colors"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Max games */}
            <div className="flex items-center gap-3">
              <Label className="text-ui-text-dim text-xs whitespace-nowrap">Max games:</Label>
              <GameListSection
                gameListLimit={gameListLimit}
                onGameListLimitChange={onGameListLimitChange}
                triggerClassName="h-7 bg-ui-bg-element text-ui-text text-xs border-ui-border w-28 cursor-pointer"
                showWarning={false}
              />
              {gameListLimit === 'unlimited' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle size={14} className="text-ui-accent cursor-default shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Large game collections may affect performance</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Reset Button */}
            <Button
              variant="secondary"
              onClick={resetFilters}
              className="w-full h-8 bg-ui-bg-hover hover:bg-ui-bg-element text-sm mt-1"
            >
              Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="overflow-y-auto flex-1">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => onGameSelect(game)}
            className={`p-2 mb-1.5 rounded text-sm cursor-pointer ${selectedGame?.id === game.id && selectedGameCollectionId === collectionId
              ? 'border-2 border-ui-accent bg-ui-bg-element'
              : 'bg-ui-bg-element hover:bg-ui-bg-hover'
              }`}
          >
            <p className="font-semibold">
              {game.white} vs {game.black}
            </p>
            <p className="text-ui-text-dim text-xs flex gap-1 whitespace-nowrap">
              <span>
                {yyyymmddToDisplay(game.date)} - {resultNumericToDisplay(game.result)}
              </span>
              {game.ecoCode && (
                <span
                  className="truncate"
                  title={formatEcoWithOpening(game.ecoCode)}
                >
                  - {formatEcoWithOpening(game.ecoCode)}
                </span>
              )}
            </p>
          </div>
        ))}
        {gameListLimit !== 'unlimited' && games.length === gameListLimit && (
          <div className="mt-1 px-2 py-1.5 text-xs text-ui-text-dim italic text-center">
            More games available — use filters to narrow the list.
          </div>
        )}
      </div>
    </div>
  )
}
