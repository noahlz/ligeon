import { useRef, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
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
  onDeleteRequest: (ply: number) => void
}

export function CommentRow({
  ply,
  comment,
  isEditing,
  editValue,
  onEdit,
  onValueChange,
  onSave,
  onCancel,
  onDeleteRequest,
}: CommentRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const trashRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Auto-focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.relatedTarget === trashRef.current) return
    if (e.relatedTarget === cancelRef.current) return
    onSave()
  }

  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={3} className="p-0 border-0">
        <div className="ml-4 border-l-2 border-ui-text-dimmer bg-ui-bg-page rounded-r-sm my-0.5">
          {isEditing ? (
            /* Edit mode: [input (flex-1)] [X or Trash2] */
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={e => onValueChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                maxLength={500}
                className="flex-1 bg-transparent text-sm text-ui-text outline-none border-b border-ui-border focus:border-ui-text-dimmer"
              />
              {comment ? (
                /* Existing comment — trash triggers confirm dialog */
                <button
                  ref={trashRef}
                  onClick={() => onDeleteRequest(ply)}
                  className="text-ui-text-dimmer hover:text-red-400 p-0.5 cursor-pointer shrink-0"
                  title="Delete comment"
                >
                  <Trash2 size={12} />
                </button>
              ) : (
                /* New comment (nothing saved yet) — X cancels immediately */
                <button
                  ref={cancelRef}
                  onClick={onCancel}
                  className="text-ui-text-dimmer hover:text-ui-text p-0.5 cursor-pointer shrink-0"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            /* Display mode: [MessageSquareMore] [comment text (clickable)] */
            <div className="flex items-center gap-1 px-2 py-0.5">
              <span
                onClick={() => onEdit(ply)}
                className="text-sm text-ui-text-dim italic flex-1 min-w-0 break-words cursor-pointer hover:text-ui-text"
                title="Click to edit"
              >
                {comment?.text ?? ''}
              </span>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}