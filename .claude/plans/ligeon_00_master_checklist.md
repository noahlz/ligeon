# ligeon - Master Implementation Checklist

**Project:** Lightweight chess PGN database browser (macOS + Windows)
**App ID:** io.github.ligeon
**Tech Stack:** Electron, React 18, TypeScript, Tailwind CSS, SQLite, chessops, @lichess-org/chessground

**Actions to complete for MVP:**

### Phase 1: Project Setup & Infrastructure

**Part 1 - Configuration Files:**
- [x] Create package.json with dependencies: pnpm, chessops, @lichess-org/chessground
- [x] Create tsconfig.json for TypeScript
- [x] Create vite.config.ts with React plugin
- [x] Create tailwind.config.ts with color palette
- [x] Create postcss.config.js with tailwind and autoprefixer
- [x] Create vitest.config.ts
- [x] Create electron-builder.json (appId: io.github.ligeon)
- [x] Create index.html with React root div (at project root for Vite)
- [x] Create directory structure (electron/ipc, src/components, src/hooks, src/utils, __tests__, resources)
- [x] Run `pnpm install` successfully
- [x] Verify `pnpm run build:vite` creates dist/
- [x] Verify `pnpm run dev` starts without errors - FAILED - switching to npm
- [x] Update .gitignore (node_modules, dist, .db, .logs)

**Part 1 - Placeholder Components:**
- [x] Create src/index.tsx (React entry point)
- [x] Create src/App.tsx (placeholder)
- [x] Create electron/main.ts (basic window setup)
- [x] Create electron/preload.ts (empty contextBridge)
- [x] Create src/styles/index.css (Tailwind + custom styles)

---

### Phase 2: Electron Main Process

**Part 2.0 - Use npm for build**
- [ ] Revise the project to use `npm` with vite. Remove `pnpm` from the project
- [ ] Rebuild project
- [ ] Verify `npm run dev` works
- [ ] Remove references to `pnpm` from `TECHNOLOGY_OVERVIEW.md`, `CLAUDE.md`, other md files.

**Part 2.1 - Main Process:**
- [ ] Create electron/main.ts with full implementation
- [ ] Implement createWindow() with min/max dimensions
- [ ] Implement initializeApp() with collections directory setup
- [ ] Implement setupIpcHandlers() with select-file, import-pgn, cancel-import
- [ ] Handle list-collections, rename-collection, delete-collection
- [ ] Handle search-games, get-game-moves (stubs)
- [ ] Test: App opens without errors
- [ ] Test: Collections directory created in ~/.ligeon/collections/
- [ ] Test: DevTools opens in development mode

**Part 2.2 - Security Bridge:**
- [ ] Create electron/preload.ts with contextBridge
- [ ] Expose selectFile, importPgn, cancelImport via IPC
- [ ] Expose listCollections, renameCollection, deleteCollection
- [ ] Expose searchGames, getGameMoves
- [ ] Expose onImportProgress with event listeners
- [ ] Test: window.electron object accessible in React
- [ ] Test: IPC methods callable from React

---

### Phase 3: Database & I/O Layer

**Part 3.1 - SQLite Database:**
- [ ] Create electron/ipc/gameDatabase.ts (GameDatabase class)
- [ ] Implement createSchema() with 8 indices
- [ ] Implement insertGame() and insertGamesBatch()
- [ ] Implement searchGames() with dynamic filtering
- [ ] Implement getGameWithMoves() and getGameCount()
- [ ] Implement close() and clearGames()
- [ ] Create unit tests for database operations
- [ ] Test: All CRUD operations work correctly

**Part 3.2 - Data Converters:**
- [ ] Create src/utils/dateConverter.ts (pgnDateToTimestamp, timestampToDisplay)
- [ ] Create src/utils/resultConverter.ts (convertResult, resultNumericToDisplay)
- [ ] Create __tests__/unit/dateConverter.test.ts
- [ ] Create __tests__/unit/resultConverter.test.ts
- [ ] Test: All converters handle edge cases

