// Type definitions for Electron IPC bridge exposed via preload.ts

export interface CollectionMetadata {
  id: string
  name: string
  gameCount?: number
  createdAt?: string
  lastModified?: string
}

export interface ElectronAPI {
  // File Operations
  selectFile: () => Promise<string | null>
  openExternal: (url: string) => Promise<void>
  importPgn: (filePath: string, collectionId: string, name: string) => Promise<{
    success: boolean
    error?: string
  }>
  cancelImport: () => void

  // Collections
  listCollections: () => Promise<CollectionMetadata[]>
  renameCollection: (collectionId: string, newName: string) => Promise<CollectionMetadata>
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
