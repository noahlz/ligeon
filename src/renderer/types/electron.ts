// Type definitions for Electron IPC bridge exposed via preload.ts

import type { GameRow, GameSearchResult, AppSettings, BoardTheme, OptionFilters, VariationData, CommentData, AnnotationData } from '../../shared/types/game.js'

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
  results?: number[]
  ecoCodes?: string[]
  whiteEloMin?: number | null
  whiteEloMax?: number | null
  blackEloMin?: number | null
  blackEloMax?: number | null
  limit?: number
}

export type ImportProgressData =
  | { type: 'progress'; parsed: number; indexed: number; skipped: number }
  | { type: 'log'; logs: Array<{ type: 'info' | 'success' | 'warning' | 'error' | 'debug'; message: string; timestamp: number }> }
  | { type: 'complete'; success?: boolean; collectionId: string; gamesIndexed: number; error?: string }

// Re-export types from lib
export type { GameRow, GameSearchResult, AppSettings, BoardTheme, OptionFilters, VariationData, CommentData, AnnotationData }

export interface EcoCodeWithCount {
  eco: string
  count: number
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
  getAvailableDates: (collectionId: string, filters?: OptionFilters) => Promise<number[]>
  getAvailableEcoCodes: (collectionId: string, filters?: OptionFilters) => Promise<EcoCodeWithCount[]>

  // Variations
  getVariations: (collectionId: string, gameId: number) => Promise<VariationData[]>
  createVariation: (collectionId: string, gameId: number, branchPly: number, moves: string) => Promise<VariationData | null>
  updateVariation: (collectionId: string, gameId: number, id: number, moves: string) => Promise<VariationData | null>
  deleteVariation: (collectionId: string, gameId: number, id: number) => Promise<{ success: boolean }>
  reorderVariations: (collectionId: string, gameId: number, branchPly: number, orderedIds: number[]) => Promise<{ success: boolean }>

  // Comments
  getComments: (collectionId: string, gameId: number) => Promise<CommentData[]>
  upsertComment: (collectionId: string, gameId: number, ply: number, text: string) => Promise<CommentData | null>
  deleteComment: (collectionId: string, gameId: number, ply: number) => Promise<{ success: boolean }>
  upsertVariationComment: (collectionId: string, gameId: number, variationId: number, text: string) => Promise<CommentData | null>
  deleteVariationComment: (collectionId: string, gameId: number, variationId: number) => Promise<{ success: boolean }>

  // Annotations
  getAnnotations: (collectionId: string, gameId: number) => Promise<AnnotationData[]>
  upsertAnnotation: (collectionId: string, gameId: number, ply: number, nag: number) => Promise<AnnotationData | null>
  deleteAnnotation: (collectionId: string, gameId: number, ply: number, nag: number) => Promise<{ success: boolean }>

  // Settings
  getSettings: () => Promise<AppSettings>
  updateSettings: (updates: Partial<AppSettings>) => Promise<AppSettings>
  selectCollectionsDirectory: () => Promise<string | null>
  getBoardTheme: () => Promise<BoardTheme>
  setBoardTheme: (theme: BoardTheme) => Promise<void>

  // Event Listeners
  onImportProgress: (callback: (data: ImportProgressData) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