**Part 3.3 - Collection & Game Handlers:**
- [ ] Create electron/ipc/collectionHandlers.ts (list, rename, delete)
- [ ] Create electron/ipc/gameHandlers.ts (search, getGameMoves)
- [ ] Update electron/main.ts to import and wire handlers
- [ ] Test: Collection operations work
- [ ] Test: Game queries return correct data

---

### Phase 4: Chess Logic & PGN Parsing (chessops)

**Part 4.1 - Chess Manager:**
- [ ] Create src/utils/chessManager.ts using chessops
- [ ] Implement loadGame(), nextMove(), prevMove(), goToMove()
- [ ] Implement goToStart(), goToEnd(), getCurrentFEN()
- [ ] Implement getLastMove() for board highlighting
- [ ] Use chessops/chess for move execution
- [ ] Use chessops/fen for FEN generation
- [ ] Create __tests__/unit/chessManager.test.ts
- [ ] Test: All move operations work correctly

**Part 4.2 - PGN Import Handler:**
- [ ] Create electron/ipc/importHandlers.ts using chessops parsePgn()
- [ ] Implement streaming import with chessops iterator
- [ ] Implement result validation and skip logic
- [ ] Implement progress logging every 10,000 games
- [ ] Implement detailed skip reason logging
- [ ] Implement final statistics summary
- [ ] Create __tests__/integration/importAndReplay.test.ts
- [ ] Test: Import sample PGN file successfully
- [ ] Test: Progress events sent to renderer
- [ ] Test: Skipped games logged with reasons

**Part 4.3 - Import Complete:**
- [ ] Wire importAndIndexPgn to electron/main.ts import-pgn handler
- [ ] Test: Complete import workflow end-to-end

---

### Phase 5: React UI Components

**Part 5.1 - Entry Point & Styles:**
- [ ] Create src/index.tsx (React root entry)
- [ ] Create src/styles/index.css (Tailwind + move-list styles + chessground CSS)
- [ ] Import @lichess-org/chessground CSS
- [ ] Test: React mounts to #root

**Part 5.2 - Audio System:**
- [ ] Create src/utils/audioManager.ts (AudioManager class)
- [ ] Implement CDN streaming from Lichess
- [ ] Implement in-memory buffer caching
- [ ] Implement playMove(), playCapture(), playCastling()
- [ ] Test: Sounds stream from Lichess CDN
- [ ] Test: Sounds cached after first play
- [ ] Test: Error handling for network failures

**Part 5.3 - Chess & Board Components:**
- [ ] Create src/components/BoardDisplay.tsx (Chessground integration)
- [ ] Implement FEN-based board updates with lastMove highlighting
- [ ] Create src/components/MoveList.tsx (move list with highlighting)
- [ ] Implement click-to-jump and auto-scroll to current move
- [ ] Create src/hooks/useAutoPlay.ts (timer-based auto-advance)
- [ ] Test: Board updates correctly with FEN
- [ ] Test: Moves highlight and scroll properly
- [ ] Test: Auto-play advances at 3s and 10s speeds

**Part 5.4 - Navigation & Game Info:**
- [ ] Create src/components/MoveNavigation.tsx (⏮ ◀ ▶ ⏭ + play menu)
- [ ] Implement keyboard shortcuts (Home, ←, →, End, Space)
- [ ] Implement play button with speed menu (Fast/Slow)
- [ ] Create src/components/GameInfo.tsx (game metadata + Lichess link)
- [ ] Test: Navigation buttons and keyboard work
- [ ] Test: Play menu shows and starts auto-play
- [ ] Test: Lichess link sends full PGN

**Part 5.5 - Game & Collection Browsing:**
- [ ] Create src/components/GameListSidebar.tsx (search/filter/list)
- [ ] Implement search by player name and result filter
- [ ] Create src/components/CollectionSelector.tsx (dropdown + import)
- [ ] Create src/components/ImportDialog.tsx (progress + logs)
- [ ] Test: Search and filter games
- [ ] Test: Collection selection works
- [ ] Test: Import dialog shows progress

