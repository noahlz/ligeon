import { useState } from 'react'
import {  SquareChevronDown, SquareMinus } from 'lucide-react'
import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay } from '../utils/resultConverter.js'

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

  return (
    <div className="bg-ui-bg-element rounded p-2 space-y-2 text-sm">
      {/* Header with toggle */}
      <div className="flex items-center -m-1">
        <span className={`font-semibold truncate rounded`}>{minimized ? `${game.white} vs ${game.black}` : 'Game Info'}</span>
        <button
          onClick={() => setMinimized(!minimized)}
          className="ml-auto flex items-center justify-center"
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? <SquareChevronDown size={14} /> : <SquareMinus size={14} />}
        </button>
      </div>

      {/* Content - hidden when minimized */}
      {!minimized && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div>
          <p className="text-ui-text-dim text-xs">White</p>
          <p className="font-semibold">
            {game.white}
            {game.whiteElo ? ` (${game.whiteElo})` : ''}
          </p>
        </div>
        <div>
          <p className="text-ui-text-dim text-xs">Black</p>
          <p className="font-semibold">
            {game.black}
            {game.blackElo ? ` (${game.blackElo})` : ''}
          </p>
        </div>
        <div>
          <p className="text-ui-text-dim text-xs">Event</p>
          <p className="text-xs">{game.event || '?'}</p>
        </div>
        <div>
          <p className="text-ui-text-dim text-xs">Date</p>
          <p className="text-xs">{timestampToDisplay(game.date)}</p>
        </div>
        <div>
          <p className="text-ui-text-dim text-xs">Result</p>
          <p className="text-xs">{resultNumericToDisplay(game.result ?? null)}</p>
        </div>
        {game.ecoCode && (
          <div>
            <p className="text-ui-text-dim text-xs">ECO</p>
            <p className="text-xs">{game.ecoCode}</p>
          </div>
        )}
        </div>
      )}
    </div>
  )
}
