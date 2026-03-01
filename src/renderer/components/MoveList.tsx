import { Fragment, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { getResultDisplay } from '../utils/chessManager.js'
import { groupMovesIntoPairs, pairIndexToPly, isCurrentMove } from '../utils/moveFormatter.js'
import { getVariationsAtPly } from '../utils/variationFormatter.js'
import type { VariationData, CommentData, AnnotationData } from '../../shared/types/game.js'
import { groupAnnotationsByPly } from '../hooks/useAnnotationState.js'
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table.js'
import { CommentRow } from './CommentRow.js'
import { VariationRow } from './VariationRow.js'
import { MoveCell } from './MoveCell.js'
import type { MoveCellCommentCallbacks, MoveCellAnnotationCallbacks } from './MoveCell.js'

interface CommentHandlers {
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
  annotationHandlers?: AnnotationHandlers
}

interface AnnotationHandlers {
  annotations?: AnnotationData[]
  onSetAnnotation?: (ply: number, nag: number) => void
  onRemoveAnnotation?: (ply: number, nag: number) => void
}

export default function MoveList({
  moves, result, currentPly, onJump,
  variations, activeVariationBranchPly, activeVariationId, variationMoves,
  variationPly, onVariationJump, onDismissVariation, onReorderVariations, isInVariation,
  commentHandlers,
  annotationHandlers,
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

  // Track which ply has its annotation Popover open
  const [annotationMenuPly, setAnnotationMenuPly] = useState<number | null>(null)
  // When navigating via annotation click, hold the ply so the useEffect re-opens the popover
  const pendingAnnotationPlyRef = useRef<number | null>(null)

  // O(1) ply lookup for annotations (array per ply — multiple NAGs allowed)
  const annotationsByPly = useMemo(
    () => groupAnnotationsByPly(annotationHandlers?.annotations ?? []),
    [annotationHandlers?.annotations]
  )

  // Close annotation Popover when navigating — unless navigation was triggered by annotation click
  useEffect(() => {
    if (pendingAnnotationPlyRef.current !== null) {
      const ply = pendingAnnotationPlyRef.current
      pendingAnnotationPlyRef.current = null
      setAnnotationMenuPly(ply)
      return
    }
    setAnnotationMenuPly(null)
  }, [currentPly])

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

  const handleMoveMouseLeave = useCallback((ply: number) => {
    clearHoverTimer()
    hideTimerRef.current = setTimeout(() => {
      if (annotationMenuPly !== ply) setCommentMenuPly(null)
    }, 600)
  }, [clearHoverTimer, annotationMenuPly])

  const handleAnnotationTriggerClick = useCallback((e: React.MouseEvent, ply: number) => {
    e.stopPropagation()
    if (ply !== currentPly || isInVariation) {
      pendingAnnotationPlyRef.current = ply
      onJump(ply)
    }
    setAnnotationMenuPly(prev => prev === ply ? null : ply)
    setCommentMenuPly(ply)
    clearHideTimer()
  }, [clearHideTimer, onJump, currentPly, isInVariation])

  const handleAnnotationPopoverClose = useCallback(() => {
    setAnnotationMenuPly(null)
    // Clear hover state — it restores on the next mouse movement inside the cell,
    // preventing the buttons from flashing into view on a click with no movement.
    setCommentMenuPly(null)
  }, [])

  // Restore hover state after a popover close cleared it.
  // Using mousemove (not mouseenter) means buttons reappear on movement, not on entry —
  // so a click-to-close without moving the mouse never shows the buttons.
  // Functional updater avoids re-render if already hovered on this ply.
  const handleMoveMouseMove = useCallback((ply: number) => {
    clearHideTimer()
    setCommentMenuPly(prev => prev === ply ? prev : ply)
  }, [clearHideTimer])

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
    setAnnotationMenuPly(null)
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

  const moveCellCommentCallbacks: MoveCellCommentCallbacks = {
    onCommentIconClick: handleCommentIconClick,
    onExpandComment: handleExpandComment,
    onCollapseComment: handleCollapseComment,
    onCancelComment: onCommentCancel,
  }

  const moveCellAnnotationCallbacks: MoveCellAnnotationCallbacks = {
    onAnnotationTriggerClick: handleAnnotationTriggerClick,
    onAnnotationPopoverClose: handleAnnotationPopoverClose,
    onSetAnnotation: annotationHandlers?.onSetAnnotation,
    onRemoveAnnotation: annotationHandlers?.onRemoveAnnotation,
  }

  return (
    <div
      id="tour-move-list"
      className="overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded-sm font-mono text-sm"
      onClick={() => { setCommentMenuPly(null); setAnnotationMenuPly(null) }}
    >
      <Table className="table-fixed">
        <TableBody>
          {movePairs.map((pair, pairIndex) => {
            const whitePly1 = pairIndexToPly(pairIndex, 'white')
            const blackPly1 = pairIndexToPly(pairIndex, 'black')

            const isWhiteCurrent = isCurrentMove(currentPly, whitePly1, !!isInVariation)
            const isBlackCurrent = isCurrentMove(currentPly, blackPly1, !!isInVariation)

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
                  <TableCell className="text-ui-text-dimmer text-right pr-3 w-10 py-0.75 border-0">
                    {pair.moveNumber}.
                  </TableCell>
                  <MoveCell
                    ply={whitePly1}
                    san={pair.white}
                    isCurrent={isWhiteCurrent}
                    refProp={isWhiteCurrent ? currentMoveRef : undefined}
                    comment={commentsByPly.get(whitePly1)}
                    isCollapsed={collapsedCommentPlies.has(whitePly1)}
                    annotationNags={(annotationsByPly.get(whitePly1) ?? []).map(a => a.nag)}
                    isHovered={commentMenuPly === whitePly1}
                    isAnnotationOpen={annotationMenuPly === whitePly1}
                    editingCommentPly={editingCommentPly ?? null}
                    onJump={onJump}
                    onMouseEnter={handleMoveMouseEnter}
                    onMouseLeave={handleMoveMouseLeave}
                    onMouseMove={handleMoveMouseMove}
                    onContextMenu={handleMoveContextMenu}
                    commentCallbacks={moveCellCommentCallbacks}
                    annotationCallbacks={moveCellAnnotationCallbacks}
                  />
                  {hasSplitAfterWhite
                    ? <TableCell className="border-0" />
                    : <MoveCell
                        ply={blackPly1}
                        san={pair.black}
                        isCurrent={isBlackCurrent}
                        refProp={isBlackCurrent ? currentMoveRef : undefined}
                        comment={commentsByPly.get(blackPly1)}
                        isCollapsed={collapsedCommentPlies.has(blackPly1)}
                        annotationNags={(annotationsByPly.get(blackPly1) ?? []).map(a => a.nag)}
                        isHovered={commentMenuPly === blackPly1}
                        isAnnotationOpen={annotationMenuPly === blackPly1}
                        editingCommentPly={editingCommentPly ?? null}
                        onJump={onJump}
                        onMouseEnter={handleMoveMouseEnter}
                        onMouseLeave={handleMoveMouseLeave}
                        onMouseMove={handleMoveMouseMove}
                        onContextMenu={handleMoveContextMenu}
                        commentCallbacks={moveCellCommentCallbacks}
                        annotationCallbacks={moveCellAnnotationCallbacks}
                      />
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
                    <MoveCell
                      ply={blackPly1}
                      san={pair.black}
                      isCurrent={isBlackCurrent}
                      refProp={isBlackCurrent ? currentMoveRef : undefined}
                      comment={commentsByPly.get(blackPly1)}
                      isCollapsed={collapsedCommentPlies.has(blackPly1)}
                      annotationNags={(annotationsByPly.get(blackPly1) ?? []).map(a => a.nag)}
                      isHovered={commentMenuPly === blackPly1}
                      isAnnotationOpen={annotationMenuPly === blackPly1}
                      editingCommentPly={editingCommentPly ?? null}
                      onJump={onJump}
                      onMouseEnter={handleMoveMouseEnter}
                      onMouseLeave={handleMoveMouseLeave}
                      onMouseMove={handleMoveMouseMove}
                      onContextMenu={handleMoveContextMenu}
                      commentCallbacks={moveCellCommentCallbacks}
                      annotationCallbacks={moveCellAnnotationCallbacks}
                    />
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
