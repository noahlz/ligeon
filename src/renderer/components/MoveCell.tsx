import { MessageSquareMore, NotebookPen } from 'lucide-react'
import type { CommentData } from '../../shared/types/game.js'
import { getNagDescription, getNagSymbol } from '../utils/nag.js'
import {
  TableCell,
} from '@/components/ui/table.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'
import {
  Popover,
  PopoverAnchor,
} from '@/components/ui/popover.js'
import { AnnotationPicker } from './AnnotationPicker.js'

export interface MoveCellCommentCallbacks {
  onCommentIconClick: (ply: number) => void
  onExpandComment: (ply: number) => void
  onCollapseComment: (ply: number) => void
  onCancelComment?: () => void
}

export interface MoveCellAnnotationCallbacks {
  onAnnotationTriggerClick: (e: React.MouseEvent, ply: number) => void
  onAnnotationPopoverClose: () => void
  onSetAnnotation?: (ply: number, nag: number) => void
  onRemoveAnnotation?: (ply: number, nag: number) => void
}

export interface MoveCellProps {
  ply: number
  san: string | null | undefined
  isCurrent: boolean
  refProp?: React.Ref<HTMLTableCellElement>
  comment?: CommentData
  isCollapsed: boolean
  annotationNags?: number[]
  isHovered: boolean
  isAnnotationOpen: boolean
  editingCommentPly: number | null
  onJump: (ply: number) => void
  onMouseEnter: (ply: number) => void
  onMouseLeave: (ply: number) => void
  onMouseMove: (ply: number) => void
  onContextMenu: (e: React.MouseEvent, ply: number) => void
  commentCallbacks: MoveCellCommentCallbacks
  annotationCallbacks: MoveCellAnnotationCallbacks
}

export function MoveCell({
  ply,
  san,
  isCurrent,
  refProp,
  comment,
  isCollapsed,
  annotationNags,
  isHovered,
  isAnnotationOpen,
  editingCommentPly,
  onJump,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onContextMenu,
  commentCallbacks,
  annotationCallbacks,
}: MoveCellProps) {
  const hasAnnotations = (annotationNags?.length ?? 0) > 0
  const hasComment = !!comment

  // Don't show hover buttons on the cell that currently has the comment input open
  const isBeingEdited = editingCommentPly === ply
  // Show buttons on hover only, not while editing
  const showButtons = isHovered && !isBeingEdited
  const showCommentTrigger = showButtons && !hasComment

  // Icon for existing comments — always visible, toggles collapse
  const commentIcon = hasComment ? (
    isCollapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={e => { e.stopPropagation(); commentCallbacks.onExpandComment(ply) }}
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
      <button
        onClick={e => { e.stopPropagation(); commentCallbacks.onCollapseComment(ply) }}
        className="text-white/70 hover:text-white p-0.5 cursor-pointer shrink-0"
        title="Collapse comment"
      >
        <MessageSquareMore size={14} />
      </button>
    )
  ) : null

  // Hover-triggered icon — only for moves with no comment
  const triggerIcon = showCommentTrigger ? (
    <button
      onClick={e => {
        e.stopPropagation()
        if (editingCommentPly != null) commentCallbacks.onCancelComment?.()
        commentCallbacks.onCommentIconClick(ply)
      }}
      className="text-white/50 hover:text-ui-accent p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95"
      title="Add comment"
    >
      <MessageSquareMore size={14} />
    </button>
  ) : null

  // Shared props for both AnnotationPicker instances (annotations-exist vs no-annotations branch)
  const pickerProps = {
    ply,
    currentAnnotationNags: annotationNags ?? [],
    onSetAnnotation: annotationCallbacks.onSetAnnotation,
    onRemoveAnnotation: annotationCallbacks.onRemoveAnnotation,
    onClose: annotationCallbacks.onAnnotationPopoverClose,
  }

  // Inline annotation — always visible when annotations exist, plain button that opens the picker.
  // No Popover here; the single cell-level Popover (below) owns the picker lifecycle.
  const inlineAnnotation = hasAnnotations ? (
    <button
      data-annotation-trigger
      onClick={e => annotationCallbacks.onAnnotationTriggerClick(e, ply)}
      className="ml-0.5 cursor-pointer opacity-80 hover:opacity-100"
    >
      {(annotationNags ?? []).map(nag => (
        <Tooltip key={nag}>
          <TooltipTrigger asChild>
            <span className="mr-1.5">{getNagSymbol(nag)}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{getNagDescription(nag)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </button>
  ) : null

  // Annotation trigger slot — NotebookPen shown on hover (or always for 2+ NAGs) when picker is closed.
  // Plain button; the cell-level Popover handles opening/closing.
  const annotationTrigger = showButtons && !isAnnotationOpen ? (
    <button
      onClick={e => {
        if (editingCommentPly != null) commentCallbacks.onCancelComment?.()
        annotationCallbacks.onAnnotationTriggerClick(e, ply)
      }}
      className="p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95 text-white/50 hover:text-ui-accent"
      title={hasAnnotations ? 'Change annotation' : 'Add annotation'}
    >
      <NotebookPen size={12} />
    </button>
  ) : null

  // Single Popover wrapping the cell so the picker has a stable, layout-independent anchor.
  // PopoverAnchor is on the inner flex span (a stable element that doesn't shift when
  // annotation symbols appear/change), so Radix never repositions the popover when
  // the annotation display updates. All buttons above are plain triggers that just call
  // onAnnotationTriggerClick — no nested Popover/PopoverTrigger needed.
  return (
    <Popover
      open={isAnnotationOpen}
      onOpenChange={(open) => { if (!open) annotationCallbacks.onAnnotationPopoverClose() }}
    >
      <TableCell
        ref={refProp}
        onClick={san ? () => onJump(ply) : undefined}
        onMouseEnter={() => onMouseEnter(ply)}
        onMouseLeave={() => onMouseLeave(ply)}
        onMouseMove={() => onMouseMove(ply)}
        onContextMenu={e => onContextMenu(e, ply)}
        className={`px-2 py-0.5 rounded border-0 text-lg ${
          san ? `cursor-pointer ${isCurrent ? '' : 'hover:bg-ui-bg-hover'}` : ''
        } ${isCurrent ? 'bg-ui-accent text-white font-bold' : ''}`}
      >
        <PopoverAnchor asChild>
          {/* relative container so hover button pill can overlay right side */}
          <span className="flex items-center w-full relative">
            <span className={`flex-1 whitespace-nowrap transition-opacity ${isHovered ? 'opacity-30' : 'opacity-100'}`}>
              {san || ''}
              {inlineAnnotation}
            </span>
            {/* Hover button pill: dark background makes it clearly a separate layer */}
            {(annotationTrigger || commentIcon || triggerIcon) && (
              <span className={`absolute -right-1 inset-y-0 flex items-center gap-0.5 rounded px-0.5 ${isCurrent ? 'bg-orange-800/50' : 'bg-ui-bg-hover'}`}>
                {annotationTrigger}
                {commentIcon ?? triggerIcon}
              </span>
            )}
          </span>
        </PopoverAnchor>
      </TableCell>
      <AnnotationPicker {...pickerProps} />
    </Popover>
  )
}
