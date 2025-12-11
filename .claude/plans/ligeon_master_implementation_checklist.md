# ligeon - Implementation Plan Overview

A lightweight chess PGN database browser for macOS and Windows. Browse, search, and replay your chess game collections with one-click analysis on Lichess.

**Project Name:** ligeon (pigeon + Lichess)  
**App ID:** io.github.ligeon  
**Platforms:** macOS + Windows  
**Tech Stack:** Electron, React 18, Tailwind CSS, SQLite, chess.js, chessground

---

## 📋 Master Implementation Checklist

### Phase 1: Project Setup & Infrastructure

**Part 1 - Configuration Files:**
- [ ] Create package.json with all dependencies
- [ ] Create vite.config.js
- [ ] Create tailwind.config.js
- [ ] Create jest.config.js
- [ ] Create jest.setup.js
- [ ] Create electron-builder.json (appId: io.github.ligeon)
- [ ] Create postcss.config.js
- [ ] Create public/index.html
- [ ] Create .gitignore
- [ ] Run `npm install` successfully
- [ ] Verify `npm run dev` starts without errors

---

### Phase 2: Electron Main Process

**Part 2.1 - Main Process:**
- [ ] Create electron/main.js
- [ ] Implement createWindow()
- [ ] Implement initializeApp() with collections directory setup
- [ ] Implement autoImportSampleGames() for first-run experience
- [ ] Implement setupIpcHandlers()
- [ ] Test: App opens without errors
- [ ] Test: Collections directory created if missing
- [ ] Test: First run auto-imports Bobby Fischer 60

**Part 2.2 - Security Bridge:**
- [ ] Create electron/preload.js
- [ ] Expose all IPC methods via contextBridge
- [ ] Test: window.electron object accessible in React

---

### Phase 3: Database & I/O Layer

**Part 3.1 - SQLite Database:**
- [ ] Create electron/ipc/gameDatabase.js
- [ ] Implement createSchema() with proper indices
- [ ] Implement insertGame() and insertGamesBatch()
- [ ] Implement searchGames() with all filter types
- [ ] Implement getGameWithMoves()
- [ ] Test: Database operations work with test data
- [ ] Test: Search with various filter combinations

**Part 3.2 - Data Converters:**
- [ ] Create src/utils/dateConverter.js
- [ ] Test: PGN dates convert to timestamps correctly
- [ ] Create src/utils/resultConverter.js
- [ ] Test: All result types handle correctly (1-0, 0-1, 1/2-1/2, *)

---

### Phase 4: PGN Parsing & Indexing

**Part 4.1 - PGN Parser:**
- [ ] Create src/utils/pgnParser.js
- [ ] Implement parseGameMetadata() using pgn-parser
- [ ] Implement parseGameMoves()
- [ ] Test: Parse sample PGN data correctly
- [ ] Test: Handle edge cases (missing fields, malformed PGN)

**Part 4.2 - Import Handler:**
- [ ] Create electron/ipc/importHandlers.js
- [ ] Implement file streaming with readline
- [ ] Implement game parsing loop
- [ ] Implement result validation and skip logic
- [ ] Implement progress logging every 10,000 games
- [ ] Implement detailed skip reason logging
- [ ] Test: Import sample PGN file
- [ ] Test: Progress logs output correctly
- [ ] Test: Skipped games logged with reasons

**Part 4.3 - Collection Management:**
- [ ] Create electron/ipc/collectionHandlers.js
- [ ] Implement listCollections()
- [ ] Implement createCollection()
- [ ] Implement renameCollection()
- [ ] Implement deleteCollection()
- [ ] Test: All collection operations work
- [ ] Test: Rename and delete without data loss

**Part 4.4 - Game Queries:**
- [ ] Create electron/ipc/gameHandlers.js
- [ ] Implement searchGames() with dynamic filtering
- [ ] Implement getGameMoves() with PGN parsing
- [ ] Test: Search works with various filters
- [ ] Test: Game retrieval returns full PGN and moves

---

### Phase 5: React UI Components

