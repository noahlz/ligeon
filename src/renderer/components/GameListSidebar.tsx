import { Filter, SquareChevronDown } from 'lucide-react'
import { yyyymmToDisplay } from '../../shared/converters/dateConverter.js'
import { resultNumericToDisplay, RESULT_FILTER_OPTIONS } from '../../shared/converters/resultConverter.js'
import CollectionSelector from './CollectionSelector.js'
import OpeningFilter from './OpeningFilter.js'
import { getOpeningByEco } from '../utils/openings.js'
import { useGameFilters } from '../hooks/useGameFilters.js'
import { useGameSearch } from '../hooks/useGameSearch.js'
import type { GameRow, GameSearchResult } from '../../shared/types/game.js'
import { Input } from '@/components/ui/input.js'
import { Label } from '@/components/ui/label.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.js'
import { Button } from '@/components/ui/button.js'

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
  const {
    searchTerm,
    setSearchTerm,
    filters,
    filtersExpanded,
    setFiltersExpanded,
    setResultFilter,
    setDateFrom,
    setDateTo,
    setEcoCodes,
    resetFilters,
  } = useGameFilters()

  const { games, totalGameCount, availableDates } = useGameSearch({
    collectionId,
    searchTerm,
    filters,
    onCollectionChange: resetFilters,
  })

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
      <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
        <div className="flex items-center justify-between">
          <span className="text-ui-text-dim text-xs">
            {games.length < totalGameCount ? `${games.length} of ${totalGameCount} games` : `${totalGameCount} games`}
          </span>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-1 border border-ui-border hover:bg-ui-bg-hover cursor-pointer"
              title={filtersExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {filtersExpanded ? (
                <SquareChevronDown size={16} className="text-ui-text-dim" />
              ) : (
                <Filter size={16} className="text-ui-text-dim" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-2 p-2 border border-ui-border rounded-sm bg-ui-bg-element/50">
          <Input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 bg-ui-bg-element text-ui-text placeholder-ui-text-dimmer text-sm border-ui-border"
          />

          <div className="text-xs space-y-1">
            <Label className="text-ui-text-dim text-xs">Winner:</Label>
            <RadioGroup
              value={filters.result !== null ? filters.result.toString() : 'all'}
              onValueChange={(value: string) => setResultFilter(value === 'all' ? null : parseFloat(value))}
              className="flex gap-2"
            >
              {RESULT_FILTER_OPTIONS.map((option, i) => (
                <div key={i} className="flex items-center gap-1">
                  <RadioGroupItem
                    value={option.value !== null ? option.value.toString() : 'all'}
                    id={`result-${i}`}
                  />
                  <Label htmlFor={`result-${i}`} className="text-xs cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="text-xs space-y-1">
            <Label className="text-ui-text-dim text-xs">Date Range:</Label>
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
                        {yyyymmToDisplay(date)}
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
                        {yyyymmToDisplay(date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <Label className="text-ui-text-dim text-xs">Opening:</Label>
            <OpeningFilter
              collectionId={collectionId || ''}
              value={filters.ecoCodes}
              onChange={setEcoCodes}
            />
          </div>

          <Button
            variant="secondary"
            onClick={resetFilters}
            className="w-full h-8 bg-ui-bg-hover hover:bg-ui-bg-element text-sm"
          >
            Reset
          </Button>
        </CollapsibleContent>
      </Collapsible>

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
