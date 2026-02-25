# Architecture

Consult this file before grepping the codebase — directory structure tells you where to look.

## Project Structure

```
__tests__/             # Vitest: integration/, performance/, unit/
public/sounds/         # Audio
resources/             # Icons, sample PGNs
scripts/               # CLI tools
src/
  main/                # Node.js only — .ts source, no .js
    config/            # paths, logger, settings, settingsStore
    ipc/               # handlers, validators, types, gameDatabase
  renderer/            # React + Chessground
    components/        # UI components
      ui/              # shadcn/ui primitives (copied, not imported)
    data/              # Static assets (openings.json)
    hooks/             # Custom React hooks
    lib/               # cn() helper
    styles/            # CSS + Tailwind
    types/             # electron.ts (IPC API), navigableManager.ts, moveTypes.ts
    utils/             # chessManager, variationManager, chessHelpers, audioManager, etc.
  shared/              # Single source for main + renderer + CLI
    converters/        # resultConverter, dateConverter
    database/          # schema
    pgn/               # gameExtractor
    types/             # GameData, GameRow interfaces
```

## Import Path Conventions

Use relative paths to `shared/` from all targets. No `@shared` alias. Use `@/` for renderer-internal imports only.

```typescript
// Renderer root (src/renderer/*.tsx):
import type { GameRow } from '../shared/types/game.js'

// Renderer components (src/renderer/components/*.tsx):
import { resultNumericToDisplay } from '../../shared/converters/resultConverter.js'

// Main IPC (src/main/ipc/*.ts):
import { extractGameData } from '../../shared/pgn/gameExtractor.js'
```

## Barrel Exports

Export from each subdirectory via `index.ts` barrel. Import from the directory, not the file directly (within the same target).

## Chess Game Navigation Logic 

The central feature of this application: navigating games and adding variations.

The `NavigableManager` interface defines that behavior. Key implementations:
- **ChessManager** — read-only mainline navigation
- **VariationManager** — mutable variation sequences (branching from mainline)
