import { Fragment, useRef, useEffect, useState, useCallback } from 'react'
import { MessageSquareMore } from 'lucide-react'
import { getResultDisplay } from '../utils/chessManager.js'
import { groupMovesIntoPairs } from '../utils/moveFormatter.js'
import { getVariationsAtPly } from '../utils/variationFormatter.js'
import type { VariationData, CommentData } from '../../shared/types/game.js'
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table.js'
import { CommentRow } from './CommentRow.js'
import { VariationRow } from './VariationRow.js'

interface MoveListProps {
  moves: string[]
  result: string | null
  currentPly: number
  onJump: (ply: number) => void
  variations?: VariationData[]
  activeVariationBranchPly?: number | null
  variationMoves?: string[]
  variationPly?: number
  onVariationJump?: (branchPly: number, ply: number) => void
  onDismissVariation?: (branchPly: number) => void
  isInVariation?: boolean
  // Comments
  comments?: CommentData[]
  editingCommentPly?: number | null
  editCommentValue?: string
  onCommentEdit?: (ply: number) => void
  onCommentValueChange?: (value: string) => void
  onCommentSave?: () => void
  onCommentCancel?: () => void
}

export default function MoveList({
  moves, result, currentPly, onJump,
  variations, activeVariationBranchPly, variationMoves,
  variationPly, onVariationJump, onDismissVariation, isInVariation,
  comments, editingCommentPly, editCommentValue,
  onCommentEdit, onCommentValueChange, onCommentSave, onCommentCancel,
}: MoveListProps) {
  const currentMoveRef = useRef<HTMLTableCellElement>(null)

  // Track which ply has the comment trigger icon visible (hover 2s / right-click)
  const [commentMenuPly, setCommentMenuPly] = useState<number | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const handleMoveMouseEnter = useCallback((ply: number) => {
    clearHoverTimer()
    hoverTimerRef.current = setTimeout(() => setCommentMenuPly(ply), 2000)
  }, [clearHoverTimer])

  const handleMoveMouseLeave = useCallback(() => {
    clearHoverTimer()
  }, [clearHoverTimer])

  const handleMoveContextMenu = useCallback((e: React.MouseEvent, ply: number) => {
    e.preventDefault()
    clearHoverTimer()
    setCommentMenuPly(ply)
  }, [clearHoverTimer])

  const handleCommentIconClick = useCallback((ply: number) => {
    setCommentMenuPly(null)
    onCommentEdit?.(ply)
  }, [onCommentEdit])

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveRef.current) {
      currentMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentPly, variationPly])

  // Clean up hover timer on unmount
  useEffect(() => () => clearHoverTimer(), [clearHoverTimer])

  const movePairs = groupMovesIntoPairs(moves)

  const getCommentAtPly = (ply: number): CommentData | undefined =>
    comments?.find(c => c.ply === ply)

  /**
   * Render a move cell with hover/right-click comment trigger.
   * @param ply - 1-based mainline ply
   */
  const renderMoveCell = (
    ply: number,
    san: string | null | undefined,
    isCurrent: boolean,
    refProp?: React.Ref<HTMLTableCellElement>
  ) => {
    const comment = getCommentAtPly(ply)
    // Show trigger icon if this ply has been hovered/right-clicked and no editor is open
    const showTriggerIcon = commentMenuPly === ply && !editingCommentPly
    const hasComment = !!comment

    return (
      <TableCell
        ref={refProp}
        onClick={san ? () => onJump(ply) : undefined}
        onMouseEnter={() => handleMoveMouseEnter(ply)}
        onMouseLeave={handleMoveMouseLeave}
        onContextMenu={e => handleMoveContextMenu(e, ply)}
        className={`px-2 py-0.5 rounded border-0 text-lg ${
          san ? 'cursor-pointer hover:bg-ui-bg-hover' : ''
        } ${isCurrent ? 'bg-ui-accent text-white font-bold' : ''}`}
      >
        <span className="flex items-center gap-1">
          <span>{san || ''}</span>
          {/* Persistent icon for moves that already have a comment */}
          {hasComment && !showTriggerIcon && (
            <button
              onClick={e => { e.stopPropagation(); handleCommentIconClick(ply) }}
              className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer shrink-0"
              title="Edit comment"
            >
              <MessageSquareMore size={11} />
            </button>
          )}
          {/* Hover/right-click triggered icon (add or edit) */}
          {showTriggerIcon && (
            <button
              onClick={e => { e.stopPropagation(); handleCommentIconClick(ply) }}
              className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95"
              title={hasComment ? 'Edit comment' : 'Add comment'}
            >
              <MessageSquareMore size={11} />
            </button>
          )}
        </span>
      </TableCell>
    )
  }

  return (
    <div
      className="overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded-sm font-mono"
      onClick={() => setCommentMenuPly(null)}
    >
      <Table>
        <TableBody>
          {movePairs.map((pair, pairIndex) => {
            const whitePly1 = pairIndex * 2 + 1   // 1-based white ply
            const blackPly1 = pairIndex * 2 + 2   // 1-based black ply
            const whitePly0 = whitePly1 - 1       // 0-based for currentPly comparison
            const blackPly0 = blackPly1 - 1

            const isWhiteCurrent = !isInVariation && currentPly - 1 === whitePly0
            const isBlackCurrent = !isInVariation && currentPly - 1 === blackPly0

            const variationsAfterWhite = variations ? getVariationsAtPly(variations, whitePly1) : []
            const variationsAfterBlack = variations ? getVariationsAtPly(variations, blackPly1) : []

            const commentOnWhite = getCommentAtPly(whitePly1)
            const commentOnBlack = getCommentAtPly(blackPly1)
            const editingWhite = editingCommentPly === whitePly1
            const editingBlack = editingCommentPly === blackPly1

            // Split the row when there's a variation OR comment/editor after white's move
            const hasSplitAfterWhite = variationsAfterWhite.length > 0 || !!commentOnWhite || editingWhite

            const commentCallbacks = {
              onEdit: onCommentEdit ?? (() => {}),
              onValueChange: onCommentValueChange ?? (() => {}),
              onSave: onCommentSave ?? (() => {}),
              onCancel: onCommentCancel ?? (() => {}),
            }

            return (
              <Fragment key={pairIndex}>
                {/* Main row: move number + white + black (or split placeholder) */}
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-ui-text-dimmer text-right pr-2 w-8 py-0.75 border-0">
                    {pair.moveNumber}.
                  </TableCell>
                  {renderMoveCell(whitePly1, pair.white, isWhiteCurrent, isWhiteCurrent ? currentMoveRef : undefined)}
                  {hasSplitAfterWhite
                    ? <TableCell className="border-0" />
                    : renderMoveCell(blackPly1, pair.black, isBlackCurrent, isBlackCurrent ? currentMoveRef : undefined)
                  }
                </TableRow>

                {/* Comment on white's move */}
                {(commentOnWhite || editingWhite) && (
                  <CommentRow
                    ply={whitePly1}
                    comment={commentOnWhite}
                    isEditing={editingWhite}
                    editValue={editCommentValue ?? ''}
                    {...commentCallbacks}
                  />
                )}

                {/* Variations branching after white's move */}
                {variationsAfterWhite.map(sl => (
                  <VariationRow
                    key={`sl-${sl.branchPly}`}
                    variation={sl}
                    isActive={activeVariationBranchPly === sl.branchPly}
                    variationMoves={activeVariationBranchPly === sl.branchPly ? variationMoves : undefined}
                    variationPly={variationPly}
                    onVariationJump={onVariationJump}
                    onDismiss={onDismissVariation}
                    isInVariation={isInVariation}
                  />
                ))}

                {/* Black continuation row (when split by variation or white comment) */}
                {hasSplitAfterWhite && pair.black && (
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell className="text-ui-text-dimmer text-right pr-2 w-8 py-0.75 border-0" />
                    <TableCell className="border-0 py-0.5">
                      <span className="text-ui-text-dimmer">...</span>
                    </TableCell>
                    {renderMoveCell(blackPly1, pair.black, isBlackCurrent, isBlackCurrent ? currentMoveRef : undefined)}
                  </TableRow>
                )}

                {/* Comment on black's move */}
                {(commentOnBlack || editingBlack) && (
                  <CommentRow
                    ply={blackPly1}
                    comment={commentOnBlack}
                    isEditing={editingBlack}
                    editValue={editCommentValue ?? ''}
                    {...commentCallbacks}
                  />
                )}

                {/* Variations branching after black's move */}
                {variationsAfterBlack.map(sl => (
                  <VariationRow
                    key={`sl-${sl.branchPly}`}
                    variation={sl}
                    isActive={activeVariationBranchPly === sl.branchPly}
                    variationMoves={activeVariationBranchPly === sl.branchPly ? variationMoves : undefined}
                    variationPly={variationPly}
                    onVariationJump={onVariationJump}
                    onDismiss={onDismissVariation}
                    isInVariation={isInVariation}
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
