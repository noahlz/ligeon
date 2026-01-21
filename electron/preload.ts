import { contextBridge, ipcRenderer } from 'electron'

/**
 * Expose safe IPC methods to React renderer
 * Using context isolation for security
 */
contextBridge.exposeInMainWorld('electron', {
  // === File Operations ===
  selectFile: () => ipcRenderer.invoke('select-file'),

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
  searchGames: (collectionId: string, filters: any) =>
    ipcRenderer.invoke('search-games', { collectionId, filters }),

  getGameMoves: (collectionId: string, gameId: string) =>
    ipcRenderer.invoke('get-game-moves', { collectionId, gameId }),

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