**Part 5.1 - Entry Point:**
- [ ] Create src/index.jsx
- [ ] Create src/styles/index.css with Tailwind + custom styles
- [ ] Test: React mounts correctly

**Part 5.2 - Audio System:**
- [ ] Create src/utils/audioManager.js
- [ ] Implement CDN streaming from Lichess
- [ ] Implement buffer caching for instant playback
- [ ] Implement playMove(), playCapture(), playCastling()
- [ ] Test: All sounds stream from Lichess CDN
- [ ] Test: Sounds cached in memory after first play
- [ ] Test: Error handling for network failures

**Part 5.3 - Auto-Play Hook:**
- [ ] Create src/hooks/useAutoPlay.js
- [ ] Implement start(speed), stop(), pause()
- [ ] Implement auto-stop at end of game
- [ ] Test: Auto-play advances at 3s and 10s speeds
- [ ] Test: Stops at last move
- [ ] Test: Can be paused

**Part 5.4 - Board Component:**
- [ ] Create src/components/BoardDisplay.jsx
- [ ] Integrate Chessground library
- [ ] Implement FEN-based board updates
- [ ] Test: Board renders and updates correctly
- [ ] Test: No drag/drop interactivity (view-only)

**Part 5.5 - Move Components:**
- [ ] Create src/components/MoveList.jsx
- [ ] Implement move display with highlighting
- [ ] Implement click-to-jump functionality
- [ ] Implement auto-scroll to current move
- [ ] Test: Moves display and highlight correctly
- [ ] Test: Click-to-jump works

**Part 5.6 - Navigation Component:**
- [ ] Create src/components/MoveNavigation.jsx
- [ ] Implement ⏮ ◀ ▶ ⏭ buttons
- [ ] Implement play button with speed menu popup
- [ ] Implement pause button during auto-play
- [ ] Implement keyboard shortcuts (Home, ←, →, End, Space)
- [ ] Implement auto-play stops on nav button click
- [ ] Test: Navigation buttons work and disable correctly
- [ ] Test: Play button shows speed menu
- [ ] Test: Auto-play advances and stops correctly
- [ ] Test: Keyboard shortcuts work
- [ ] Test: Pause button appears during playback

**Part 5.7 - Game Info Component:**
- [ ] Create src/components/GameInfo.jsx
- [ ] Display player names with ratings
- [ ] Display event, date, result, ECO code
- [ ] Implement "View on Lichess" button (sends full PGN)
- [ ] Test: All info displays correctly
- [ ] Test: Lichess link opens with full PGN

**Part 5.8 - Game List Component:**
- [ ] Create src/components/GameListSidebar.jsx
- [ ] Implement search input
- [ ] Implement result filter (Any/White/Black/Draw)
- [ ] Implement game list display
- [ ] Implement game selection
- [ ] Test: Games list displays
- [ ] Test: Search and filter work
- [ ] Test: Game selection works

**Part 5.9 - Collection Selector:**
- [ ] Create src/components/CollectionSelector.jsx
- [ ] Implement dropdown with collections list
- [ ] Implement rename dialog
- [ ] Implement delete confirmation dialog
- [ ] Test: Dropdown opens/closes
- [ ] Test: Rename and delete work

**Part 5.10 - Import Dialog:**
- [ ] Create src/components/ImportDialog.jsx
- [ ] Implement collection name input
- [ ] Implement file picker
- [ ] Implement progress bar
- [ ] Implement live log output with auto-scroll
- [ ] Test: Import dialog works
- [ ] Test: Progress bar updates
- [ ] Test: Logs display and scroll

**Part 5.11 - First Run Dialog:**
- [ ] Create src/components/FirstRunDialog.jsx
- [ ] Display welcome message
- [ ] Show bundled games info
- [ ] Test: Dialog appears on first run

**Part 5.12 - Main App Component:**
- [ ] Create src/App.jsx
- [ ] Implement overall state management
- [ ] Implement move navigation with sound playback
- [ ] Implement capture detection
- [ ] Implement castling detection
- [ ] Wire all components together
- [ ] Test: App startup and collection loading
- [ ] Test: Game browsing and selection
- [ ] Test: Move replay with correct sounds
- [ ] Test: Castling detected correctly
- [ ] Test: Audio manager initializes on first click

