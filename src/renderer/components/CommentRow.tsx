import { useRef, useEffect, useState } from 'react'
import { X, ChevronDown, ChevronRight, MessageSquareMore, Check, Pencil } from 'lucide-react'
import type { CommentData } from '../../shared/types/game.js'
import { TableRow, TableCell } from '@/components/ui/table.js'

export interface CommentRowProps {
  ply: number
  /** Saved comment data. Undefined when adding a new comment (edit mode only). */
  comment?: CommentData
  isEditing: boolean
  editValue: string
  onEdit: (ply: number) => void
  onValueChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

const COLLAPSED_MAX = 80

export function CommentRow({
  ply,
  comment,
  isEditing,
  editValue,
  onEdit,
  onValueChange,
  onSave,
  onCancel,
}: CommentRowProps) {
  const [expanded, setExpanded] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const collapsedText = comment && comment.text.length > COLLAPSED_MAX
    ? comment.text.slice(0, COLLAPSED_MAX) + '…'
    : comment?.text ?? ''

  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={3} className="p-0 border-0">
        <div className="ml-4 border-l-2 border-ui-text-dimmer bg-ui-bg-page rounded-r-sm my-0.5">
          {isEditing ? (
            /* Edit mode */
            <div className="flex items-center gap-1 px-2 py-1">
              <MessageSquareMore size={12} className="text-ui-text-dimmer shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={e => onValueChange(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                placeholder="Add a comment…"
                className="flex-1 bg-transparent text-sm text-ui-text outline-none border-b border-ui-border focus:border-ui-accent placeholder:text-ui-text-dimmer"
              />
              <button
                onClick={onSave}
                className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer"
                title="Save comment (Enter)"
              >
                <Check size={12} />
              </button>
              <button
                onClick={onCancel}
                className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer"
                title="Cancel (Esc)"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            /* Display mode */
            <div className="flex items-center gap-1 px-2 py-0.5 group/comment">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer shrink-0"
              >
                {expanded
                  ? <ChevronDown size={12} />
                  : <ChevronRight size={12} />
                }
              </button>
              <MessageSquareMore size={12} className="text-ui-text-dimmer shrink-0" />
              <span className="text-sm text-ui-text-dim italic flex-1 min-w-0 break-words">
                {expanded ? (comment?.text ?? '') : collapsedText}
              </span>
              <button
                onClick={() => onEdit(ply)}
                className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer opacity-0 group-hover/comment:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
                title="Edit comment"
              >
                <Pencil size={10} />
              </button>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
