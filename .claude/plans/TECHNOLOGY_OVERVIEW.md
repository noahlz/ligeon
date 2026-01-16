# ligeon - Technology Stack & Implementation Guide

**Use the Lichess technology stack for this project:** TypeScript, chessops, @lichess-org/chessground, pnpm, Vitest.

---

## Required Technology Versions

- **Runtime:** Node.js 24+
- **Language:** TypeScript 5.9
- **Main Application:** Electron 39, React 18, Tailwind CSS 3
- **Chess Logic:** chessops 0.15
- **Board UI:** @lichess-org/chessground 9.9
- **Database:** SQLite with better-sqlite3 12.6
- **Build Tool:** Vite 7
- **Package Manager:** pnpm 10+
- **Testing:** Vitest 3.2

---

## Core Technologies

### Electron 39
Build the desktop application using Electron. The architecture consists of:
- **Main Process:** Node.js handles windows, IPC, file system, database operations, and PGN import
- **Renderer Process:** Chromium renders the UI
- **Security:** Enable context isolation and disable nodeIntegration to sandbox the renderer

### TypeScript 5.9
Write all code in TypeScript (.ts and .tsx files). Use TypeScript for:
- React components with proper prop typing
- Electron main process with full type definitions
- chessops integration with typed move data
- Database operations with typed schemas
- Configuration files (tsconfig.json, vite.config.ts, etc.)

### React 18 + Tailwind CSS 3
Build the UI using React components styled with Tailwind utility classes. Use:
- React hooks (useState, useEffect, useCallback) for component state and lifecycle
- Tailwind for all styling (no separate CSS files)
- @lichess-org/chessground for board rendering
- lucide-react for UI icons

### chessops 0.15
Use chessops for all chess logic:
- `chessops/chess` - Move execution and validation
- `chessops/fen` - FEN string parsing and generation with makeFen(), parseFen()
- `chessops/pgn` - PGN parsing with parsePgn() and streaming game iteration
- `chessops/san` - Standard Algebraic Notation handling
- Support all PGN variants without "sloppy mode" hacks

### @lichess-org/chessground 9.9
Render the interactive chess board using Chessground. Implement:
- Position display via FEN notation
- Piece movement animations
- Square highlighting for the last move
- Keyboard and touch support
- Load CSS from @lichess-org/chessground/assets/

### SQLite with better-sqlite3 12.6
Store all game data in a SQLite database. Implement:
- One .db file per collection
- Indexed metadata (player names, dates, results, ratings, ECO codes)
- Full-text search capabilities
- Batch transactions for efficient 10k+ game imports
- Synchronous database access via better-sqlite3 in the main process

### Vite 7
Configure Vite as the React build tool:
- Hot Module Replacement (HMR) for development
- Fast esbuild bundling for production
- Alias @ pointing to src/ directory
- Output to dist/ directory
- Suppress build size reporting with reportCompressedSize: false

### pnpm 10+
Use pnpm exclusively for package management. All commands:
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development
- `pnpm run build` - Build for production
- `pnpm test` - Run tests

### Vitest 3.2
Configure Vitest for unit and integration testing:
- Environment: happy-dom for component testing
- Global test functions (describe, test, expect)
- Coverage target: >60% for lines, functions, branches, statements
- API compatible with Jest

### electron-builder
Package Electron builds for local testing:
- Target: local dir builds only (no installers or code signing)
- Output to dist-electron/ directory
- Includes dist/ and electron/ in the build

---

## Three-Layer Architecture

Implement ligeon with this architecture:

1. **Main Process (Electron + Node.js)**
   - Window management
   - IPC communication bridge
   - File system operations (file dialogs, game imports)
   - SQLite database operations
   - PGN parsing with chessops streaming

2. **Renderer Process (React + TypeScript)**
   - UI components using React
   - Game collection browsing
   - Move navigation
   - Board visualization with Chessground
   - User interaction handling

3. **Data Layer (SQLite)**
   - Game persistence
   - Metadata indexing
   - Full-text search
   - Efficient batch operations

---

## Key Implementation Patterns

**Context Isolation:** Isolate the renderer process from Node.js access. Use a preload bridge for secure IPC.

**Streaming Import:** Parse large PGN files with chessops' streaming iterator to avoid memory bloat.

**Type Safety:** Use TypeScript types throughout for FEN strings, moves, game metadata, and Electron IPC messages.

**Component Composition:** Build React components that are composable, testable, and have clear separation of concerns.

**Resource Caching:** Cache Lichess CDN audio in memory at runtime to avoid repeated downloads.

