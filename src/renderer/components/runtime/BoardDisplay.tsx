import { useRef, useEffect } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Key } from '@lichess-org/chessground/types'
import { getNagDescription, getNagSymbol } from '../../utils/nag.js'
import { squareToPercentPosition, badgeContainerLayout } from '../../utils/boardUtils.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

interface BoardDisplayProps {
  fen: string
  lastMove?: Key[] | null
  orientation?: 'white' | 'black'
  check?: 'white' | 'black' | false
  dests?: Map<Key, Key[]>
  turnColor?: 'white' | 'black'
  onMove?: (from: string, to: string) => void
  boardSyncKey?: number
  /** NAG codes to show as badges on the board, ordered: move → position → observation */
  annotationNags?: number[] | null
  /** Destination square to place the annotation badges (e.g. "e5") */
  annotationSquare?: string | null
}

export default function BoardDisplay({ fen, lastMove, orientation = 'white', check = false, dests, turnColor, onMove, boardSyncKey, annotationNags, annotationSquare }: BoardDisplayProps) {
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
  // Intentionally runs once on mount — Chessground is initialized once and
  // updated via cgRef.current.set() in subsequent effects below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Reverse a copy so move annotation (first in sorted order) renders on top (highest z-index).
  // Never mutate the prop array directly.
  const badgeNags = annotationNags ? [...annotationNags].reverse() : []

  // Compute base badge position from square notation (e.g. "e5")
  const pos = (annotationNags?.length && annotationSquare)
    ? squareToPercentPosition(annotationSquare, orientation)
    : null

  // Container spans all badge positions. Badges are positioned within the container
  // using the same stagger offsets (1.5% per badge, expressed as a fraction of
  // container width) so layout is identical to the old per-badge approach.
  // Using a single container as the TooltipTrigger means one shared Tooltip
  // stays open while the pointer is anywhere in the badge group — no blink
  // when moving between overlapping badges.
  const { containerWidthPct, badgeWidthInContainerPct } = badgeContainerLayout(badgeNags.length)

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
          ~30% of badge width (~1.5%) to the right so they mostly overlap.
          All badges share one Tooltip (via a single container trigger) so the
          popover never closes and reopens when hovering between badges. Each
          badge elevates to the foreground on hover via hover:!z-[50]. */}
      {pos && badgeNags.length > 0 && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div
              className="pointer-events-auto absolute cursor-default"
              style={{
                left: `${pos.leftPct + 9}%`,
                bottom: `${pos.bottomPct + 8}%`,
                width: `${containerWidthPct}%`,
                height: '5%',
                minWidth: 22,
                minHeight: 22,
                zIndex: 10,
              }}
            >
              {badgeNags.map((nag, i) => (
                <div
                  key={nag}
                  className="absolute flex items-center justify-center rounded-full bg-zinc-600 text-zinc-100 font-black select-none leading-none ring-3 ring-zinc-800 shadow-lg hover:!z-[50]"
                  style={{
                    left: `${(i * 1.5 / containerWidthPct) * 100}%`,
                    top: 0,
                    width: `${badgeWidthInContainerPct}%`,
                    height: '100%',
                    fontSize: 'clamp(20px, 5.2%, 24px)',
                    minWidth: 22,
                    minHeight: 22,
                    zIndex: i,
                  }}
                >
                  {getNagSymbol(nag)}
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex flex-col gap-1">
            {badgeNags.map(n => (
              <div key={n} className="flex items-center gap-2">
                <span className="font-black w-6 text-center">{getNagSymbol(n)}</span>
                <span>{getNagDescription(n)}</span>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
