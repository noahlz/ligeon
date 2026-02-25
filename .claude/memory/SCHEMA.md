# Database Schema

Source of truth: `src/shared/database/schema.ts`

## Tables (4)

- **games** — primary game records (players, event, date, result, ECO, Elo, move count, move sequence)
- **variations** — branching move sequences attached to a game
- **comments** — text annotations per ply (mainline or within a variation)
- **annotations** — NAG codes per ply (numeric; multiple per ply allowed)

## Variation Architecture

- `branchPly` (1-based): the mainline ply the variation *replaces*, not branches from. Odd = white, even = black.
- Positions stored as FEN strings; Chess objects reconstructed on demand.
- Multiple variations can share the same `(gameId, branchPly)` — stacked in UI by `displayOrder`.
- Upsert semantics: inserting a variation at an existing branch point updates it.

## Gotchas

### No Database Migrations (Pre-Release)
Project is pre-release. Don't write migrations — users delete and re-import their collections.

### Database Main-Process Only
SQLite is unavailable in the renderer. See `IPC.md` for the access path and validation patterns.
