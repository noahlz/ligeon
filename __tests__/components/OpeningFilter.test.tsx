import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { mockElectron, installElectronMock } from '../helpers/electronMock'
import { TooltipProvider } from '@/components/ui/tooltip'
import OpeningFilter from '@/components/OpeningFilter'

// OpeningFilter renders Tooltip inside Badge — must be wrapped in TooltipProvider
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('OpeningFilter', () => {
  beforeEach(() => {
    installElectronMock()
    vi.clearAllMocks()
  })

  it('renders with no selected ECOs and fetches available codes on mount', async () => {
    mockElectron.getAvailableEcoCodes.mockResolvedValue([
      { eco: 'B20', count: 5 },
      { eco: 'C60', count: 3 },
    ])
    renderWithTooltip(
      <OpeningFilter
        collectionId="test-collection"
        value={[]}
        onChange={vi.fn()}
      />
    )
    await waitFor(() => {
      expect(mockElectron.getAvailableEcoCodes).toHaveBeenCalledWith(
        'test-collection',
        expect.any(Object)
      )
    })
  })

  it('shows selected ECO as a badge', async () => {
    mockElectron.getAvailableEcoCodes.mockResolvedValue([{ eco: 'B20', count: 5 }])
    renderWithTooltip(
      <OpeningFilter collectionId="col" value={['B20']} onChange={vi.fn()} />
    )
    await waitFor(() => expect(screen.getByText('B20')).toBeInTheDocument())
  })

  it('× button on badge removes ECO', async () => {
    const onChange = vi.fn()
    mockElectron.getAvailableEcoCodes.mockResolvedValue([{ eco: 'B20', count: 5 }])
    renderWithTooltip(
      <OpeningFilter collectionId="col" value={['B20']} onChange={onChange} />
    )
    await waitFor(() => expect(screen.getByText('B20')).toBeInTheDocument())
    const removeBtn = screen.getByRole('button', { name: /✕/ })
    await userEvent.click(removeBtn)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('clears ECOs no longer in available set', async () => {
    const onChange = vi.fn()
    // B20 is not in the available set returned from the server
    mockElectron.getAvailableEcoCodes.mockResolvedValue([{ eco: 'C60', count: 2 }])
    renderWithTooltip(
      <OpeningFilter collectionId="col" value={['B20', 'C60']} onChange={onChange} />
    )
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['C60'])
    })
  })

  it('shows "Openings..." trigger text', async () => {
    mockElectron.getAvailableEcoCodes.mockResolvedValue([])
    renderWithTooltip(<OpeningFilter collectionId="col" value={[]} onChange={vi.fn()} />)
    expect(screen.getByText('Openings...')).toBeInTheDocument()
  })
})
