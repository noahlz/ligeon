import { Fragment, useRef, useEffect, useState, useCallback, useMemo } from 'react'
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'
import { CommentRow } from './CommentRow.js'
import { VariationRow } from './VariationRow.js'

export interface CommentHandlers {
  comments?: CommentData[]
  editingPly?: number | null
  editValue?: string
  onEdit?: (ply: number) => void
  onValueChange?: (value: string) => void
  onSave?: () => void
  onCancel?: () => void
  onDeleteRequest?: (ply: number) => void
  variationComments?: Map<number, CommentData>
  onSaveVariationComment?: (variationId: number, text: string) => void
  onDeleteVariationComment?: (variationId: number) => void
}

interface MoveListProps {
  moves: string[]
  result: string | null
  currentPly: number
  onJump: (ply: number) => void
  variations?: VariationData[]
  activeVariationBranchPly?: number | null
  activeVariationId?: number | null
  variationMoves?: string[]
  variationPly?: number
  onVariationJump?: (id: number, branchPly: number, ply: number) => void
  onDismissVariation?: (id: number) => void
  onReorderVariations?: (branchPly: number, orderedIds: number[]) => void
  isInVariation?: boolean
  commentHandlers?: CommentHandlers
}

export default function MoveList({
  moves, result, currentPly, onJump,
  variations, activeVariationBranchPly, activeVariationId, variationMoves,
  variationPly, onVariationJump, onDismissVariation, onReorderVariations, isInVariation,
  commentHandlers,
}: MoveListProps) {
  const {
    comments,
    editingPly: editingCommentPly,
    editValue: editCommentValue,
    onEdit: onCommentEdit,
    onValueChange: onCommentValueChange,
    onSave: onCommentSave,
    onCancel: onCommentCancel,
    onDeleteRequest: onCommentDeleteRequest,
    variationComments,
    onSaveVariationComment,
    onDeleteVariationComment,
  } = commentHandlers ?? {}
  const currentMoveRef = useRef<HTMLTableCellElement>(null)

  // Drag-to-reorder state
  const [draggedVariationId, setDraggedVariationId] = useState<number | null>(null)

  const handleVariationDragStart = useCallback((e: React.DragEvent, id: number) => {
    setDraggedVariationId(id)
    e.dataTransfer.setData('variationId', String(id))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleVariationDragEnd = useCallback(() => {
    // Clear dragging state when drag ends outside a valid drop target
    setDraggedVariationId(null)
  }, [])

  const handleVariationDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleVariationDrop = useCallback((e: React.DragEvent, targetId: number, branchPly: number) => {
    e.preventDefault()
    const sourceId = parseInt(e.dataTransfer.getData('variationId'), 10)
    if (isNaN(sourceId) || sourceId <= 0 || sourceId === targetId || !variations || !onReorderVariations) return
    const plyVariations = variations.filter(v => v.branchPly === branchPly)
    const sourceIdx = plyVariations.findIndex(v => v.id === sourceId)
    const targetIdx = plyVariations.findIndex(v => v.id === targetId)
    if (sourceIdx === -1 || targetIdx === -1) return
    const reordered = [...plyVariations]
    reordered.splice(sourceIdx, 1)
    reordered.splice(targetIdx, 0, plyVariations[sourceIdx])
    onReorderVariations(branchPly, reordered.map(v => v.id!))
    setDraggedVariationId(null)
  }, [variations, onReorderVariations])

  // Track which ply has the comment trigger icon visible (hover / right-click)
  const [commentMenuPly, setCommentMenuPly] = useState<number | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track which plies have their comment row collapsed (hidden).
  // All comments start collapsed; seenPliesRef ensures each ply is only initialized once.
  const [collapsedCommentPlies, setCollapsedCommentPlies] = useState<Set<number>>(new Set())
  const seenPliesRef = useRef<Set<number>>(new Set())
  // Tracks the ply of a comment the user just created — exempt from auto-collapse.
  const justCreatedPlyRef = useRef<number | null>(null)

  // Collapse any newly seen comment plies (runs on initial load and when comments change)
  useEffect(() => {
    if (!comments || comments.length === 0) return
    const newPlies: number[] = []
    comments.forEach(c => {
      if (!seenPliesRef.current.has(c.ply)) {
        newPlies.push(c.ply)
        seenPliesRef.current.add(c.ply)
      }
    })
    // Don't collapse a ply the user just created — leave it visible.
    const justCreated = justCreatedPlyRef.current
    justCreatedPlyRef.current = null
    const toCollapse = newPlies.filter(p => p !== justCreated)
    if (toCollapse.length > 0) {
      setCollapsedCommentPlies(prev => new Set([...prev, ...toCollapse]))
    }
  }, [comments])

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const handleCollapseComment = useCallback((ply: number) => {
    setCollapsedCommentPlies(prev => new Set([...prev, ply]))
  }, [])

  const handleExpandComment = useCallback((ply: number) => {
    setCollapsedCommentPlies(prev => {
      const s = new Set(prev)
      s.delete(ply)
      return s
    })
  }, [])

  const handleMoveMouseEnter = useCallback((ply: number) => {
    clearHideTimer()
    clearHoverTimer()
    hoverTimerRef.current = setTimeout(() => setCommentMenuPly(ply), 150)
  }, [clearHoverTimer, clearHideTimer])

  const handleMoveMouseLeave = useCallback(() => {
    clearHoverTimer()
    hideTimerRef.current = setTimeout(() => setCommentMenuPly(null), 600)
  }, [clearHoverTimer])

  const handleMoveContextMenu = useCallback((e: React.MouseEvent, ply: number) => {
    e.preventDefault()
    clearHoverTimer()
    setCommentMenuPly(ply)
  }, [clearHoverTimer])

  // Navigate to the ply and open its comment editor.
  // Skip navigation (and its associated move sound) if already at this ply on the mainline.
  const handleCommentEdit = useCallback((ply: number) => {
    if (ply !== currentPly || isInVariation) onJump(ply)
    onCommentEdit?.(ply)
  }, [onJump, onCommentEdit, currentPly, isInVariation])

  const handleCommentIconClick = useCallback((ply: number) => {
    setCommentMenuPly(null)
    handleCommentEdit(ply)
  }, [handleCommentEdit])

  // Intercept save to detect brand-new comment saves (no existing comment at that ply).
  const handleCommentSaveInternal = useCallback(() => {
    if (editingCommentPly != null && !comments?.some(c => c.ply === editingCommentPly)) {
      justCreatedPlyRef.current = editingCommentPly
    }
    onCommentSave?.()
  }, [editingCommentPly, comments, onCommentSave])

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveRef.current) {
      currentMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentPly, variationPly])

  // Clean up timers on unmount
  useEffect(() => () => { clearHoverTimer(); clearHideTimer() }, [clearHoverTimer, clearHideTimer])

  const movePairs = groupMovesIntoPairs(moves)

  // O(1) ply lookup instead of O(n) find on every render cell
  const commentsByPly = useMemo(() => {
    const map = new Map<number, CommentData>()
    comments?.forEach(c => map.set(c.ply, c))
    return map
  }, [comments])

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
    const comment = commentsByPly.get(ply)
    const hasComment = !!comment
    const isCollapsed = collapsedCommentPlies.has(ply)
    // Trigger icon only for moves WITHOUT a comment — comment icon handles the rest
    const showTriggerIcon = commentMenuPly === ply && !editingCommentPly && !hasComment

    // Icon button for existing comment — always visible, toggles collapse
    const commentIcon = hasComment ? (
      isCollapsed ? (
        // Collapsed: tooltip previews the comment text
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={e => { e.stopPropagation(); handleExpandComment(ply) }}
              className="text-white/70 hover:text-white p-0.5 cursor-pointer shrink-0"
              title="Expand comment"
            >
              <MessageSquareMore size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="max-w-48 italic">{comment.text}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // Expanded: click collapses
        <button
          onClick={e => { e.stopPropagation(); handleCollapseComment(ply) }}
          className="text-white/70 hover:text-white p-0.5 cursor-pointer shrink-0"
          title="Collapse comment"
        >
          <MessageSquareMore size={14} />
        </button>
      )
    ) : null

    // Hover/right-click triggered icon — only for moves with no comment
    const triggerIcon = showTriggerIcon ? (
      <button
        onClick={e => { e.stopPropagation(); handleCommentIconClick(ply) }}
        className="text-white/50 hover:text-ui-accent p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95"
        title="Add comment"
      >
        <MessageSquareMore size={14} />
      </button>
    ) : null

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
        <span className="flex items-center w-full">
          <span className="flex-1">{san || ''}</span>
          {/* Fixed-width slot so the column never resizes when the icon appears */}
          <span className="w-5 shrink-0 flex items-center justify-end">
            {commentIcon ?? triggerIcon}
          </span>
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

            const commentOnWhite = commentsByPly.get(whitePly1)
            const commentOnBlack = commentsByPly.get(blackPly1)
            const editingWhite = editingCommentPly === whitePly1
            const editingBlack = editingCommentPly === blackPly1

            // CommentRow renders only when: (comment or editing) AND not collapsed
            const whiteCommentWillRender = (!!commentOnWhite || editingWhite) && !collapsedCommentPlies.has(whitePly1)

            // Split the row only when something actually renders between white and black
            const hasSplitAfterWhite = variationsAfterWhite.length > 0 || whiteCommentWillRender

            const commentCallbacks = {
              onEdit: handleCommentEdit,
              onValueChange: onCommentValueChange ?? (() => {}),
              onSave: handleCommentSaveInternal,
              onCancel: onCommentCancel ?? (() => {}),
              onDeleteRequest: onCommentDeleteRequest ?? (() => {}),
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
                {whiteCommentWillRender && (
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
                    key={`sl-${sl.id ?? sl.branchPly}`}
                    variation={sl}
                    isActive={activeVariationBranchPly === sl.branchPly && activeVariationId === sl.id}
                    variationMoves={activeVariationBranchPly === sl.branchPly && activeVariationId === sl.id ? variationMoves : undefined}
                    variationPly={variationPly}
                    onVariationJump={onVariationJump}
                    onDismiss={onDismissVariation}
                    isInVariation={isInVariation}
                    comment={sl.id != null ? variationComments?.get(sl.id) : undefined}
                    onSaveComment={onSaveVariationComment}
                    onDeleteComment={onDeleteVariationComment}
                    onDragStart={onReorderVariations ? handleVariationDragStart : undefined}
                    onDragOver={onReorderVariations ? handleVariationDragOver : undefined}
                    onDrop={onReorderVariations ? (e, id) => handleVariationDrop(e, id, sl.branchPly) : undefined}
                    onDragEnd={onReorderVariations ? handleVariationDragEnd : undefined}
                    isDragging={draggedVariationId === sl.id}
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
                {(commentOnBlack || editingBlack) && !collapsedCommentPlies.has(blackPly1) && (
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
                    key={`sl-${sl.id ?? sl.branchPly}`}
                    variation={sl}
                    isActive={activeVariationBranchPly === sl.branchPly && activeVariationId === sl.id}
                    variationMoves={activeVariationBranchPly === sl.branchPly && activeVariationId === sl.id ? variationMoves : undefined}
                    variationPly={variationPly}
                    onVariationJump={onVariationJump}
                    onDismiss={onDismissVariation}
                    isInVariation={isInVariation}
                    comment={sl.id != null ? variationComments?.get(sl.id) : undefined}
                    onSaveComment={onSaveVariationComment}
                    onDeleteComment={onDeleteVariationComment}
                    onDragStart={onReorderVariations ? handleVariationDragStart : undefined}
                    onDragOver={onReorderVariations ? handleVariationDragOver : undefined}
                    onDrop={onReorderVariations ? (e, id) => handleVariationDrop(e, id, sl.branchPly) : undefined}
                    onDragEnd={onReorderVariations ? handleVariationDragEnd : undefined}
                    isDragging={draggedVariationId === sl.id}
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