---

### Phase 6: Chess Logic

**Part 6.1 - Chess Manager:**
- [ ] Create src/utils/chessManager.js
- [ ] Implement game loading
- [ ] Implement move navigation (next, prev, jump)
- [ ] Implement goToStart(), goToEnd()
- [ ] Implement getCurrentFEN()
- [ ] Add error handling for malformed moves
- [ ] Test: Move navigation works correctly
- [ ] Test: FEN updates at each move
- [ ] Test: Error handling works

---

### Phase 7: Testing

**Part 7.1 - Unit Tests:**
- [ ] Create __tests__/unit/pgnParser.test.js
- [ ] Create __tests__/unit/database.test.js
- [ ] Create __tests__/unit/dateConverter.test.js
- [ ] Create __tests__/unit/resultConverter.test.js
- [ ] Run `npm test` and verify all pass
- [ ] Run `npm run test:coverage` - verify > 60% coverage

**Part 7.2 - Component Tests:**
- [ ] Create __tests__/unit/components/BoardDisplay.test.jsx
- [ ] Create __tests__/unit/components/MoveList.test.jsx
- [ ] Create __tests__/unit/components/GameListSidebar.test.jsx

**Part 7.3 - Integration Tests:**
- [ ] Create __tests__/integration/importAndReplay.test.js
- [ ] Test: Import PGN → search → select → replay
- [ ] Test: Auto-play with sounds

**Part 7.4 - Performance Tests:**
- [ ] Create __tests__/performance/indexing.test.js
- [ ] Test: 60-game import < 5 seconds
- [ ] Test: Search < 100ms

---

### Phase 8: Static Assets & Resources

**Part 8.1 - Sample Games:**
- [ ] Download Bobby Fischer 60 games from chessgames.com
- [ ] Export as PGN format
- [ ] Save to resources/sample-games/bobby-fischer-60.pgn
- [ ] Create resources/sample-games/metadata.json
- [ ] Verify PGN is valid with 60 games

**Part 8.2 - Download Script:**
- [ ] Create scripts/download-sample-games.js
- [ ] Implement CDN download capability
- [ ] Add to `npm prepare` script
- [ ] Test: `npm install` downloads samples

---

### Phase 9: Build & Distribution

**Part 9.1 - Build Process:**
- [ ] Test: `npm run build` completes
- [ ] Verify dist/ and dist-electron/ created
- [ ] Test macOS build: `npm run build:mac` → creates .dmg
- [ ] Test Windows build: `npm run build:win` → creates .exe

---

### Phase 10: Integration & Final Testing

**Part 10.1 - App Startup:**
- [ ] App opens without errors
- [ ] Collections directory created if missing
- [ ] First run: auto-imports Bobby Fischer games
- [ ] First run: shows welcome dialog
- [ ] Collections dropdown populated
- [ ] Can switch between collections
- [ ] Audio initializes on first click

**Part 10.2 - Game Browsing:**
- [ ] Game list loads and displays
- [ ] Search by player name works
- [ ] Filter by result (Win/Loss/Draw) works
- [ ] Can combine multiple filters
- [ ] Reset filters button works
- [ ] Shows correct game count

**Part 10.3 - Game Replay:**
- [ ] Clicking game loads board and moves
- [ ] Move list displays all moves
- [ ] Navigation buttons work (⏮ ◀ ▶ ⏭)
- [ ] Keyboard navigation works (Home, ←, →, End)
- [ ] Current move highlighted in list
- [ ] Move list auto-scrolls to current move
- [ ] Board updates as moves advance
- [ ] FEN displays correct position

**Part 10.4 - Audio & Sound:**
- [ ] Move sound plays on normal moves
- [ ] Capture sound plays on captures
- [ ] Castling sound plays on castling
- [ ] Sounds stream from Lichess CDN
- [ ] Sounds cache in memory after first play
- [ ] No sound file bundling needed

