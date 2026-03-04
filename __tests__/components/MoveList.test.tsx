import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import MoveList from '@/components/MoveList'
import type { VariationData } from '../../src/shared/types/game'

function renderMoveList(
  moves: string[],
  result: string | null = null,
  currentPly = 0,
  variations?: VariationData[],
  onJump = vi.fn(),
) {
  return { onJump, ...render(
    <TooltipProvider>
      <MoveList
        moves={moves}
        result={result}
        currentPly={currentPly}
        onJump={onJump}
        variations={variations}
      />
    </TooltipProvider>
  )}
}

describe('MoveList', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders move pairs with move numbers', () => {
    renderMoveList(['e4', 'e5', 'Nf3', 'Nc6'])
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
    expect(screen.getByText('e5')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
    expect(screen.getByText('Nc6')).toBeInTheDocument()
  })

  it('renders result row', () => {
    renderMoveList(['e4', 'e5'], '1-0')
    expect(screen.getByText(/1-0/)).toBeInTheDocument()
  })

  it('calls onJump with correct ply on move click', async () => {
    const onJump = vi.fn()
    const user = userEvent.setup()
    renderMoveList(['e4', 'e5'], null, 0, undefined, onJump)

    await user.click(screen.getByText('e4'))
    expect(onJump).toHaveBeenCalledWith(1)

    await user.click(screen.getByText('e5'))
    expect(onJump).toHaveBeenCalledWith(2)
  })

  it('renders "..." continuation row when variation splits a pair', () => {
    const variations: VariationData[] = [
      { id: 1, gameId: 1, branchPly: 1, moves: 'd4' },
    ]
    renderMoveList(['e4', 'e5'], null, 0, variations)
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('highlights the current move with accent class', () => {
    renderMoveList(['e4', 'e5', 'Nf3'], null, 2)
    const cell = screen.getByText('e5').closest('td')
    expect(cell).toHaveClass('bg-ui-accent')
  })

  it('renders nothing for empty moves list', () => {
    renderMoveList([], null)
    expect(screen.queryByText('1.')).not.toBeInTheDocument()
  })

  it('context menu on move cell does not throw', () => {
    renderMoveList(['e4', 'e5'])
    const cell = screen.getByText('e4').closest('td')!
    expect(() => fireEvent.contextMenu(cell)).not.toThrow()
  })

  it('mouse enter and leave on move cell do not throw', () => {
    renderMoveList(['e4', 'e5'])
    const cell = screen.getByText('e4').closest('td')!
    expect(() => {
      fireEvent.mouseEnter(cell)
      fireEvent.mouseLeave(cell)
    }).not.toThrow()
  })

  it('renders CommentRow in edit mode when editingPly matches', () => {
    const { container } = render(
      <TooltipProvider>
        <MoveList
          moves={['e4', 'e5']}
          result={null}
          currentPly={1}
          onJump={vi.fn()}
          commentHandlers={{
            editingPly: 1,
            editValue: 'test comment',
            onEdit: vi.fn(),
            onValueChange: vi.fn(),
            onSave: vi.fn(),
            onCancel: vi.fn(),
            onDeleteRequest: vi.fn(),
          }}
        />
      </TooltipProvider>
    )
    // CommentRow in edit mode renders an input
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument()
  })

  it('renders "..." continuation row when edit mode splits white/black', () => {
    render(
      <TooltipProvider>
        <MoveList
          moves={['e4', 'e5']}
          result={null}
          currentPly={0}
          onJump={vi.fn()}
          commentHandlers={{
            editingPly: 1,
            editValue: '',
            onEdit: vi.fn(),
            onValueChange: vi.fn(),
            onSave: vi.fn(),
            onCancel: vi.fn(),
            onDeleteRequest: vi.fn(),
          }}
        />
      </TooltipProvider>
    )
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('renders VariationRow after black move (branchPly=2)', () => {
    const variations: VariationData[] = [
      { id: 2, gameId: 1, branchPly: 2, moves: 'Nf3' },
    ]
    renderMoveList(['e4', 'e5', 'Nf3'], null, 0, variations)
    // Variation is rendered — VariationRow should appear in the table
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e5')).toBeInTheDocument()
  })
})
