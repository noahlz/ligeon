import { useState, useEffect, useCallback } from 'react'
import type { BoardTheme } from '../../shared/types/game.js'

export interface UseBoardThemeReturn {
  boardTheme: BoardTheme
  handleThemeChange: (theme: BoardTheme) => void
}

export function useBoardTheme(): UseBoardThemeReturn {
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('brown')

  useEffect(() => {
    void window.electron.getBoardTheme().then((theme) => {
      setBoardTheme(theme)
      document.documentElement.dataset.boardTheme = theme
    })
  }, [])

  const handleThemeChange = useCallback((theme: BoardTheme) => {
    setBoardTheme(theme)
    document.documentElement.dataset.boardTheme = theme
    void window.electron.setBoardTheme(theme)
  }, [])

  return { boardTheme, handleThemeChange }
}
