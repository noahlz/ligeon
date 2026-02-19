/**
 * SQLite schema for games table with indices
 */
export const GAMES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    white TEXT NOT NULL,
    black TEXT NOT NULL,
    event TEXT,
    dateYYYYMMDD INTEGER,
    result REAL NOT NULL,
    ecoCode TEXT,
    whiteElo INTEGER,
    blackElo INTEGER,
    site TEXT,
    round TEXT,
    moveCount INTEGER,
    moves TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_white ON games(white);
  CREATE INDEX IF NOT EXISTS idx_black ON games(black);
  CREATE INDEX IF NOT EXISTS idx_event ON games(event);
  CREATE INDEX IF NOT EXISTS idx_result ON games(result);
  CREATE INDEX IF NOT EXISTS idx_ecoCode ON games(ecoCode);
  CREATE INDEX IF NOT EXISTS idx_whiteElo ON games(whiteElo);
  CREATE INDEX IF NOT EXISTS idx_blackElo ON games(blackElo);
`

/**
 * SQLite schema for variations table.
 *
 * ON DELETE CASCADE: deleting a game automatically cleans up its variations.
 * UNIQUE(gameId, branchPly): enforces one variation per branch point — upsert overwrites
 * rather than creating duplicates.
 */
export const VARIATIONS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    branchPly INTEGER NOT NULL,
    moves TEXT NOT NULL,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE(gameId, branchPly)
  );
  CREATE INDEX IF NOT EXISTS idx_variations_game ON variations(gameId);
`

/**
 * SQLite schema for comments table.
 *
 * Supports two comment contexts:
 * - Mainline move comment: ply = 1-based mainline ply, variationId = NULL
 * - Variation comment: ply = 0, variationId = variation DB id
 *
 * ON DELETE CASCADE (gameId): deleting a game automatically cleans up its comments.
 * ON DELETE CASCADE (variationId): deleting a variation automatically cleans up its comment.
 * Partial unique indices enforce one comment per context:
 * - idx_comments_mainline: one comment per mainline ply (variationId IS NULL)
 * - idx_comments_variation: one comment per variation (variationId IS NOT NULL)
 */
export const COMMENTS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    ply INTEGER NOT NULL,
    variationId INTEGER,
    text TEXT NOT NULL,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (variationId) REFERENCES variations(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_comments_game ON comments(gameId);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_mainline ON comments(gameId, ply) WHERE variationId IS NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_variation ON comments(gameId, variationId) WHERE variationId IS NOT NULL;
`
