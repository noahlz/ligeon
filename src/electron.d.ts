// Type definitions for Electron IPC bridge exposed via preload.ts

export interface ElectronAPI {
  // File Operations
  selectFile: () => Promise<string | null>
  importPgn: (filePath: string, collectionId: string, name: string) => Promise<{
    success: boolean
    error?: string
  }>
  cancelImport: () => void

  // Collections
  listCollections: () => Promise<any[]>
  renameCollection: (collectionId: string, newName: string) => Promise<{
    success: boolean
    metadata: { id: string; name: string }
  }>
  deleteCollection: (collectionId: string) => Promise<{ success: boolean }>

  // Games
  searchGames: (collectionId: string, filters: any) => Promise<any[]>
  getGameMoves: (collectionId: string, gameId: string) => Promise<any>

  // Event Listeners
  onImportProgress: (callback: (data: any) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
