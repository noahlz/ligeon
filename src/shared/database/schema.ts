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
 * SQLite schema for sidelines table
 */
export const SIDELINES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS sidelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    branchPly INTEGER NOT NULL,
    moves TEXT NOT NULL,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE(gameId, branchPly)
  );
  CREATE INDEX IF NOT EXISTS idx_sidelines_game ON sidelines(gameId);
`
