import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay } from '../utils/resultConverter.js'

interface GameInfoProps {
  game: {
    pgn?: string
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
  const handleViewOnLichess = () => {
    if (!game.pgn) return
    const encoded = encodeURIComponent(game.pgn)
    window.open(`https://lichess.org/api/import?pgn=${encoded}`, '_blank')
  }

  return (
    <div className="bg-ui-bg-element rounded p-2 space-y-2 text-sm">
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
      <button
        onClick={handleViewOnLichess}
        disabled={!game.pgn}
        className="w-full px-3 py-1.5 bg-ui-primary hover:bg-blue-600 disabled:bg-ui-bg-box disabled:text-ui-text-dimmer disabled:cursor-not-allowed rounded text-sm font-medium"
      >
        View on Lichess
      </button>
    </div>
  )
}
