import { contextBridge, ipcRenderer } from 'electron'
import type { GameFilters, AppSettings } from './ipc/types.js'

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

  getAvailableDates: (collectionId: string) =>
    ipcRenderer.invoke('get-available-dates', { collectionId }),

  getAvailableEcoCodes: (collectionId: string) =>
    ipcRenderer.invoke('get-available-eco-codes', { collectionId }),

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
  onImportProgress: (callback: (data: any) => void) => {
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
