import { contextBridge, ipcRenderer } from 'electron'
import type { GameFilters, AppSettings, OptionFilters } from './ipc/types.js'

/**
 * Import progress event shape — mirrors the callbacks emitted by importHandlers.
 * Duplicated here because preload is compiled in isolation (CommonJS, separate
 * tsconfig) and cannot import from src/renderer/ under NodeNext resolution.
 */
type ImportProgressData =
  | { type: 'progress'; parsed: number; indexed: number; skipped: number }
  | { type: 'log'; logs: Array<{ type: string; message: string; timestamp: number }> }
  | { type: 'complete'; success?: boolean; collectionId: string; gamesIndexed: number; error?: string }

/**
 * Expose safe IPC methods to React renderer
 * Using context isolation for security
 */
contextBridge.exposeInMainWorld('electron', {
  // === File Operations ===
  selectFile: () => ipcRenderer.invoke('select-file'),

  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  importPgn: (filePath: string, collectionId: string, name: string) =>
    ipcRenderer.invoke('import-pgn', { filePath, collectionId, name }),

  cancelImport: () => ipcRenderer.send('cancel-import'),

  // === Collections ===
  listCollections: () => ipcRenderer.invoke('list-collections'),

  renameCollection: (collectionId: string, newName: string) =>
    ipcRenderer.invoke('rename-collection', { collectionId, newName }),

  deleteCollection: (collectionId: string) =>
    ipcRenderer.invoke('delete-collection', { collectionId }),

  // === Games ===
  searchGames: (collectionId: string, filters: GameFilters) =>
    ipcRenderer.invoke('search-games', { collectionId, filters }),

  getGameMoves: (collectionId: string, gameId: number) =>
    ipcRenderer.invoke('get-game-moves', { collectionId, gameId }),

  getGameCount: (collectionId: string) =>
    ipcRenderer.invoke('get-game-count', { collectionId }),

  getAvailableDates: (collectionId: string, filters?: OptionFilters) =>
    ipcRenderer.invoke('get-available-dates', { collectionId, filters }),

  getAvailableEcoCodes: (collectionId: string, filters?: OptionFilters) =>
    ipcRenderer.invoke('get-available-eco-codes', { collectionId, filters }),

  // === Settings ===
  getSettings: () => ipcRenderer.invoke('get-settings'),

  updateSettings: (updates: Partial<AppSettings>) =>
    ipcRenderer.invoke('update-settings', { updates }),

  selectCollectionsDirectory: () => ipcRenderer.invoke('select-collections-directory'),

  // === Event Listeners ===
  /**
   * Listen for import progress events
   * Returns unsubscribe function
   */
  onImportProgress: (callback: (data: ImportProgressData) => void) => {
    const unsubscribe = () => {
      ipcRenderer.removeAllListeners('import-progress')
      ipcRenderer.removeAllListeners('import-progress-log')
      ipcRenderer.removeAllListeners('import-complete')
    }

    ipcRenderer.on('import-progress', (_event, data) => {
      callback({ ...data, type: 'progress' })
    })

    ipcRenderer.on('import-progress-log', (_event, log) => {
      callback({ logs: [log], type: 'log' })
    })

    ipcRenderer.on('import-complete', (_event, data) => {
      callback({ ...data, type: 'complete' })
    })

    return unsubscribe
  },

})
