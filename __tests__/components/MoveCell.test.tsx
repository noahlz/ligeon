import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MoveCell } from '@/components/MoveCell'
import type { CommentData } from '../../src/shared/types/game'

function renderMoveCell(props: Partial<React.ComponentProps<typeof MoveCell>> = {}) {
  const defaults = {
    ply: 2,
    san: 'e4',
    isCurrent: false,
    isHovered: false,
    isAnnotationOpen: false,
    isCollapsed: false,
    editingCommentPly: null,
    onJump: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    onMouseMove: vi.fn(),
    onContextMenu: vi.fn(),
    commentCallbacks: {
      onCommentIconClick: vi.fn(),
      onExpandComment: vi.fn(),
      onCollapseComment: vi.fn(),
    },
    annotationCallbacks: {
      onAnnotationTriggerClick: vi.fn(),
      onAnnotationPopoverClose: vi.fn(),
    },
  }
  return render(
    <TooltipProvider>
      <Table><TableBody><TableRow>
        <MoveCell {...defaults} {...props} />
      </TableRow></TableBody></Table>
    </TooltipProvider>
  )
}

describe('MoveCell', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders SAN text', () => {
    renderMoveCell()
    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  it('isCurrent=true adds accent class to the cell', () => {
    renderMoveCell({ isCurrent: true })
    const cell = screen.getByRole('cell')
    expect(cell).toHaveClass('bg-ui-accent')
  })

  it('isCurrent=false does not have accent class', () => {
    renderMoveCell({ isCurrent: false })
    const cell = screen.getByRole('cell')
    expect(cell).not.toHaveClass('bg-ui-accent')
  })

  it('clicking the cell calls onJump with ply', async () => {
    const onJump = vi.fn()
    renderMoveCell({ onJump })
    const user = userEvent.setup()
    await user.click(screen.getByRole('cell'))
    expect(onJump).toHaveBeenCalledWith(2)
  })

  it('isHovered=true shows Add comment button when no comment', () => {
    renderMoveCell({ isHovered: true })
    expect(screen.getByTitle('Add comment')).toBeInTheDocument()
  })

  it('isHovered=false hides Add comment button', () => {
    renderMoveCell({ isHovered: false })
    expect(screen.queryByTitle('Add comment')).not.toBeInTheDocument()
  })

  it('comment present shows Collapse comment button', () => {
    const comment: CommentData = { id: 1, gameId: 1, ply: 2, variationId: null, text: 'good move' }
    renderMoveCell({ comment, isCollapsed: false })
    expect(screen.getByTitle('Collapse comment')).toBeInTheDocument()
  })

  it('isCollapsed=true with comment shows Expand comment button', () => {
    const comment: CommentData = { id: 1, gameId: 1, ply: 2, variationId: null, text: 'good move' }
    renderMoveCell({ comment, isCollapsed: true })
    expect(screen.getByTitle('Expand comment')).toBeInTheDocument()
  })

  it('annotation nags are rendered inline', () => {
    // NAG 1 = '!'
    renderMoveCell({ annotationNags: [1] })
    expect(screen.getByText('!')).toBeInTheDocument()
  })
})