**Part 5.6 - Main App Component:**
- [ ] Create src/App.tsx (full orchestration)
- [ ] Implement state management (collections, selectedGame, moveIndex, FEN)
- [ ] Implement audio initialization on first click
- [ ] Implement move handlers with sound detection
- [ ] Implement capture detection (piece count comparison in FEN)
- [ ] Implement castling detection (king distance in FEN)
- [ ] Wire all components together
- [ ] Create __tests__/unit/components/*.test.tsx
- [ ] Test: App startup and collections load
- [ ] Test: Game selection and move replay
- [ ] Test: Sounds play (move, capture, castling)

---

### Phase 6: Testing

**Part 6.1 - Unit Tests (Core):**
- [ ] __tests__/unit/dateConverter.test.ts
- [ ] __tests__/unit/resultConverter.test.ts
- [ ] __tests__/unit/gameDatabase.test.ts
- [ ] __tests__/unit/chessManager.test.ts
- [ ] Run all and verify coverage > 60%

**Part 6.2 - Component Tests:**
- [ ] __tests__/unit/components/BoardDisplay.test.tsx
- [ ] __tests__/unit/components/MoveList.test.tsx
- [ ] __tests__/unit/components/GameInfo.test.tsx
- [ ] Setup mocks for window.electron IPC calls
- [ ] Test: All components render without errors

**Part 6.3 - Integration Tests:**
- [ ] __tests__/integration/importAndReplay.test.ts
- [ ] __tests__/integration/chessLogic.test.ts
- [ ] Test: Import PGN → database queries → move replay
- [ ] Test: Sound detection (capture, castling)

**Part 6.4 - Performance & Quality:**
- [ ] __tests__/performance/indexing.test.ts
- [ ] Run `pdnpm test` - all tests pass
- [ ] Run `pnpm test:coverage` - verify > 60% coverage on all metrics
- [ ] No console errors in production build

---

### Phase 7: Local Build & Run

**Part 7 - Local Build Testing:**
- [ ] Create LICENSE file (GPL v3)
- [ ] Test: `pnpm run build:vite` completes and creates dist/
- [ ] Test: `pnpm run build` packages Electron app locally
- [ ] Test: Packaged app runs without errors
- [ ] Test: Import PGN, navigate games, play sounds

---

### Phase 8: Final Integration Testing

**Part 8.1 - App Startup:**
- [ ] App opens and renders without errors
- [ ] Collections directory created at ~/.ligeon/collections/
- [ ] Collections dropdown populated correctly
- [ ] Can switch between collections
- [ ] Audio initializes on first user click

**Part 8.2 - Game Browsing & Search:**
- [ ] Game list loads and displays correctly
- [ ] Search by player name (white/black) works
- [ ] Filter by result (Any/White/Black/Draw) works
- [ ] Combine search + filter works
- [ ] Reset filters clears all filters
- [ ] Shows correct game count

**Part 8.3 - Game Replay & Navigation:**
- [ ] Clicking game loads board and moves
- [ ] Move list displays with numbers (1., 2., etc.)
- [ ] Navigation buttons work (⏮ ◀ ▶ ⏭)
- [ ] Keyboard shortcuts work (Home, ←, →, End, Space)
- [ ] Current move highlighted with orange background
- [ ] Move list auto-scrolls to current move
- [ ] Board updates with correct FEN
- [ ] lastMove highlighting shows on board
- [ ] Can click move to jump to position

**Part 8.4 - Audio & Sound Effects:**
- [ ] Move sound plays on normal moves
- [ ] Capture sound plays on captures
- [ ] Castling sound plays on castling moves
- [ ] Sounds stream from Lichess CDN (no bundling)
- [ ] Sounds cache in memory after first play
- [ ] Graceful handling of network errors

**Part 8.5 - Auto-Play:**
- [ ] Play button opens speed menu (Fast 3s / Slow 10s)
- [ ] Fast speed: moves every 3 seconds
- [ ] Slow speed: moves every 10 seconds
- [ ] Auto-play stops at last move
- [ ] Navigation buttons stop auto-play
- [ ] Pause button works during playback

**Part 8.6 - Game Info & Lichess Integration:**
- [ ] Game info shows: White, Black, Event, Date, Result, ECO
- [ ] Ratings display when available
- [ ] "View on Lichess" button opens in browser
- [ ] Full PGN sent to Lichess API

**Part 8.7 - Collection Management:**
- [ ] Import New button opens import dialog
- [ ] Can name collection and select PGN file
- [ ] Progress bar shows import progress
- [ ] Live logs display with auto-scroll
- [ ] Skipped games logged with reasons
- [ ] Can rename collection from dropdown
- [ ] Can delete collection with confirmation
- [ ] Collection list updates after operations

**Part 8.8 - Edge Cases:**
- [ ] Empty PGN file: shows 0 games imported
- [ ] PGN with unfinished games (*): skipped correctly
- [ ] Games with special characters: imported correctly
- [ ] Search with no results: shows empty list
- [ ] Network error on sound: graceful fallback
- [ ] Malformed moves in PGN: stops gracefully

**Part 8.9 - Performance & Quality:**
- [ ] 60-game import completes in < 5 seconds
- [ ] Search query completes in < 100ms
- [ ] Board updates smoothly on navigation
- [ ] No memory leaks on long sessions
- [ ] Audio plays without lag
- [ ] All tests pass (`npm test`)
- [ ] Coverage > 60% on all metrics

---

## Implementation Guides (Detailed Steps)

For detailed step-by-step implementation, refer to:
- **ligeon_01_project_setup.md** - Init project with npm, TypeScript, chessops
- **ligeon_02_electron_main.md** - Create main process, IPC handlers, window setup
- **ligeon_03_database_io.md** - SQLite schema, CRUD ops, data converters
- **ligeon_04_chess_pgn.md** - Chess logic and PGN import with chessops
- **ligeon_05_react_components.md** - Create all UI components
- **ligeon_06_testing.md** - Run full test suite with Vitest
- **ligeon_07_build.md** - Local build and testing

---

## Quick Reference: Core Commands

```bash
npm install               # Setup: install all dependencies
npm run dev               # Dev: start Vite + Electron
npm test                  # Test: run all unit/integration tests
npm test:coverage         # Test: generate coverage report
npm run build:vite        # Build: create React bundle
npm run build             # Build: package Electron app locally
```

---

## Success Criteria for MVP

**App is complete when:**
1. ✅ Startup: Opens without errors, collections dir exists
2. ✅ Browse: Lists games, search by player, filter by result
3. ✅ Replay: Select game → board shows correct position → navigation works
4. ✅ Navigate: ⏮ ◀ ▶ ⏭ buttons + keyboard (Home, ←, →, End, Space)
5. ✅ AutoPlay: Play button → speed menu → 3s/10s auto-advance works
6. ✅ Sounds: Move, capture, castling sounds play from Lichess CDN
7. ✅ Collections: Import PGN with progress, rename, delete collections
8. ✅ Analysis: "View on Lichess" sends full PGN to Lichess analysis
9. ✅ Tests: All unit tests pass, coverage > 60% on all metrics
10. ✅ Build: Local Electron build works correctly

---

## Key Architectural Decisions

- **Language:** TypeScript for type safety
- **Chess Logic:** chessops - Lichess standard
- **PGN Parsing:** chessops parsePgn()
- **Package Manager:** npm - Node.js standard (Lichess uses pnpm, but that tool doesn't work with electron apps) 
- **Testing:** Vitest - fast with TypeScript support
- **Audio:** Stream from Lichess CDN, cache in memory
- **Board:** @lichess-org/chessground 
- **Database:** SQLite via better-sqlite3 for full-text search
- **Collections:** Multiple independent .db files with metadata.json
- **Import:** Stream PGN with chessops iterator, skip invalid games