**Part 10.5 - Auto-Play:**
- [ ] Play button shows speed menu (Fast/Slow)
- [ ] Auto-play advances at 3s (fast) speed
- [ ] Auto-play advances at 10s (slow) speed
- [ ] Auto-play stops at last move
- [ ] Auto-play stops when nav button clicked
- [ ] Pause button works during playback
- [ ] Spacebar toggles play menu
- [ ] Speed indicator tooltip shows

**Part 10.6 - Game Info & Analysis:**
- [ ] Game info displays White, Black, Event, Date, Result
- [ ] Ratings display correctly
- [ ] "View on Lichess" button opens with full PGN
- [ ] Lichess link works and shows game

**Part 10.7 - Collection Management:**
- [ ] Import New button opens import dialog
- [ ] Can select and name collection
- [ ] Progress bar displays during import
- [ ] Logs display during import
- [ ] Skipped games logged with reasons
- [ ] Can rename collection
- [ ] Can delete collection with confirmation
- [ ] Collection list updates after operations

**Part 10.8 - Edge Cases:**
- [ ] Empty PGN file handling
- [ ] PGN with malformed headers
- [ ] PGN with missing result field
- [ ] PGN with unfinished games ("*")
- [ ] Games with special characters
- [ ] Filter with no results
- [ ] Network errors during sound playback

**Part 10.9 - Platform Testing (macOS):**
- [ ] App builds and runs
- [ ] File dialogs work
- [ ] Minimize/maximize window works
- [ ] Quit app works
- [ ] No console errors

**Part 10.10 - Platform Testing (Windows):**
- [ ] App builds and runs
- [ ] File dialogs work
- [ ] Minimize/maximize window works
- [ ] Quit app works
- [ ] No console errors

**Part 10.11 - Performance:**
- [ ] 60-game sample imports < 5 seconds
- [ ] Search across 60 games < 100ms
- [ ] Board updates smoothly on navigation
- [ ] No memory leaks during long sessions
- [ ] Audio plays without lag

---

## 📚 Implementation Guides

Detailed implementation guides are split into separate documents:

1. **01-PROJECT-SETUP.md** - Configuration files and initial setup
2. **02-ELECTRON-MAIN.md** - Main process and IPC setup
3. **03-DATABASE-IO.md** - SQLite database and file I/O
4. **04-PGN-PARSING.md** - PGN parsing and indexing
5. **05-REACT-COMPONENTS.md** - React UI components
6. **06-CHESS-LOGIC.md** - Chess move handling
7. **07-TESTING.md** - Testing setup and strategies
8. **08-BUILD-DISTRIBUTION.md** - Build and deployment

---

## 🚀 Quick Start Commands

```bash
npm install                 # Install dependencies
npm run dev                # Start dev server with hot reload
npm test                   # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run build             # Build for current platform
npm run build:mac         # Build macOS .dmg
npm run build:win         # Build Windows .exe
npm run download-samples  # Download sample games
```

---

## ✅ Success Criteria

**MVP Complete When:**
- ✅ App starts and loads Bobby Fischer sample games
- ✅ Can search/filter games by all criteria
- ✅ Can select and replay game with full move navigation
- ✅ Can import new PGN collection with progress logging
- ✅ Can rename/delete collections
- ✅ Move sounds (move, capture, castling) play from Lichess CDN
- ✅ Auto-play works at 3s and 10s speeds
- ✅ Can view game on Lichess with full PGN
- ✅ All unit tests pass (>60% coverage)
- ✅ Builds as .dmg (macOS) and .exe (Windows)

---

## 🔑 Key Architecture Decisions

1. **Audio:** Stream all sounds from Lichess CDN at runtime with in-memory caching
2. **Board:** Use Chessground for professional rendering (no custom board)
3. **Move Logic:** Use chess.js only for FEN generation and move execution
4. **Database:** SQLite for full-text search and filtering
5. **Collections:** Multiple independent databases with metadata files
6. **Import:** Stream large PGN files line-by-line, skip invalid games with detailed logging
7. **First Run:** Auto-import bundled Bobby Fischer 60 games

---

**Load the detailed guide files for step-by-step implementation!**
