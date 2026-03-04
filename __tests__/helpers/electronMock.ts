import { vi } from 'vitest'

export const mockElectron = {
  // Annotations
  getAnnotations: vi.fn(),
  upsertAnnotation: vi.fn(),
  deleteAnnotation: vi.fn(),
  // Comments
  getComments: vi.fn(),
  upsertComment: vi.fn(),
  deleteComment: vi.fn(),
  // Variations
  getVariations: vi.fn(),
  createVariation: vi.fn(),
  updateVariation: vi.fn(),
  deleteVariation: vi.fn(),
  reorderVariations: vi.fn(),
  // Game search
  searchGames: vi.fn(),
  getGameCount: vi.fn(),
  getAvailableDates: vi.fn(),
  getAvailableEcoCodes: vi.fn(),
  // Import
  importPgn: vi.fn(),
  onImportProgress: vi.fn(() => vi.fn()), // returns unsubscribe fn
  // Settings
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  // Board / display
  getBoardTheme: vi.fn(),
  setBoardTheme: vi.fn(),
  getPieceSet: vi.fn(),
  setPieceSet: vi.fn(),
  // Collection
  renameCollection: vi.fn(),
  // External
  openExternal: vi.fn(),
}

/**
 * Install the mock on window.electron. Call in beforeEach.
 * Automatically resets all mocks via vi.fn() — call vi.clearAllMocks() if needed.
 */
export function installElectronMock() {
  Object.defineProperty(window, 'electron', { value: mockElectron, writable: true, configurable: true })
}
