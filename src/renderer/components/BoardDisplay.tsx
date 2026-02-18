import { useRef, useEffect } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Key } from '@lichess-org/chessground/types'

interface BoardDisplayProps {
  fen: string
  lastMove?: Key[] | null
  orientation?: 'white' | 'black'
  check?: 'white' | 'black' | false
  dests?: Map<Key, Key[]>
  turnColor?: 'white' | 'black'
  onMove?: (from: string, to: string) => void
  boardSyncKey?: number
}

export default function BoardDisplay({ fen, lastMove, orientation = 'white', check = false, dests, turnColor, onMove, boardSyncKey }: BoardDisplayProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const cgRef = useRef<Api | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  // Initialize Chessground once on mount
  useEffect(() => {
    if (!boardRef.current) return

    cgRef.current = Chessground(boardRef.current, {
      fen,
      orientation,
      turnColor: turnColor ?? 'white',
      coordinates: true,
      animation: {
        enabled: true,
        duration: 300,
      },
      drawable: {
        enabled: true,
        visible: true,
        eraseOnMovablePieceClick: true
      },
      highlight: {
        lastMove: true,
        check: true,
      },
      movable: {
        free: false,
        showDests: true,
        dests: dests ?? undefined,
        color: turnColor ?? 'both',
        events: { after: (from, to) => onMoveRef.current?.(from, to) }
      },
      premovable: {
        enabled: false
      }
    })

    return () => {
      cgRef.current?.destroy()
    }
  }, [])

  // Update board when FEN or lastMove changes
  useEffect(() => {
    if (!cgRef.current) return

    cgRef.current.set({
      fen,
      turnColor: turnColor ?? 'white',
      lastMove: lastMove || undefined,
      orientation,
      check,
      movable: {
        free: false,
        showDests: true,
        dests: dests ?? undefined,
        color: turnColor ?? 'both',
      },
    })
    // boardSyncKey: incremented to force chessground re-sync when board state is stale
  }, [fen, lastMove, orientation, check, dests, turnColor, boardSyncKey])

  return (
    <div
      ref={boardRef}
      className="chessground-board board-appear-animation cursor-pointer"
      data-orientation={orientation}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
