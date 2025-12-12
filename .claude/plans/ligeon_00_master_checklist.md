# ligeon - Master Implementation Checklist

**Project:** lightweight chess PGN database browser (macOS + Windows)
**App ID:** io.github.ligeon
**Tech Stack:** Electron, React 18, Tailwind CSS, SQLite, chess.js, chessground

**Actions to complete for MVP:**

### Phase 1: Project Setup & Infrastructure

**Part 1 - Configuration Files:**
- [ ] Create package.json with all dependencies and scripts
- [ ] Create vite.config.js with React plugin
- [ ] Create tailwind.config.js with color palette
- [ ] Create postcss.config.js with tailwind and autoprefixer
- [ ] Create jest.config.js with jsdom environment
- [ ] Create jest.setup.js with @testing-library/jest-dom
- [ ] Create electron-builder.json (appId: io.github.ligeon)
- [ ] Create public/index.html with React root div
- [ ] Create .gitignore (node_modules, dist, .db, .env)
- [ ] Create directory structure (electron/ipc, src/components, src/hooks, src/utils, __tests__, resources)
- [ ] Run `npm install` successfully
- [ ] Verify `npm run build` creates dist/
- [ ] Verify `npm run dev` starts without errors

**Part 1 - Placeholder Components:**
- [ ] Create src/index.jsx (React entry point)
- [ ] Create src/App.jsx (placeholder)
- [ ] Create electron/main.js (basic window setup)
- [ ] Create electron/preload.js (empty contextBridge)
- [ ] Create src/styles/index.css (Tailwind + custom styles)

---

### Phase 2: Electron Main Process

**Part 2.1 - Main Process:**
- [ ] Create electron/main.js with full implementation
- [ ] Implement createWindow() with min/max dimensions
- [ ] Implement initializeApp() with collections directory setup
- [ ] Implement setupIpcHandlers() with select-file, import-pgn, cancel-import
- [ ] Handle list-collections, rename-collection, delete-collection
- [ ] Handle search-games, get-game-moves (stubs)
- [ ] Test: App opens without errors
- [ ] Test: Collections directory created in ~/.ligeon/collections/
- [ ] Test: DevTools opens in development mode

**Part 2.2 - Security Bridge:**
- [ ] Create electron/preload.js with contextBridge
- [ ] Expose selectFile, importPgn, cancelImport via IPC
- [ ] Expose listCollections, renameCollection, deleteCollection
- [ ] Expose searchGames, getGameMoves
- [ ] Expose onImportProgress with event listeners
- [ ] Test: window.electron object accessible in React
- [ ] Test: IPC methods callable from React

---

### Phase 3: Database & I/O Layer

**Part 3.1 - SQLite Database:**
- [ ] Create electron/ipc/gameDatabase.js (GameDatabase class)
- [ ] Implement createSchema() with 8 indices
- [ ] Implement insertGame() and insertGamesBatch()
- [ ] Implement searchGames() with dynamic filtering
- [ ] Implement getGameWithMoves() and getGameCount()
- [ ] Implement close() and clearGames()
- [ ] Create unit tests for database operations
- [ ] Test: All CRUD operations work correctly

**Part 3.2 - Data Converters:**
- [ ] Create src/utils/dateConverter.js (pgnDateToTimestamp, timestampToDisplay)
- [ ] Create src/utils/resultConverter.js (convertResult, resultNumericToDisplay)
- [ ] Create __tests__/unit/dateConverter.test.js
- [ ] Create __tests__/unit/resultConverter.test.js
- [ ] Test: All converters handle edge cases

**Part 3.3 - Collection & Game Handlers:**
- [ ] Create electron/ipc/collectionHandlers.js (list, rename, delete)
- [ ] Create electron/ipc/gameHandlers.js (search, getGameMoves)
- [ ] Update electron/main.js to import and wire handlers
- [ ] Test: Collection operations work
- [ ] Test: Game queries return correct data

---

### Phase 4: PGN Parsing & Indexing

**Part 4.1 - PGN Parser:**
- [ ] Create src/utils/pgnParser.js
- [ ] Implement parseGameMetadata() using pgn-parser
- [ ] Implement parseGameMoves()
- [ ] Implement parsePgnGame()
- [ ] Create __tests__/unit/pgnParser.test.js
- [ ] Test: Parse complete games with headers and moves
- [ ] Test: Handle missing headers gracefully

