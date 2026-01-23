import { useState, useEffect } from 'react'
import { timestampToDisplay } from '../utils/dateConverter.js'
import { resultNumericToDisplay } from '../utils/resultConverter.js'

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

interface GameListSidebarProps {
  collectionId: string
  onGameSelect: (game: GameSearchResult) => void
}

export default function GameListSidebar({ collectionId, onGameSelect }: GameListSidebarProps) {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{ result: number | null }>({ result: null })

  useEffect(() => {
    const searchGames = async () => {
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
    <div className="flex flex-col gap-4 h-full">
      <input
        type="text"
        placeholder="Search players..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-3 py-2 bg-slate-600 rounded text-white placeholder-gray-400"
      />

      <div className="text-xs space-y-2">
        <label className="text-gray-400">Result</label>
        <div className="flex gap-2">
          {[null, 1.0, 0.5, 0.0].map((val, i) => (
            <label key={i} className="flex items-center gap-1">
              <input
                type="radio"
                checked={filters.result === val}
                onChange={() => setFilters({ result: val })}
              />
              <span>{val === null ? 'Any' : val === 1.0 ? 'W' : val === 0.5 ? 'D' : 'B'}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          setSearchTerm('')
          setFilters({ result: null })
        }}
        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm"
      >
        Reset
      </button>

      <div className="text-gray-400 text-sm">{games.length} games</div>

      <div className="overflow-y-auto flex-1">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => onGameSelect(game)}
            className="p-2 mb-2 bg-slate-600 hover:bg-slate-500 rounded cursor-pointer text-sm"
          >
            <p className="font-semibold">
              {game.white} vs {game.black}
            </p>
            <p className="text-gray-400 text-xs">
              {timestampToDisplay(game.date)} - {resultNumericToDisplay(game.result)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
