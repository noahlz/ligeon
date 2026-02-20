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
  /** NAG symbol to show as a badge on the board (e.g. "!", "?") */
  annotationGlyph?: string | null
  /** Destination square to place the annotation badge (e.g. "e5") */
  annotationSquare?: string | null
}

export default function BoardDisplay({ fen, lastMove, orientation = 'white', check = false, dests, turnColor, onMove, boardSyncKey, annotationGlyph, annotationSquare }: BoardDisplayProps) {
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

  // Compute badge position from square notation (e.g. "e5")
  let badgeStyle: React.CSSProperties | null = null
  if (annotationGlyph && annotationSquare && annotationSquare.length === 2) {
    const fileIndex = annotationSquare.charCodeAt(0) - 'a'.charCodeAt(0) // 0–7
    const rankIndex = parseInt(annotationSquare[1]) - 1 // 0–7
    const leftPct = orientation === 'white' ? fileIndex * 12.5 : (7 - fileIndex) * 12.5
    const bottomPct = orientation === 'white' ? rankIndex * 12.5 : (7 - rankIndex) * 12.5
    badgeStyle = {
      left: `${leftPct + 7}%`,
      bottom: `${bottomPct + 7}%`,
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={boardRef}
        className="chessground-board board-appear-animation cursor-pointer"
        data-orientation={orientation}
        style={{ width: '100%', height: '100%' }}
      />
      {annotationGlyph && badgeStyle && (
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full bg-black/75 text-white font-bold select-none leading-none"
          style={{
            ...badgeStyle,
            width: '8%',
            height: '8%',
            fontSize: 'clamp(14px, 4.5%, 20px)',
            minWidth: 28,
            minHeight: 28,
          }}
        >
          {annotationGlyph}
        </div>
      )}
    </div>
  )
}
