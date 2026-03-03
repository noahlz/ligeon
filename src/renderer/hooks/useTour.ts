import { useState, useRef, useEffect } from 'react'
import { driver } from 'driver.js'
import '../styles/tour.css'
import type { Driver } from 'driver.js'
import type { GameRow } from '../../shared/types/game.js'

/**
 * Fires three independent contextual tour popovers based on app state:
 *
 * 1. On mount — welcome + import instructions (floating, no highlight)
 * 2. When selectedCollectionId becomes non-null — game filter hint
 * 3. When selectedGame becomes non-null — 3-step controls + navigation + move list sequence
 *
 * Each trigger fires at most once per install (IPC settings gate).
 */
export function useTour(
  selectedCollectionId: string | null,
  selectedGame: GameRow | null,
): void {
  const driverRef = useRef<Driver | null>(null)

  const [tourState, setTourState] = useState<{
    loaded:         boolean
    welcomeSeen:    boolean
    collectionSeen: boolean
    gameSeen:       boolean
  }>({ loaded: false, welcomeSeen: false, collectionSeen: false, gameSeen: false })

  // Load tour status from IPC settings on mount.
  useEffect(() => {
    void window.electron.getSettings().then((s) => {
      setTourState({ loaded: true, ...s.productTourStatus })
    })
  }, [])

  const destroyActive = () => {
    if (driverRef.current?.isActive()) driverRef.current.destroy()
    driverRef.current = null
  }

  // Destroy on unmount.
  useEffect(() => () => destroyActive(), [])

  // 1. Welcome — shown on first launch.
  useEffect(() => {
    if (!tourState.loaded || tourState.welcomeSeen) return

    const timer = setTimeout(() => {
      destroyActive()
      const d = driver({
        overlayOpacity: 0.3,
        allowClose: false,
        steps: [{
          element: '#tour-collection-selector',
          popover: {
            title: 'Welcome to Ligeon!',
            description: 'Import a PGN collection to get started — click the library icon.',
            showButtons: ['next'],
            nextBtnText: 'OK',
            showProgress: false,
            side: 'right',
            align: 'start',
          },
        }],
        onDestroyed: () => { driverRef.current = null },
      })
      const next = { welcomeSeen: true, collectionSeen: tourState.collectionSeen, gameSeen: tourState.gameSeen }
      setTourState(prev => ({ ...prev, welcomeSeen: true }))
      void window.electron.updateSettings({ productTourStatus: next })
      driverRef.current = d
      d.drive()
    }, 500)

    return () => clearTimeout(timer)
  }, [tourState.loaded, tourState.welcomeSeen, tourState.collectionSeen, tourState.gameSeen])

  // 2. Collection filter hint — shown when first collection is loaded.
  useEffect(() => {
    if (!tourState.loaded || tourState.collectionSeen) return
    if (selectedCollectionId === null) return
    if (driverRef.current?.isActive()) return

    const timer = setTimeout(() => {
      destroyActive()
      const d = driver({
        overlayOpacity: 0.3,
        allowClose: false,
        steps: [{
          element: '#tour-game-filter',
          popover: {
            title: 'Find Games',
            description: 'Filter and search by player, opening, or result. Select a game to view it.',
            showButtons: ['next'],
            nextBtnText: 'OK',
            showProgress: false,
            side: 'right',
            align: 'start',
          },
        }],
        onDestroyed: () => { driverRef.current = null },
      })
      const next = { welcomeSeen: tourState.welcomeSeen, collectionSeen: true, gameSeen: tourState.gameSeen }
      setTourState(prev => ({ ...prev, collectionSeen: true }))
      void window.electron.updateSettings({ productTourStatus: next })
      driverRef.current = d
      d.drive()
    }, 300)

    return () => clearTimeout(timer)
  }, [tourState.loaded, tourState.welcomeSeen, tourState.collectionSeen, tourState.gameSeen, selectedCollectionId])

  // 3. Controls + navigation + move list — 3-step sequence shown when first game is selected.
  useEffect(() => {
    if (!tourState.loaded || tourState.gameSeen) return
    if (selectedGame === null) return
    if (driverRef.current?.isActive()) return

    const timer = setTimeout(() => {
      destroyActive()
      const d = driver({
        overlayOpacity: 0.3,
        allowClose: false,
        showProgress: false,
        steps: [
          {
            element: '#tour-control-strip',
            popover: {
              title: 'Controls',
              description: 'Flip the board, toggle sound, export to Lichess, and access settings.',
              showButtons: ['next'],
              nextBtnText: 'Next →',
              side: 'left',
              align: 'start',
            },
          },
          {
            element: '#tour-move-navigation',
            popover: {
              title: 'Navigation',
              description: 'Use arrow keys or the buttons to step through moves. Press Play to auto-advance through the game.',
              showButtons: ['previous', 'next'],
              nextBtnText: 'Next →',
              side: 'left',
              align: 'start',
            },
          },
          {
            element: '#tour-move-list',
            popover: {
              title: 'Move List',
              description: 'Click any move to jump to that position. Add comments, annotations (!, ?), and create variations.',
              showButtons: ['previous', 'next'],
              nextBtnText: 'Done',
              side: 'left',
              align: 'start',
            },
          },
        ],
        onDestroyed: () => { driverRef.current = null },
      })
      const next = { welcomeSeen: tourState.welcomeSeen, collectionSeen: tourState.collectionSeen, gameSeen: true }
      setTourState(prev => ({ ...prev, gameSeen: true }))
      void window.electron.updateSettings({ productTourStatus: next })
      driverRef.current = d
      d.drive()
    }, 300)

    return () => clearTimeout(timer)
  }, [tourState.loaded, tourState.welcomeSeen, tourState.collectionSeen, tourState.gameSeen, selectedGame])
}
