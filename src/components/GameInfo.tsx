import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay } from '../utils/resultConverter.js'

interface GameInfoProps {
  game: {
    pgn?: string
    white: string
    black: string
    whiteElo?: number
    blackElo?: number
    event?: string
    date?: number
    result?: number | null
    ecoCode?: string
  }
}

export default function GameInfo({ game }: GameInfoProps) {
  const handleViewOnLichess = () => {
    if (!game.pgn) return
    const encoded = encodeURIComponent(game.pgn)
    window.open(`https://lichess.org/api/import?pgn=${encoded}`, '_blank')
  }

  return (
    <div className="bg-slate-700 rounded p-4 space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">White</p>
          <p className="font-semibold">
            {game.white}
            {game.whiteElo ? ` (${game.whiteElo})` : ''}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Black</p>
          <p className="font-semibold">
            {game.black}
            {game.blackElo ? ` (${game.blackElo})` : ''}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Event</p>
          <p>{game.event || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-400">Date</p>
          <p>{timestampToDisplay(game.date)}</p>
        </div>
        <div>
          <p className="text-gray-400">Result</p>
          <p>{resultNumericToDisplay(game.result ?? null)}</p>
        </div>
        {game.ecoCode && (
          <div>
            <p className="text-gray-400">ECO</p>
            <p>{game.ecoCode}</p>
          </div>
        )}
      </div>
      <button
        onClick={handleViewOnLichess}
        disabled={!game.pgn}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded font-semibold"
      >
        View on Lichess
      </button>
    </div>
  )
}
