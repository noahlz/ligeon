# Database Schema

Source of truth: `src/shared/database/schema.ts`

## Variation Architecture

- `branchPly` (1-based): the mainline ply the variation *replaces*, not branches from. Odd = white, even = black.
- Positions stored as FEN strings; Chess objects reconstructed on demand.
- Multiple variations can share the same `(gameId, branchPly)` — stacked in UI by `displayOrder`.
- Upsert semantics: inserting a variation at an existing branch point updates it.
