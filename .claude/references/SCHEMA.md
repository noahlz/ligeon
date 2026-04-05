# Database Schema

Source of truth: `src/shared/database/schema.ts`

## Tables (4)

- **games** — primary game records
- **variations** — branching move sequences attached to a game
- **comments** — text annotations per ply (mainline or for a variation)
- **annotations** — NAG codes per ply (numeric; multiple per ply allowed)

## Variation Architecture

- `branchPly` (1-based): the mainline ply the variation *replaces*, not branches from. Odd = white, even = black.
- Positions stored as FEN strings; Chess objects reconstructed on demand.
- Multiple variations can share the same `(gameId, branchPly)` — stacked in UI by `displayOrder`.
- Upsert semantics: inserting a variation at an existing branch point updates it.
