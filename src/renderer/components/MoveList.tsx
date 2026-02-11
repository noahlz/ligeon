import { Fragment, useRef, useEffect, useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { getResultDisplay } from '../utils/chessManager.js'
import { groupMovesIntoPairs } from '../utils/moveFormatter.js'
import {
  getSidelinesAtPly,
  parseSidelineMoves,
  sidelineMoveNumber,
  isSidelineWhiteMove,
} from '../utils/sidelineFormatter.js'
import type { SidelineData } from '../../shared/types/game.js'
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table.js'

interface MoveListProps {
  moves: string[]
  result: string | null
  currentPly: number
  onJump: (ply: number) => void
  sidelines?: SidelineData[]
  activeSidelineBranchPly?: number | null
  sidelineMoves?: string[]
  sidelinePly?: number
  onSidelineJump?: (ply: number) => void
  onDismissSideline?: (branchPly: number) => void
  isInSideline?: boolean
}

function SidelineRow({
  sideline,
  isActive,
  sidelineMoves: activeSidelineMoves,
  sidelinePly,
  onSidelineJump,
  onDismiss,
  isInSideline,
}: {
  sideline: SidelineData
  isActive: boolean
  sidelineMoves?: string[]
  sidelinePly?: number
  onSidelineJump?: (ply: number) => void
  onDismiss?: (branchPly: number) => void
  isInSideline?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  // Active sidelines are always expanded so user can see their current position.
  const isExpanded = isActive || expanded

  // Use live activeSidelineMoves if this sideline is active (may include new moves not yet persisted).
  // Otherwise fall back to the persisted sideline.moves from the database.
  const moves = isActive && activeSidelineMoves
    ? activeSidelineMoves
    : parseSidelineMoves(sideline.moves)

  if (moves.length === 0) return null

  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={3} className="p-0 border-0">
        <div className="ml-4 border-l-2 border-ui-accent bg-ui-bg-page rounded-r-sm my-0.5">
          {/* Header row: toggle + first move preview + dismiss */}
          <div className="flex items-center gap-1 px-2 py-0.5">
            <button
              onClick={() => setExpanded(!isExpanded)}
              className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer"
            >
              {isExpanded
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </button>

            {!isExpanded && (
              <span className="text-sm text-ui-text-dim truncate flex-1">
                {moves.slice(0, 3).join(' ')}{moves.length > 3 ? '…' : ''}
              </span>
            )}

            {isExpanded && <span className="flex-1" />}

            <button
              onClick={() => onDismiss?.(sideline.branchPly)}
              className="text-ui-text-dimmer hover:text-red-400 p-0.5 cursor-pointer"
              title="Dismiss sideline"
            >
              <X size={12} />
            </button>
          </div>

          {/* Expanded moves */}
          {isExpanded && (
            <div className="flex flex-wrap gap-x-1 gap-y-0 px-2 pb-1 font-mono text-sm">
              {moves.map((move, i) => {
                const isWhite = isSidelineWhiteMove(sideline.branchPly, i)
                const moveNum = sidelineMoveNumber(sideline.branchPly, i)
                const ply = i + 1
                const isCurrent = isInSideline && isActive && sidelinePly === ply

                return (
                  <span key={i} className="inline-flex items-center">
                    {/* Show move number before white moves, or before first move if black */}
                    {(isWhite || i === 0) && (
                      <span className="text-ui-text-dimmer mr-0.5">
                        {moveNum}.{!isWhite && '..'}
                      </span>
                    )}
                    <span
                      onClick={() => onSidelineJump?.(ply)}
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

export default function MoveList({
  moves, result, currentPly, onJump,
  sidelines, activeSidelineBranchPly, sidelineMoves,
  sidelinePly, onSidelineJump, onDismissSideline, isInSideline,
}: MoveListProps) {
  const currentMoveRef = useRef<HTMLTableCellElement>(null)

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveRef.current) {
      currentMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [currentPly, sidelinePly])

  const movePairs = groupMovesIntoPairs(moves)

  return (
    <div className="overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded-sm font-mono">
      <Table>
        <TableBody>
          {movePairs.map((pair, pairIndex) => {
            const whitePly = pairIndex * 2
            const blackPly = pairIndex * 2 + 1
            const isWhiteCurrent = !isInSideline && currentPly - 1 === whitePly
            const isBlackCurrent = !isInSideline && currentPly - 1 === blackPly

            // Find sidelines that branch after white's move or after black's move
            const sidelinesAfterWhite = sidelines
              ? getSidelinesAtPly(sidelines, whitePly + 1)
              : []
            const sidelinesAfterBlack = sidelines
              ? getSidelinesAtPly(sidelines, blackPly + 1)
              : []

            return (
              <Fragment key={pairIndex}>
                <TableRow className="border-0 hover:bg-transparent">
                  {/* Move number */}
                  <TableCell className="text-ui-text-dimmer text-right pr-2 w-8 py-0.75 border-0">
                    {pair.moveNumber}.
                  </TableCell>

                  {/* White move */}
                  <TableCell
                    ref={isWhiteCurrent ? currentMoveRef : null}
                    onClick={() => onJump(whitePly + 1)}
                    className={`px-2 py-0.5 rounded cursor-pointer hover:bg-ui-bg-hover border-0 text-lg ${
                      isWhiteCurrent ? 'bg-ui-accent text-white font-bold' : ''
                    }`}
                  >
                    {pair.white}
                  </TableCell>

                  {/* Black move */}
                  <TableCell
                    ref={isBlackCurrent ? currentMoveRef : null}
                    onClick={pair.black ? () => onJump(blackPly + 1) : undefined}
                    className={`px-2 py-0.5 rounded border-0 text-lg ${
                      pair.black ? 'cursor-pointer hover:bg-ui-bg-hover' : ''
                    } ${isBlackCurrent ? 'bg-ui-accent text-white font-bold' : ''}`}
                  >
                    {pair.black || ''}
                  </TableCell>
                </TableRow>

                {/* Sidelines branching after white's move */}
                {sidelinesAfterWhite.map(sl => (
                  <SidelineRow
                    key={`sl-${sl.branchPly}`}
                    sideline={sl}
                    isActive={activeSidelineBranchPly === sl.branchPly}
                    sidelineMoves={activeSidelineBranchPly === sl.branchPly ? sidelineMoves : undefined}
                    sidelinePly={sidelinePly}
                    onSidelineJump={onSidelineJump}
                    onDismiss={onDismissSideline}
                    isInSideline={isInSideline}
                  />
                ))}

                {/* Sidelines branching after black's move */}
                {sidelinesAfterBlack.map(sl => (
                  <SidelineRow
                    key={`sl-${sl.branchPly}`}
                    sideline={sl}
                    isActive={activeSidelineBranchPly === sl.branchPly}
                    sidelineMoves={activeSidelineBranchPly === sl.branchPly ? sidelineMoves : undefined}
                    sidelinePly={sidelinePly}
                    onSidelineJump={onSidelineJump}
                    onDismiss={onDismissSideline}
                    isInSideline={isInSideline}
                  />
                ))}
              </Fragment>
            )
          })}

          {result && (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={3} className="text-center py-2 text-sm font-bold border-0">
                Result: {getResultDisplay(result)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
