import { useState } from 'react'
import { SquareChevronDown, SquareMinus } from 'lucide-react'
import { yyyymmddToDisplay } from '../../shared/converters/dateConverter.js'
import { resultNumericToDisplay } from '../../shared/converters/resultConverter.js'
import { formatPlayerWithElo, formatEcoWithOpening } from '../utils/formatters.js'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible.js'

interface GameInfoProps {
  game: {
    white: string
    black: string
    whiteElo?: number | null
    blackElo?: number | null
    event?: string | null
    date?: number | null
    result?: number | null
    ecoCode?: string | null
  }
}

export default function GameInfo({ game }: GameInfoProps) {
  const [minimized, setMinimized] = useState(true)
  const ecoDisplay = formatEcoWithOpening(game.ecoCode)

  return (
    <Collapsible open={!minimized} onOpenChange={(open) => setMinimized(!open)}>
      <div className="bg-ui-bg-element rounded-sm p-2 space-y-2 text-sm">
        {/* Header with toggle */}
        <CollapsibleTrigger asChild>
          <div className="flex flex-col -m-1 gap-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold rounded-sm">
                {minimized ? `${game.white} vs ${game.black}` : 'Game Info'}
              </p>
              <span className="ml-auto flex items-center justify-center shrink-0">
                {minimized ? <SquareChevronDown size={20} /> : <SquareMinus size={20} />}
              </span>
            </div>
            {minimized && (
              <p className="truncate text-ui-text-dim">
                {yyyymmddToDisplay(game.date)}{ecoDisplay ? ` - ${ecoDisplay}` : ''}
              </p>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div>
              <p className="text-ui-text-dim text-xs">White</p>
              <p className="font-semibold">{formatPlayerWithElo(game.white, game.whiteElo)}</p>
            </div>
            <div>
              <p className="text-ui-text-dim text-xs">Black</p>
              <p className="font-semibold">{formatPlayerWithElo(game.black, game.blackElo)}</p>
            </div>
            <div>
              <p className="text-ui-text-dim text-xs">Event</p>
              <p className="text-xs">{game.event || '?'}</p>
            </div>
            <div>
              <p className="text-ui-text-dim text-xs">Date</p>
              <p className="text-xs">{yyyymmddToDisplay(game.date)}</p>
            </div>
            <div>
              <p className="text-ui-text-dim text-xs">Result</p>
              <p className="text-xs">{resultNumericToDisplay(game.result ?? null)}</p>
            </div>
            {game.ecoCode && (
              <div>
                <p className="text-ui-text-dim text-xs">Opening</p>
                <p className="text-xs">{ecoDisplay}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
