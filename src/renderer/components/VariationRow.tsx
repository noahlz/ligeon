import { useEffect, useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import {
  parseVariationMoves,
  variationMoveNumber,
  isVariationWhiteMove,
} from '../utils/variationFormatter.js'
import type { VariationData } from '../../shared/types/game.js'
import { TableRow, TableCell } from '@/components/ui/table.js'

export interface VariationRowProps {
  variation: VariationData
  isActive: boolean
  variationMoves?: string[]
  variationPly?: number
  onVariationJump?: (branchPly: number, ply: number) => void
  onDismiss?: (branchPly: number) => void
  isInVariation?: boolean
}

export function VariationRow({
  variation,
  isActive,
  variationMoves: activeVariationMoves,
  variationPly,
  onVariationJump,
  onDismiss,
  isInVariation,
}: VariationRowProps) {
  const [expanded, setExpanded] = useState(false)

  // Auto-expand when variation becomes active (user clicked into it).
  // Unlike `isActive || expanded`, this lets the user still collapse via chevron.
  useEffect(() => {
    if (isActive) setExpanded(true)
  }, [isActive])

  // Use live activeVariationMoves if this variation is active (may include new moves not yet persisted).
  // Otherwise fall back to the persisted variation.moves from the database.
  const moves = isActive && activeVariationMoves
    ? activeVariationMoves
    : parseVariationMoves(variation.moves)

  if (moves.length === 0) return null

  const firstIsWhite = isVariationWhiteMove(variation.branchPly, 0)
  const moveNum = variationMoveNumber(variation.branchPly, 0)
  const collapsedPrefix = `${moveNum}.${firstIsWhite ? '' : '..'} `

  // Show full accent border when in variation but no move is highlighted
  const showAccentBorder = isActive && isInVariation && (!variationPly || variationPly === 0)
  const containerClass = showAccentBorder
    ? 'ml-4 border-2 border-ui-accent bg-ui-bg-page rounded-sm my-0.5'
    : 'ml-4 border-l-2 border-ui-accent bg-ui-bg-page rounded-r-sm my-0.5'

  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={3} className="p-0 border-0">
        <div className={containerClass}>
          {/* Header row: toggle + first move preview + dismiss */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 ${!expanded ? 'cursor-pointer hover:bg-ui-bg-hover' : ''}`}
            onClick={!expanded ? () => setExpanded(true) : undefined}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer"
            >
              {expanded
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </button>

            {!expanded && (
              <span className="text-sm text-ui-text-dimmer italic truncate flex-1">
                {collapsedPrefix}{moves.slice(0, 3).join(' ')}{moves.length > 3 ? '…' : ''}
              </span>
            )}

            {expanded && <span className="flex-1" />}

            <button
              onClick={(e) => { e.stopPropagation(); onDismiss?.(variation.branchPly) }}
              className="text-ui-text-dimmer hover:text-red-400 p-0.5 cursor-pointer"
              title="Dismiss variation"
            >
              <X size={12} />
            </button>
          </div>

          {/* Expanded moves */}
          {expanded && (
            <div className="flex flex-wrap gap-x-1 gap-y-0 px-2 pb-1 font-mono text-sm">
              {moves.map((move, i) => {
                const isWhite = isVariationWhiteMove(variation.branchPly, i)
                const moveNum = variationMoveNumber(variation.branchPly, i)
                const ply = i + 1
                const isCurrent = isInVariation && isActive && variationPly === ply

                return (
                  <span key={i} className="inline-flex items-center">
                    {/* Show move number before white moves, or before first move if black */}
                    {(isWhite || i === 0) && (
                      <span className="text-ui-text-dimmer mr-0.5">
                        {moveNum}.{!isWhite && '..'}
                      </span>
                    )}
                    <span
                      onClick={() => onVariationJump?.(variation.branchPly, ply)}
                      className={`px-1 rounded cursor-pointer hover:bg-ui-bg-hover ${
                        isCurrent ? 'bg-ui-accent text-white font-bold' : ''
                      }`}
                    >
                      {move}
                    </span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
