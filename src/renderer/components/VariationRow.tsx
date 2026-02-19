import { useEffect, useState, useRef, useCallback } from 'react'
import { Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import {
  parseVariationMoves,
  variationMoveNumber,
  isVariationWhiteMove,
} from '../utils/variationFormatter.js'
import type { VariationData, CommentData } from '../../shared/types/game.js'
import { TableRow, TableCell } from '@/components/ui/table.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

export interface VariationRowProps {
  variation: VariationData
  isActive: boolean
  variationMoves?: string[]
  variationPly?: number
  onVariationJump?: (id: number, branchPly: number, ply: number) => void
  onDismiss?: (id: number) => void
  isInVariation?: boolean
  comment?: CommentData
  onSaveComment?: (variationId: number, text: string) => void
  onDeleteComment?: (variationId: number) => void
  // Drag-to-reorder props (omit when reorder is not enabled)
  onDragStart?: (e: React.DragEvent, id: number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, id: number) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}

export function VariationRow({
  variation,
  isActive,
  variationMoves: activeVariationMoves,
  variationPly,
  onVariationJump,
  onDismiss,
  isInVariation,
  comment,
  onSaveComment,
  onDeleteComment,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: VariationRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [localValue, setLocalValue] = useState(comment?.text ?? '')
  const [trashVisible, setTrashVisible] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync localValue when the saved comment changes (e.g., after save returns)
  useEffect(() => {
    setLocalValue(comment?.text ?? '')
  }, [comment?.text])

  // Auto-resize textarea whenever it becomes visible or the value changes
  useEffect(() => {
    if (expanded && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [expanded, localValue])

  // Clean up trash timer on unmount
  useEffect(() => () => {
    if (trashTimerRef.current) clearTimeout(trashTimerRef.current)
  }, [])

  const handleHeaderMouseEnter = useCallback(() => {
    trashTimerRef.current = setTimeout(() => setTrashVisible(true), 150)
  }, [])

  const handleHeaderMouseLeave = useCallback(() => {
    if (trashTimerRef.current) {
      clearTimeout(trashTimerRef.current)
      trashTimerRef.current = null
    }
    setTrashVisible(false)
  }, [])

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
    setLocalValue(el.value)
  }

  const handleTextareaBlur = () => {
    if (variation.id == null) return // not yet persisted
    const trimmed = localValue.trim()
    const savedText = comment?.text ?? ''
    if (trimmed === savedText) return // no change
    if (trimmed === '' && comment) {
      onDeleteComment?.(variation.id)
    } else if (trimmed !== '') {
      onSaveComment?.(variation.id, trimmed)
    }
  }

  const handleTextareaFocus = () => {
    if (!isActive && variation.id != null) {
      onVariationJump?.(variation.id, variation.branchPly, 1)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalValue(comment?.text ?? '')
      textareaRef.current?.blur()
    }
  }

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

  // Full move list for tooltip (all moves with proper notation, no comments)
  const tooltipMoves = moves.map((move, i) => {
    const isWhite = isVariationWhiteMove(variation.branchPly, i)
    const num = variationMoveNumber(variation.branchPly, i)
    if (isWhite) return `${num}. ${move}`
    if (i === 0) return `${num}... ${move}`
    return move
  }).join(' ')

  // Show full accent border when in variation but no move is highlighted
  const showAccentBorder = isActive && isInVariation && (!variationPly || variationPly === 0)
  const containerClass = showAccentBorder
    ? 'ml-4 border-2 border-ui-accent bg-ui-bg-page rounded-sm my-0.5'
    : 'ml-4 border-l-2 border-ui-accent bg-ui-bg-page rounded-r-sm my-0.5'

  const trashButton = trashVisible ? (
    <button
      onClick={(e) => { e.stopPropagation(); if (variation.id != null) onDismiss?.(variation.id) }}
      className="text-ui-text-dimmer hover:text-red-400 p-0.5 cursor-pointer animate-in fade-in-0 zoom-in-95"
      title="Dismiss variation"
    >
      <Trash2 size={12} />
    </button>
  ) : (
    // Reserve space so layout doesn't shift when trash appears
    <span className="w-5 shrink-0" />
  )

  const header = (
    <div
      className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-ui-bg-hover"
      onMouseEnter={handleHeaderMouseEnter}
      onMouseLeave={handleHeaderMouseLeave}
      onClick={() => setExpanded(!expanded)}
    >
      {onDragStart && (
        <span title="Drag to reorder">
          <GripVertical
            size={12}
            className="text-ui-text-dimmer shrink-0 cursor-grab active:cursor-grabbing"
          />
        </span>
      )}
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

      {trashButton}
    </div>
  )

  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={3} className="p-0 border-0">
        <div
          className={containerClass}
          style={{ opacity: isDragging ? 0.5 : 1 }}
          draggable={!!onDragStart}
          onDragStart={onDragStart && variation.id != null ? e => onDragStart(e, variation.id!) : undefined}
          onDragOver={onDragOver}
          onDrop={onDrop && variation.id != null ? e => onDrop(e, variation.id!) : undefined}
          onDragEnd={onDragEnd}
        >
          {/* Header row: toggle + first move preview + dismiss */}
          {!expanded ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {header}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono max-w-72">
                <p className="text-xs">{tooltipMoves}</p>
              </TooltipContent>
            </Tooltip>
          ) : header}

          {/* Expanded moves */}
          {expanded && (
            <>
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
                        onClick={() => variation.id != null && onVariationJump?.(variation.id, variation.branchPly, ply)}
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
              {/* Variation comment textarea */}
              <div className="px-2 pb-1.5">
                <textarea
                  ref={textareaRef}
                  value={localValue}
                  placeholder="Add a comment..."
                  rows={1}
                  maxLength={500}
                  style={{ resize: 'none', height: 'auto', overflow: 'hidden' }}
                  className="w-full bg-transparent font-mono text-sm text-ui-text italic outline-none border-b border-transparent focus:border-ui-text-dimmer placeholder:text-ui-text-dimmer/50"
                  onFocus={handleTextareaFocus}
                  onInput={handleTextareaInput}
                  onBlur={handleTextareaBlur}
                  onKeyDown={handleTextareaKeyDown}
                />
              </div>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}