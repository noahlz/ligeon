import type { GameData, GameRow, GameSearchResult, AppSettings, OptionFilters, GameFilters, VariationData, CommentData, AnnotationData } from '../../shared/types/game.js'
export type { GameData, GameRow, GameSearchResult, AppSettings, OptionFilters, GameFilters, VariationData, CommentData, AnnotationData }

export interface CollectionMetadata {
  id: string
  name: string
  gameCount: number
  createdAt: string
  lastModified: string
}
