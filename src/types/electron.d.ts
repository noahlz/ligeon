// Type definitions for Electron IPC bridge exposed via preload.ts

export interface CollectionMetadata {
  id: string
  name: string
  gameCount?: number
  createdAt?: string
  lastModified?: string
}

export interface GameFilters {
  player?: string
  white?: string
  black?: string
  event?: string
  dateFrom?: number | null
  dateTo?: number | null
  result?: number | null
  ecoCodes?: string[]
  whiteEloMin?: number | null
  whiteEloMax?: number | null
  blackEloMin?: number | null
  blackEloMax?: number | null
  limit?: number
}

export interface GameSearchResult {
  id: number
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
}

export interface GameRow {
  id: number
  white: string
  black: string
  event: string | null
  site: string | null
  date: number | null
  round: string | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
  moveCount: number
  moves: string
}

export type ImportProgressData =
  | { type: 'progress'; parsed: number; indexed: number; skipped: number }
  | { type: 'log'; logs: Array<{ type: string; message: string; timestamp: number }> }
  | { type: 'complete'; success?: boolean; error?: string }

export interface AppSettings {
  collectionsPath: string
  collectionsPathCustomized: boolean
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
  searchGames: (collectionId: string, filters: GameFilters) => Promise<GameSearchResult[]>
  getGameMoves: (collectionId: string, gameId: number) => Promise<GameRow | null>
  getGameCount: (collectionId: string) => Promise<number>
  getAvailableDates: (collectionId: string) => Promise<number[]>
  getAvailableEcoCodes: (collectionId: string) => Promise<string[]>

  // Settings
  getSettings: () => Promise<AppSettings>
  updateSettings: (updates: Partial<AppSettings>) => Promise<AppSettings>
  selectCollectionsDirectory: () => Promise<string | null>

  // Event Listeners
  onImportProgress: (callback: (data: ImportProgressData) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