**Part 4.2 - Import Handler:**
- [ ] Create electron/ipc/importHandlers.js (importAndIndexPgn function)
- [ ] Implement readline streaming for large files
- [ ] Implement game parsing loop with blank line detection
- [ ] Implement result validation and skip logic
- [ ] Implement progress logging every 10,000 games
- [ ] Implement detailed skip reason logging
- [ ] Implement final statistics summary
- [ ] Create __tests__/integration/importAndReplay.test.js
- [ ] Test: Import sample PGN file successfully
- [ ] Test: Progress events sent to renderer
- [ ] Test: Skipped games logged with reasons

**Part 4.3 - Import Complete:**
- [ ] Wire importAndIndexPgn to electron/main.js import-pgn handler
- [ ] Test: Complete import workflow end-to-end

---

### Phase 5: React UI Components

**Part 5.1 - Entry Point & Styles:**
- [ ] Create src/index.jsx (React root entry)
- [ ] Create src/styles/index.css (Tailwind + move-list styles)
- [ ] Test: React mounts to #root

**Part 5.2 - Audio System:**
- [ ] Create src/utils/audioManager.js (AudioManager class)
- [ ] Implement CDN streaming from Lichess
- [ ] Implement in-memory buffer caching
- [ ] Implement playMove(), playCapture(), playCastling()
- [ ] Test: Sounds stream from Lichess CDN
- [ ] Test: Sounds cached after first play
- [ ] Test: Error handling for network failures

**Part 5.3 - Chess Logic & Auto-Play:**
- [ ] Create src/utils/chessManager.js (ChessManager class)
- [ ] Implement loadGame, nextMove, prevMove, goToMove
- [ ] Implement goToStart, goToEnd, getCurrentFEN
- [ ] Create src/hooks/useAutoPlay.js (useAutoPlay hook)
- [ ] Implement start(speed), stop(), pause()
- [ ] Create __tests__/unit/chessManager.test.js
- [ ] Create __tests__/integration/chessLogic.test.js
- [ ] Test: All move operations work correctly
- [ ] Test: Auto-play advances at 3s and 10s speeds

**Part 5.4 - Board & Move Display:**
- [ ] Create src/components/BoardDisplay.jsx (Chessground integration)
- [ ] Implement FEN-based board updates
- [ ] Create src/components/MoveList.jsx (move list with highlighting)
- [ ] Implement click-to-jump and auto-scroll to current move
- [ ] Test: Board updates correctly with FEN
- [ ] Test: Moves highlight and scroll properly

**Part 5.5 - Navigation & Game Info:**
- [ ] Create src/components/MoveNavigation.jsx (⏮ ◀ ▶ ⏭ + play menu)
- [ ] Implement keyboard shortcuts (Home, ←, →, End, Space)
- [ ] Implement play button with speed menu (Fast/Slow)
- [ ] Implement pause button during auto-play
- [ ] Create src/components/GameInfo.jsx (game metadata + Lichess link)
- [ ] Test: Navigation buttons and keyboard work
- [ ] Test: Play menu shows and starts auto-play
- [ ] Test: Lichess link sends full PGN

**Part 5.6 - Game & Collection Browsing:**
- [ ] Create src/components/GameListSidebar.jsx (search/filter/list)
- [ ] Implement search by player name and result filter
- [ ] Create src/components/CollectionSelector.jsx (dropdown + import)
- [ ] Test: Search and filter games
- [ ] Test: Collection selection works

**Part 5.7 - Import Dialog:**
- [ ] Create src/components/ImportDialog.jsx (name input + file picker + progress)
- [ ] Implement progress bar and live log output with auto-scroll
- [ ] Test: Dialog opens, accepts name, selects file, shows progress

