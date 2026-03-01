import { useRef, useCallback, useEffect } from 'react'
import { driver } from 'driver.js'
import '../styles/tour.css'
import type { Driver } from 'driver.js'
import type { GameRow } from '../../shared/types/game.js'
import { markTourSeen } from '../utils/tourUtils.js'

export interface UseTourReturn {
  startTour: () => void
}

/**
 * Manages the Driver.js guided tour instance.
 *
 * - Steps 1 and 2 auto-advance when the user loads a collection or selects a game.
 * - Steps 3 and 4 require the user to click Next/Done.
 * - onDestroyed marks the tour as seen in localStorage regardless of
 *   whether the user completed or dismissed it.
 */
export function useTour(
  selectedCollectionId: string | null,
  selectedGame: GameRow | null,
): UseTourReturn {
  const driverRef = useRef<Driver | null>(null)

  // Hold current state in refs for use inside startTour callback.
  const collectionIdRef = useRef(selectedCollectionId)
  const selectedGameRef = useRef(selectedGame)
  useEffect(() => { collectionIdRef.current = selectedCollectionId }, [selectedCollectionId])
  useEffect(() => { selectedGameRef.current = selectedGame }, [selectedGame])

  // Destroy any active tour when the component unmounts to release DOM listeners.
  useEffect(() => {
    return () => {
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy()
      }
    }
  }, [])

  const startTour = useCallback(() => {
    // Prevent double-start (e.g. React strict-mode double-effect fire in dev).
    if (driverRef.current?.isActive()) return

    // Determine starting step based on what state already exists.
    let startStep = 0
    if (collectionIdRef.current !== null && selectedGameRef.current !== null) {
      startStep = 2
    } else if (collectionIdRef.current !== null) {
      startStep = 1
    }

    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#tour-collection-selector',
          popover: {
            title: 'Welcome to Ligeon!',
            description: 'Import a PGN collection to get started — click the library icon.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-game-filter',
          popover: {
            title: 'Find Games',
            description: 'Filter and search by player, opening, or result. Select a game to view it.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-move-list',
          popover: {
            title: 'Move List',
            description: 'Click any move to jump to that position. Add comments, annotations (!, ?), and create variations.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-control-strip',
          popover: {
            title: 'Controls',
            description: 'Flip the board, toggle sound, export to Lichess, and access settings.',
            side: 'left',
            align: 'start',
          },
        },
      ],
      onDestroyed: () => {
        markTourSeen()
        driverRef.current = null
      },
    })

    driverRef.current = driverObj
    driverObj.drive(startStep)
  }, [])

  // Auto-advance step 0 → 1 when a collection is loaded.
  // Reads the live step index from the driver to avoid desync if the user clicks Next/Prev manually.
  useEffect(() => {
    const d = driverRef.current
    if (d?.isActive() && d.getActiveIndex() === 0 && selectedCollectionId !== null) {
      d.moveNext()
    }
  }, [selectedCollectionId])

  // Auto-advance step 1 → 2 when a game is selected.
  useEffect(() => {
    const d = driverRef.current
    if (d?.isActive() && d.getActiveIndex() === 1 && selectedGame !== null) {
      d.moveNext()
    }
  }, [selectedGame])

  return { startTour }
}