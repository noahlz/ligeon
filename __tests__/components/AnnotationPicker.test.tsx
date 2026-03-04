import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Popover } from '@/components/ui/popover'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnnotationPicker } from '@/components/AnnotationPicker'

function renderPicker(props: Partial<React.ComponentProps<typeof AnnotationPicker>> = {}) {
  const defaults = {
    ply: 2,
    currentAnnotationNags: [],
    onSetAnnotation: vi.fn(),
    onRemoveAnnotation: vi.fn(),
    onClose: vi.fn(),
  }
  return render(
    <TooltipProvider>
      <Popover open={true}>
        <AnnotationPicker {...defaults} {...props} />
      </Popover>
    </TooltipProvider>
  )
}

describe('AnnotationPicker', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders all 16 NAG buttons plus the close button', () => {
    renderPicker()
    // 16 NAG buttons + 1 close button = at least 17 buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(17)
  })

  it('active NAG has ring styling', () => {
    // NAG 1 = '!'
    renderPicker({ currentAnnotationNags: [1] })
    const exclamButton = screen.getByText('!')
    expect(exclamButton).toHaveClass('ring-1')
  })

  it('clicking inactive NAG calls onSetAnnotation with ply and nag', async () => {
    const onSetAnnotation = vi.fn()
    // NAG 2 = '?', not in currentAnnotationNags
    renderPicker({ currentAnnotationNags: [], onSetAnnotation })
    const user = userEvent.setup()
    await user.click(screen.getByText('?'))
    expect(onSetAnnotation).toHaveBeenCalledWith(2, 2)
  })

  it('clicking active NAG calls onRemoveAnnotation with ply and nag', async () => {
    const onRemoveAnnotation = vi.fn()
    // NAG 2 = '?' is active
    renderPicker({ currentAnnotationNags: [2], onRemoveAnnotation })
    const user = userEvent.setup()
    await user.click(screen.getByText('?'))
    expect(onRemoveAnnotation).toHaveBeenCalledWith(2, 2)
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    renderPicker({ onClose })
    const user = userEvent.setup()
    await user.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })
})
