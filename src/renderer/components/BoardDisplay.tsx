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
  /** NAG symbols to show as badges on the board, ordered: move → position → observation */
  annotationGlyphs?: string[] | null
  /** Destination square to place the annotation badges (e.g. "e5") */
  annotationSquare?: string | null
}

export default function BoardDisplay({ fen, lastMove, orientation = 'white', check = false, dests, turnColor, onMove, boardSyncKey, annotationGlyphs, annotationSquare }: BoardDisplayProps) {
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

  // Compute base badge position from square notation (e.g. "e5")
  let baseBadgePos: { leftPct: number; bottomPct: number } | null = null
  if (annotationGlyphs?.length && annotationSquare && annotationSquare.length === 2) {
    const fileIndex = annotationSquare.charCodeAt(0) - 'a'.charCodeAt(0) // 0–7
    const rankIndex = parseInt(annotationSquare[1]) - 1 // 0–7
    baseBadgePos = {
      leftPct: orientation === 'white' ? fileIndex * 12.5 : (7 - fileIndex) * 12.5,
      bottomPct: orientation === 'white' ? rankIndex * 12.5 : (7 - rankIndex) * 12.5,
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
      {/* Annotation badges: intentional exception to the flex-only layout rule.
          Chessground renders no individual square DOM elements — the board is a
          single canvas/SVG. We overlay badges using absolute positioning over
          a `position: relative` wrapper, computing percentage offsets from file
          and rank indices. The +9%/+8% base offsets position the first badge at
          the upper-right corner of the target piece. Multiple badges are staggered
          ~30% of badge width (~1.5%) to the right so they mostly overlap. */}
      {baseBadgePos && annotationGlyphs?.map((glyph, i) => (
        <div
          key={glyph}
          className="pointer-events-none absolute flex items-center justify-center rounded-full bg-zinc-600 text-zinc-100 font-black select-none leading-none ring-3 ring-zinc-800 shadow-lg"
          style={{
            left: `${baseBadgePos!.leftPct + 9 + i * 1.5}%`,
            bottom: `${baseBadgePos!.bottomPct + 8}%`,
            width: '5%',
            height: '5%',
            fontSize: 'clamp(20px, 5.2%, 24px)',
            minWidth: 22,
            minHeight: 22,
            zIndex: 10 + i,
          }}
        >
          {glyph}
        </div>
      ))}
    </div>
  )
}