**Part 5.8 - Main App Component:**
- [ ] Create src/App.jsx (full orchestration)
- [ ] Implement state management (collections, selectedGame, moveIndex, FEN)
- [ ] Implement audio initialization on first click
- [ ] Implement move handlers with sound detection
- [ ] Implement capture detection (piece count comparison in FEN)
- [ ] Implement castling detection (king distance in FEN)
- [ ] Wire all components together
- [ ] Create __tests__/unit/components/*.test.jsx (BoardDisplay, MoveList, GameInfo tests)
- [ ] Test: App startup and collections load
- [ ] Test: Game selection and move replay
- [ ] Test: Sounds play (move, capture, castling)
- [ ] Test: All components render and interact

---

### Phase 6: Chess Logic

**Part 6.1 - Chess Manager (Created in Part 5):**
- [ ] Review src/utils/chessManager.js implementation
- [ ] Verify all methods work with sloppy notation
- [ ] Verify error handling for malformed moves
- [ ] Test: Backward navigation recalculates correctly
- [ ] Test: Edge cases (empty game, boundary conditions)

---

### Phase 7: Testing

**Part 7.1 - Unit Tests (Core):**
- [ ] __tests__/unit/dateConverter.test.js (already created in Part 3)
- [ ] __tests__/unit/resultConverter.test.js (already created in Part 3)
- [ ] __tests__/unit/database.test.js (already created in Part 3)
- [ ] __tests__/unit/pgnParser.test.js (already created in Part 4)
- [ ] __tests__/unit/chessManager.test.js (already created in Part 6)
- [ ] Run all and verify coverage > 60%

**Part 7.2 - Component Tests:**
- [ ] __tests__/unit/components/BoardDisplay.test.jsx
- [ ] __tests__/unit/components/MoveList.test.jsx
- [ ] __tests__/unit/components/GameInfo.test.jsx
- [ ] Setup mocks for window.electron IPC calls
- [ ] Test: All components render without errors

**Part 7.3 - Integration Tests:**
- [ ] __tests__/integration/importAndReplay.test.js (already created in Part 4)
- [ ] __tests__/integration/chessLogic.test.js (already created in Part 6)
- [ ] Test: Import PGN → database queries → move replay
- [ ] Test: Sound detection (capture, castling)

**Part 7.4 - Performance & Quality:**
- [ ] __tests__/performance/indexing.test.js
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:coverage` - verify > 60% coverage on all metrics
- [ ] No console errors in production build

---

### Phase 8: Static Assets & Resources

**Part 8.1 - Sample Games:**
- [ ] Download Bobby Fischer 60 games from chessgames.com
- [ ] Export as PGN format
- [ ] Save to resources/sample-games/bobby-fischer-60.pgn
- [ ] Verify PGN is valid with 60 games
- [ ] Create resources/sample-games/metadata.json

**Part 8.2 - Icons & Assets:**
- [ ] Design 1024x1024 app icon
- [ ] Create resources/icons/icon.icns (macOS)
- [ ] Create resources/icons/icon.ico (Windows)
- [ ] Create resources/dmg-background.png (540x380, macOS DMG)
- [ ] Create resources/entitlements.mac.plist (macOS code signing)

---

### Phase 9: Build & Distribution

**Part 9.1 - Build Configuration:**
- [ ] Update package.json with build scripts and dependencies
- [ ] Update electron-builder.json with all platforms config
- [ ] Create LICENSE file (MIT or other)
- [ ] Create .github/workflows/release.yml (CI/CD)

**Part 9.2 - Code Signing Setup (Optional):**
- [ ] macOS: Create .env.local with APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID
- [ ] Windows: Obtain code signing certificate (optional)
- [ ] Add .env.local to .gitignore

**Part 9.3 - Build Process:**
- [ ] Test: `npm run build` completes and creates dist/
- [ ] Test: `npm run electron:build:mac` creates .dmg
- [ ] Test: `npm run electron:build:win` creates .exe
- [ ] Verify installer works on fresh machines
- [ ] Test app functionality in production build

---

### Phase 10: Integration & Final Testing

**Part 10.1 - App Startup:**
- [ ] App opens and renders without errors
- [ ] Collections directory created at ~/.ligeon/collections/
- [ ] Collections dropdown populated correctly
- [ ] Can switch between collections
- [ ] Audio initializes on first user click

**Part 10.2 - Game Browsing & Search:**
- [ ] Game list loads and displays correctly
- [ ] Search by player name (white/black) works
- [ ] Filter by result (Any/White/Black/Draw) works
- [ ] Combine search + filter works
- [ ] Reset filters clears all filters
- [ ] Shows correct game count

**Part 10.3 - Game Replay & Navigation:**
- [ ] Clicking game loads board and moves
- [ ] Move list displays with numbers (1., 2., etc.)
- [ ] Navigation buttons work (⏮ ◀ ▶ ⏭)
- [ ] Keyboard shortcuts work (Home, ←, →, End, Space)
- [ ] Current move highlighted with orange background
- [ ] Move list auto-scrolls to current move
- [ ] Board updates with correct FEN
- [ ] Can click move to jump to position

**Part 10.4 - Audio & Sound Effects:**
- [ ] Move sound plays on normal moves
- [ ] Capture sound plays on captures
- [ ] Castling sound plays on castling moves
- [ ] Sounds stream from Lichess CDN (no bundling)
- [ ] Sounds cache in memory after first play
- [ ] Graceful handling of network errors

**Part 10.5 - Auto-Play:**
- [ ] Play button opens speed menu (Fast 3s / Slow 10s)
- [ ] Fast speed: moves every 3 seconds
- [ ] Slow speed: moves every 10 seconds
- [ ] Auto-play stops at last move
- [ ] Navigation buttons stop auto-play
- [ ] Pause button works during playback
- [ ] Speed indicator shows current speed

**Part 10.6 - Game Info & Lichess Integration:**
- [ ] Game info shows: White, Black, Event, Date, Result, ECO
- [ ] Ratings display when available
- [ ] "View on Lichess" button opens in browser
- [ ] Full PGN sent to Lichess API

**Part 10.7 - Collection Management:**
- [ ] Import New button opens import dialog
- [ ] Can name collection and select PGN file
- [ ] Progress bar shows import progress
- [ ] Live logs display with auto-scroll
- [ ] Skipped games logged with reasons
- [ ] Can rename collection from dropdown
- [ ] Can delete collection with confirmation
- [ ] Collection list updates after operations

**Part 10.8 - Edge Cases:**
- [ ] Empty PGN file: shows 0 games imported
- [ ] PGN with missing Result field: skipped
- [ ] PGN with unfinished games (*): skipped
- [ ] Games with special characters: imported correctly
- [ ] Search with no results: shows empty list
- [ ] Network error on sound: graceful fallback
- [ ] Malformed moves in PGN: stops gracefully

**Part 10.9 - Platform Verification (macOS):**
- [ ] App builds with `npm run electron:build:mac`
- [ ] DMG installer mounts and works
- [ ] App launches from Applications folder
- [ ] File dialogs work correctly
- [ ] No console errors in production

**Part 10.10 - Platform Verification (Windows):**
- [ ] App builds with `npm run electron:build:win`
- [ ] NSIS installer runs and installs
- [ ] App launches from Start Menu
- [ ] File dialogs work correctly
- [ ] No console errors in production

**Part 10.11 - Performance & Quality:**
- [ ] 60-game import completes in < 5 seconds
- [ ] Search query completes in < 100ms
- [ ] Board updates smoothly on navigation
- [ ] No memory leaks on long sessions
- [ ] Audio plays without lag
- [ ] All tests pass (`npm test`)
- [ ] Coverage > 60% on all metrics

---

---

## Implementation Guides (Detailed Steps)

For detailed step-by-step implementation, refer to:
- **ligeon_01_project_setup.md** - Init project, install deps, create config files
- **ligeon_02_electron_main.md** - Create main process, IPC handlers, window setup
- **ligeon_03_database_io.md** - SQLite schema, CRUD ops, data converters
- **ligeon_04_pgn_parsing.md** - Parse PGN files, import handler, progress logging
- **ligeon_05-1_react_components.md** - Create UI components (board, moves, etc)
- **ligeon_05-2_react_components.md** - Create App.jsx and wire everything
- **ligeon_06_chess_logic.md** - Verify ChessManager works with all edge cases
- **ligeon_07_testing.md** - Run full test suite, verify coverage > 60%
- **ligeon_08_build_dist.md** - Build installers, code sign, release

---

## Quick Reference: Core Commands

```bash
npm install                 # Setup: install all dependencies
npm run dev                # Dev: start Vite + Electron
npm test                   # Test: run all unit/integration tests
npm run test:coverage      # Test: generate coverage report
npm run build              # Build: create production bundle
npm run electron:build:mac # Build: macOS .dmg installer
npm run electron:build:win # Build: Windows .exe installer
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
10. ✅ Install: DMG (macOS) and EXE (Windows) installers work correctly

---

## Key Architectural Decisions

- **Audio:** Stream from Lichess CDN (not bundled), cache in memory
- **Board:** Use Chessground (production-ready, no custom implementation)
- **Chess Logic:** Use chess.js for FEN generation and move execution only
- **Database:** SQLite via better-sqlite3 for full-text search and filtering
- **Collections:** Multiple independent .db files with metadata.json
- **Import:** Stream PGN line-by-line for large files, skip invalid games
- **First Run:** Auto-import bundled Bobby Fischer 60 games
