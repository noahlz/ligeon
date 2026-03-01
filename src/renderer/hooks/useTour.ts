import { useRef, useEffect } from 'react'
import { driver } from 'driver.js'
import '../styles/tour.css'
import type { Driver } from 'driver.js'
import type { GameRow } from '../../shared/types/game.js'
import {
  shouldShowWelcome,
  markWelcomeSeen,
  shouldShowCollectionTour,
  markCollectionTourSeen,
  shouldShowGameTour,
  markGameTourSeen,
} from '../utils/tourUtils.js'

/**
 * Fires three independent contextual tour popovers based on app state:
 *
 * 1. On mount — welcome + import instructions (floating, no highlight)
 * 2. When selectedCollectionId becomes non-null — game filter hint
 * 3. When selectedGame becomes non-null — 2-step controls + move list sequence
 *
 * Each trigger fires at most once per install (localStorage gate).
 * In dev mode all three always fire.
 */
export function useTour(
  selectedCollectionId: string | null,
  selectedGame: GameRow | null,
): void {
  const driverRef = useRef<Driver | null>(null)

  const destroyActive = () => {
    if (driverRef.current?.isActive()) driverRef.current.destroy()
    driverRef.current = null
  }

  // Destroy on unmount.
  useEffect(() => () => destroyActive(), [])

  // 1. Welcome — shown on first launch.
  useEffect(() => {
    if (!shouldShowWelcome(import.meta.env.DEV)) return

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
        onDestroyed: () => { markWelcomeSeen(); driverRef.current = null },
      })
      driverRef.current = d
      d.drive()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // 2. Collection filter hint — shown when first collection is loaded.
  useEffect(() => {
    if (selectedCollectionId === null) return
    if (!shouldShowCollectionTour(import.meta.env.DEV)) return
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
        onDestroyed: () => { markCollectionTourSeen(); driverRef.current = null },
      })
      driverRef.current = d
      d.drive()
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedCollectionId])

  // 3. Controls + move list — 2-step sequence shown when first game is selected.
  useEffect(() => {
    if (selectedGame === null) return
    if (!shouldShowGameTour(import.meta.env.DEV)) return
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
        onDestroyed: () => { markGameTourSeen(); driverRef.current = null },
      })
      driverRef.current = d
      d.drive()
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedGame])
}
