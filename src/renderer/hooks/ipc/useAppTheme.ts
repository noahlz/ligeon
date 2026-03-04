import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppTheme } from '../../../shared/types/game.js'

export interface UseAppThemeReturn {
  appTheme: AppTheme
  effectiveTheme: 'dark' | 'light'
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
  const mqRef = useRef<MediaQueryList | null>(null)

  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    const theme = (localStorage.getItem('appTheme') as AppTheme) ?? 'dark'
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(theme, mq) // apply immediately — no flash
    return theme
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mqRef.current = mq

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
    const mq = mqRef.current ?? window.matchMedia('(prefers-color-scheme: dark)')
    setAppTheme(theme)
    localStorage.setItem('appTheme', theme)
    applyTheme(theme, mq)
    void window.electron.updateSettings({ appTheme: theme })
  }, [])

  const effectiveTheme: 'dark' | 'light' = appTheme === 'system'
    ? ((mqRef.current ?? window.matchMedia('(prefers-color-scheme: dark)')).matches ? 'dark' : 'light')
    : appTheme

  return { appTheme, effectiveTheme, handleAppThemeChange }
}
