# ligeon - Technology Overview

A technical deep-dive into the major tools, platforms, and frameworks used to build ligeon.

**IMPORTANT:** This project uses the Lichess technology stack (TypeScript, chessops, @lichess-org/chessground, pnpm, Vitest).

---

## Quick Technology Stack

- **Language:** TypeScript (NOT JavaScript)
- **Main Application:** Electron, React 18, Tailwind CSS
- **Chess Logic:** chessops (NOT chess.js)
- **PGN Parsing:** chessops parsePgn() (NOT pgn-parser)
- **Board UI:** @lichess-org/chessground
- **Database:** SQLite, better-sqlite3
- **Build Tool:** Vite
- **Package Manager:** pnpm (NOT npm)
- **Testing:** Vitest (NOT Jest)

---

## Main Application Framework

### Electron

**Purpose:** Cross-platform desktop application framework

**Why:** Enables building native macOS and Windows apps from a single codebase, leveraging web technologies with full system access.

**Project:** https://www.electronjs.org/

Electron powers the entire ligeon application, providing window management, IPC (Inter-Process Communication), file system access, and OS integration. The architecture uses a main process (Node.js) for backend operations and a renderer process (Chromium) for the UI.

---

## Language & Type System

### TypeScript

**Purpose:** Typed superset of JavaScript

**Why:** Type safety for chess data structures (FEN strings, move notation, game metadata). Better IDE support, compile-time error detection, and maintainability. Industry standard for chess libraries.

**Project:** https://www.typescriptlang.org/

TypeScript is used throughout ligeon - all source files are `.ts` or `.tsx` (NOT `.js`/`.jsx`). Provides full type definitions for chessops integration, React components, and Electron IPC.

---

## Frontend Framework & UI

### React 18

**Purpose:** JavaScript library for building interactive user interfaces

**Why:** React's component-based architecture, virtual DOM, and hot reload capability accelerate UI development and make the codebase maintainable.

**Project:** https://react.dev/

React orchestrates all UI components in ligeon, managing state for collections, selected games, move navigation, and board updates. Hooks like `useState`, `useEffect`, and custom hooks (`useAutoPlay`) handle component logic and lifecycle.

### Tailwind CSS

**Purpose:** Utility-first CSS framework

**Why:** Tailwind eliminates the need for custom CSS files while providing a consistent design system with rapid styling without context-switching.

**Project:** https://tailwindcss.com/

Tailwind CSS styles all UI components in ligeon—from the game board layout to the navigation buttons and dialogs. The utility-first approach ensures consistent spacing, colors, and responsiveness across macOS and Windows.

### @lichess-org/chessground

**Purpose:** Professional chess board UI library from Lichess

**Why:** Battle-tested by Lichess.org (300M games/month), provides optimized, accessible, and beautiful chess board rendering with smooth animations and keyboard support.

**Project:** https://github.com/lichess-org/chessground

Chessground renders the interactive chess board in ligeon, displaying the current game position via FEN notation. It provides smooth piece animations, square highlighting (lastMove), and responsive touch support. Written in TypeScript with zero dependencies.

---

## Chess Logic & Data

### chessops

**Purpose:** TypeScript chess library for move generation, FEN/PGN parsing, and game logic

**Why:** Official Lichess chess library, designed specifically for chessground integration. Includes built-in PGN parsing (no separate library needed), streaming support for large files, and variant support.

**Project:** https://github.com/niklasf/chessops

chessops powers all chess logic in ligeon:
- Move execution and validation via `chessops/chess`
- FEN generation via `chessops/fen`
- PGN parsing via `chessops/pgn` (replaces pgn-parser)
- Native support for all PGN notation variants (no "sloppy mode" hacks)
- Streaming PGN import for memory-efficient large file handling

**Key modules:**
- `chessops/chess` - Chess, position, move execution
- `chessops/fen` - makeFen(), parseFen()
- `chessops/pgn` - parsePgn(), streaming game iterator
- `chessops/san` - Standard Algebraic Notation

---

## Database & I/O

### SQLite

**Purpose:** Embedded SQL database

**Why:** SQLite is lightweight, serverless, and perfect for desktop applications—no separate database server needed, and files are portable across systems.

**Project:** https://www.sqlite.org/

SQLite stores all game data in ligeon, with one .db file per collection. Each database contains games with indexed metadata (player names, dates, results, ratings, ECO codes) enabling fast full-text search and filtering.

### better-sqlite3

**Purpose:** Fast, synchronous SQLite driver for Node.js

**Why:** better-sqlite3 provides synchronous database access with superior performance compared to async alternatives, simplifying query logic in the main process.

**Project:** https://github.com/WiseLibs/better-sqlite3

better-sqlite3 handles all database operations in ligeon—inserting games during import, executing searches with filters, and retrieving game data with moves. Transactions enable batch inserts of 10k+ games efficiently.

---

## Build & Development

### Vite

**Purpose:** Modern frontend build tool and development server

**Why:** Vite offers instant hot module replacement (HMR), fast builds via esbuild, and minimal configuration—dramatically improving development experience.

