import { useState, useEffect, useCallback } from 'react'
import type { AppTheme } from '../../shared/types/game.js'

export interface UseAppThemeReturn {
  appTheme: AppTheme
  handleAppThemeChange: (theme: AppTheme) => void
}

function applyTheme(theme: AppTheme, mediaQuery: MediaQueryList): void {
  const prefersDark = mediaQuery.matches
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  if (effective === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useAppTheme(): UseAppThemeReturn {
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('appTheme') as AppTheme) ?? 'dark'
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    // Apply cached value immediately (avoids flash-of-wrong-theme on load)
    const cached = (localStorage.getItem('appTheme') as AppTheme) ?? 'dark'
    applyTheme(cached, mq)

    // Load persisted setting from main process
    void window.electron.getSettings().then((settings) => {
      const theme = settings.appTheme ?? 'dark'
      setAppTheme(theme)
      localStorage.setItem('appTheme', theme)
      applyTheme(theme, mq)
    })

    // Re-apply when OS theme changes (relevant when appTheme === 'system')
    const handleMediaChange = () => {
      setAppTheme((current) => {
        applyTheme(current, mq)
        return current
      })
    }
    mq.addEventListener('change', handleMediaChange)
    return () => mq.removeEventListener('change', handleMediaChange)
  }, [])

  const handleAppThemeChange = useCallback((theme: AppTheme) => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setAppTheme(theme)
    localStorage.setItem('appTheme', theme)
    applyTheme(theme, mq)
    void window.electron.updateSettings({ appTheme: theme })
  }, [])

  return { appTheme, handleAppThemeChange }
}
