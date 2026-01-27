import { useRef, useEffect } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Key } from '@lichess-org/chessground/types'

interface BoardDisplayProps {
  fen: string
  lastMove?: Key[] | null
  orientation?: 'white' | 'black'
  check?: boolean
}

export default function BoardDisplay({ fen, lastMove, orientation = 'white', check = false }: BoardDisplayProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const cgRef = useRef<Api | null>(null)

  // Initialize Chessground once on mount
  useEffect(() => {
    if (!boardRef.current) return

    cgRef.current = Chessground(boardRef.current, {
      fen,
      orientation,
      viewOnly: true,
      coordinates: true,
      animation: {
        enabled: true,
        duration: 300,
      },
      drawable: {
        visible: false,
      },
      highlight: {
        check: true,
      },
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
      lastMove: lastMove || undefined,
      orientation,
      check,
    })
  }, [fen, lastMove, orientation, check])

  return (
    <div
      ref={boardRef}
      className="chessground-board"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
