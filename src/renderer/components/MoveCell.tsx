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
  PopoverTrigger,
} from '@/components/ui/popover.js'
import { AnnotationPicker } from './AnnotationPicker.js'

export interface MoveCellCommentCallbacks {
  onCommentIconClick: (ply: number) => void
  onExpandComment: (ply: number) => void
  onCollapseComment: (ply: number) => void
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
  onContextMenu,
  commentCallbacks,
  annotationCallbacks,
}: MoveCellProps) {
  const hasAnnotations = (annotationNags?.length ?? 0) > 0
  const hasComment = !!comment

  const showAnnotationTrigger = (isHovered || isAnnotationOpen) && !editingCommentPly
  const showCommentTrigger = isHovered && !editingCommentPly && !hasComment

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
      onClick={e => { e.stopPropagation(); commentCallbacks.onCommentIconClick(ply) }}
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

  // Inline annotation — always visible when annotations exist, clickable to open picker
  // Each NAG symbol rendered individually with its own tooltip
  const inlineAnnotation = hasAnnotations ? (
    <Popover
      open={isAnnotationOpen}
      onOpenChange={(open) => { if (!open) annotationCallbacks.onAnnotationPopoverClose() }}
    >
      <PopoverTrigger asChild>
        <button
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
      </PopoverTrigger>
      <AnnotationPicker {...pickerProps} />
    </Popover>
  ) : null

  // Annotation trigger slot — NotebookPen on hover, hidden when popover is open
  // When annotation exists: plain button (inlineAnnotation Popover handles rendering)
  // When no annotation: NotebookPen is the Popover trigger
  const annotationTrigger = showAnnotationTrigger && !isAnnotationOpen ? (
    hasAnnotations ? (
      <button
        onClick={e => annotationCallbacks.onAnnotationTriggerClick(e, ply)}
        className="p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95 text-white/50 hover:text-ui-accent"
        title="Change annotation"
      >
        <NotebookPen size={12} />
      </button>
    ) : (
      <Popover
        open={isAnnotationOpen}
        onOpenChange={(open) => { if (!open) annotationCallbacks.onAnnotationPopoverClose() }}
      >
        <PopoverTrigger asChild>
          <button
            onClick={e => annotationCallbacks.onAnnotationTriggerClick(e, ply)}
            className="p-0.5 cursor-pointer shrink-0 animate-in fade-in-0 zoom-in-95 text-white/50 hover:text-ui-accent"
            title="Add annotation"
          >
            <NotebookPen size={12} />
          </button>
        </PopoverTrigger>
        <AnnotationPicker {...pickerProps} />
      </Popover>
    )
  ) : null

  return (
    <TableCell
      ref={refProp}
      onClick={san ? () => onJump(ply) : undefined}
      onMouseEnter={() => onMouseEnter(ply)}
      onMouseLeave={() => onMouseLeave(ply)}
      onContextMenu={e => onContextMenu(e, ply)}
      className={`px-2 py-0.5 rounded border-0 text-lg overflow-hidden ${
        san ? 'cursor-pointer hover:bg-ui-bg-hover' : ''
      } ${isCurrent ? 'bg-ui-accent text-white font-bold' : ''}`}
    >
      <span className="flex items-center w-full">
        <span className="flex-1 whitespace-nowrap">
          {san || ''}
          {inlineAnnotation}
        </span>
        {/* Annotation trigger slot */}
        <span className="w-5 shrink-0 flex items-center justify-center">
          {annotationTrigger}
        </span>
        {/* Comment icon slot */}
        <span className="w-5 shrink-0 flex items-center justify-end">
          {commentIcon ?? triggerIcon}
        </span>
      </span>
    </TableCell>
  )
}
