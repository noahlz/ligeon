import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { installElectronMock } from '../helpers/electronMock'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { GameSearchResult } from '../../src/shared/types/game'

vi.mock('@/hooks/ipc/useGameSearch', () => ({
  useGameSearch: vi.fn(),
}))

vi.mock('@/components/runtime/CollectionSelector', () => ({
  default: () => <div data-testid="collection-selector" />,
}))

vi.mock('@/components/OpeningFilter', () => ({
  default: () => <div data-testid="opening-filter" />,
}))

vi.mock('@/components/settings/GameListSection', () => ({
  GameListSection: () => <div data-testid="game-list-section" />,
}))

import { useGameSearch } from '@/hooks/ipc/useGameSearch'
import GameListSidebar from '@/components/GameListSidebar'

// GameListSidebar renders Tooltip on the filter toggle button — must wrap in TooltipProvider
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

function makeGame(overrides: Partial<GameSearchResult> = {}): GameSearchResult {
  return {
    id: 1, white: 'A', black: 'B', date: 20230101, result: 1,
    event: null, whiteElo: null, blackElo: null, ecoCode: null,
    ...overrides,
  }
}

function makeGames(count: number, overrides: Partial<GameSearchResult> = {}): GameSearchResult[] {
  return new Array(count).fill(makeGame(overrides))
}

const defaultGameSearch = {
  games: [],
  totalGameCount: 0,
  availableDates: [],
  staleDateFrom: false,
  staleDateTo: false,
}

const defaultProps = {
  collectionId: 'col-1',
  onGameSelect: vi.fn(),
  collections: [{ id: 'col-1', name: 'My Games' }],
  selectedCollectionId: 'col-1',
  onSelectCollection: vi.fn(),
  onImport: vi.fn(),
  onDeleteCollection: vi.fn(),
  selectedGame: null,
  selectedGameCollectionId: null,
  gameListLimit: 200 as const,
  onGameListLimitChange: vi.fn(),
}

describe('GameListSidebar', () => {
  beforeEach(() => {
    installElectronMock()
    vi.clearAllMocks()
  })

  it('renders game count from useGameSearch', () => {
    // games.length must equal totalGameCount to render "N games" (not "N of M games")
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultGameSearch,
      totalGameCount: 42,
      games: makeGames(42),
    })
    renderWithTooltip(<GameListSidebar {...defaultProps} />)
    expect(screen.getByText('42 games')).toBeInTheDocument()
  })

  it('shows "X of Y games" when filtered', () => {
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultGameSearch,
      games: makeGames(10),
      totalGameCount: 42,
    })
    renderWithTooltip(<GameListSidebar {...defaultProps} />)
    expect(screen.getByText(/10 of 42 games/)).toBeInTheDocument()
  })

  it('filter panel is collapsed by default', () => {
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue(defaultGameSearch)
    renderWithTooltip(<GameListSidebar {...defaultProps} />)
    // The filter button should be present in the collapsed state
    const filterBtn = screen.getByRole('button')
    expect(filterBtn).toBeInTheDocument()
  })

  it('clicking filter button expands the panel', async () => {
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultGameSearch,
      availableDates: [],
    })
    renderWithTooltip(<GameListSidebar {...defaultProps} />)
    // TooltipContent ("Expand filters"/"Collapse filters") is not mounted by Radix in tests,
    // so the button has no accessible name. Click the lone icon button to toggle the panel.
    const filterBtn = screen.getByRole('button')
    await userEvent.click(filterBtn)
    // After expanding, the collapsible content becomes visible (data-state=open)
    await waitFor(() => {
      expect(screen.getByTestId('opening-filter')).toBeInTheDocument()
    })
  })

  it('game rows render and clicking calls onGameSelect', async () => {
    const game = makeGame({ white: 'Magnus', black: 'Hikaru', ecoCode: 'B20' })
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultGameSearch,
      games: [game],
      totalGameCount: 1,
    })
    const onGameSelect = vi.fn()
    renderWithTooltip(<GameListSidebar {...defaultProps} onGameSelect={onGameSelect} />)
    await userEvent.click(screen.getByText(/Magnus vs Hikaru/))
    expect(onGameSelect).toHaveBeenCalledWith(game)
  })

  it('renders without crashing when staleDateFrom is true', () => {
    ;(useGameSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultGameSearch,
      staleDateFrom: true,
    })
    renderWithTooltip(<GameListSidebar {...defaultProps} />)
    expect(useGameSearch).toHaveBeenCalled()
  })
})
