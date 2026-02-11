/**
 * Chess move types - shared type definition.
 *
 * Moved from chessManager.ts to break circular dependency (NavigableManager importing from chessManager).
 * Now both chess logic and navigation interfaces can import this without coupling.
 *
 * Priority order: check > castle > capture > move
 */
export type MoveType = 'move' | 'capture' | 'check' | 'castle'