**Project:** https://vitejs.dev/

Vite builds ligeon's React frontend, bundling components, styles, and assets into optimized dist/ output. In development, Vite serves the app with hot reload, allowing instant feedback during UI changes.

### pnpm

**Purpose:** Fast, disk space efficient package manager

**Why:** pnpm is the standard package manager used across all Lichess projects. Faster installs, strict dependency resolution, symlinked node_modules.

**Project:** https://pnpm.io/

All commands use `pnpm` instead of `npm`: `pnpm install`, `pnpm run dev`, `pnpm test`, etc.

---

## Testing & Quality

### Vitest

**Purpose:** Vite-native unit testing framework

**Why:** Vitest is faster than Jest (native ESM, no transforms), has better TypeScript support, uses the same API as Jest for easy migration, and is the standard in the Vite ecosystem.

**Project:** https://vitest.dev/

Vitest runs all unit and integration tests in ligeon—testing utilities (dateConverter, resultConverter), database operations, chess logic, and component behavior. Coverage reports track quality (target: >60%).

Vitest replaces Jest completely—same API (`describe`, `test`, `expect`), better performance.

---

## Runtime & Tooling

### Node.js

**Purpose:** JavaScript runtime for server-side and desktop application code

**Why:** Node.js enables JavaScript in the Electron main process, providing filesystem access, IPC handling, and database operations.

**Project:** https://nodejs.org/

Node.js runs ligeon's main process, handling window management, IPC communication, file dialogs, database operations, and PGN import streaming.

### Lucide React

**Purpose:** Icon component library

**Why:** Lucide provides a consistent set of SVG icons as React components, reducing design work and maintaining visual consistency.

**Project:** https://lucide.dev/

Lucide icons are used throughout ligeon's UI for navigation buttons (⏮ ◀ ▶ ⏭), play/pause controls, and menu icons. The icons adapt to the dark theme and scale responsively.

---

## Project Management

### electron-builder

**Purpose:** Electron app packaging and building

**Why:** electron-builder automates packaging for local testing and development builds. For personal use (no distribution).

**Project:** https://www.electron.build/

electron-builder packages ligeon into a local Electron app for testing. No code signing, notarization, or installer creation for this personal-use project.

---

## Architecture Summary

**Three-Layer Architecture:**

1. **Main Process (Electron + Node.js):** Manages windows, IPC, file system, collections directory, database operations, and PGN import with chessops.

2. **Renderer Process (React + TypeScript):** Displays UI, manages game navigation, handles user interactions, plays sounds, and visualizes the chess board with chessground.

3. **Data Layer (SQLite):** Persists games, collections, and metadata with indexed full-text search for fast filtering.

**Key Design Patterns:**

- **IPC Bridge:** Security-hardened context isolation separates main process from renderer, preventing direct Node.js access.
- **Streaming Import:** Large PGN files are imported with chessops' streaming iterator with progress updates, avoiding memory bloat.
- **CDN Audio:** Sound effects stream from Lichess CDN at runtime and cache in memory, eliminating bundle size.
- **Component-Based UI:** React components are composable and testable, with clear separation of concerns.
- **Type Safety:** TypeScript throughout for compile-time error detection and better maintainability.

---

## Why These Technologies?

**TypeScript** provides type safety critical for chess data structures (FEN, moves, metadata).

**chessops** is the Lichess standard for chess logic, with built-in PGN parsing and chessground integration.

**Vitest** is faster than Jest and the standard for Vite projects.

**pnpm** is the Lichess standard package manager—faster and more efficient.

**@lichess-org/chessground** is battle-tested by Lichess (300M games/month), ensuring quality and UX.

**Electron** provides true native apps for macOS and Windows from a single codebase.

**React** offers a mature ecosystem, excellent tooling, and widespread developer familiarity.

**Tailwind** eliminates CSS friction and provides a consistent design system.

**SQLite** is proven, serverless, and requires zero deployment complexity—perfect for a personal library app.

**Vite** significantly speeds up development with hot reload and fast builds.

---

## Performance Targets

- **Import:** 60 games in <5 seconds
- **Search:** Any query completes in <100ms
- **Navigation:** Move navigation <16ms (60fps smooth)
- **Audio:** Sound effects play without lag (Web Audio API)

---

## Cross-Platform Considerations

**macOS:** Native Electron app, local build for testing

**Windows:** Native Electron app, local build for testing

**Shared Code:** Electron main process, React UI, and database logic work identically on both platforms.

---

## Critical Differences from Original Plans

| Component | ❌ Original (Wrong) | ✅ Corrected |
|-----------|-------------------|--------------|
| Language | JavaScript (.jsx) | TypeScript (.tsx) |
| Chess library | chess.js | chessops |
| PGN parser | pgn-parser (separate) | chessops (built-in) |
| Package manager | npm | pnpm |
| Testing | Jest | Vitest |
| Move validation | "sloppy mode" hack | Native chessops notation support |

These corrections align ligeon with the actual Lichess technology stack.
