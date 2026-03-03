import { useState, useEffect, useCallback } from 'react'
import type { GameListLimit } from '../../shared/types/game.js'

export interface UseGameListLimitReturn {
  gameListLimit: GameListLimit
  handleGameListLimitChange: (limit: GameListLimit) => void
}

export function useGameListLimit(): UseGameListLimitReturn {
  const [gameListLimit, setGameListLimit] = useState<GameListLimit>(500)

  useEffect(() => {
    void window.electron.getSettings().then((settings) => {
      setGameListLimit(settings.gameListLimit)
    })
  }, [])

  const handleGameListLimitChange = useCallback((limit: GameListLimit) => {
    setGameListLimit(limit)
    void window.electron.updateSettings({ gameListLimit: limit })
  }, [])

  return { gameListLimit, handleGameListLimitChange }
}
