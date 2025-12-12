# ligeon - Technology Overview

A technical deep-dive into the major tools, platforms, and frameworks used to build ligeon.

---

## Quick Technology Stack

**Main Application:** Electron, React 18, Tailwind CSS
**Desktop Framework:** Electron (macOS, Windows)
**Frontend UI:** React 18, Chessground
**Styling:** Tailwind CSS
**Chess Logic:** chess.js, chessground
**Database:** SQLite, better-sqlite3
**Build Tool:** Vite
**Testing:** Jest, React Testing Library
**Distribution:** electron-builder
**Code Signing:** Apple Notarization, Windows Authenticode

---

## Main Application Framework

### Electron

**Purpose:** Cross-platform desktop application framework
**Why:** Enables building native macOS and Windows apps from a single JavaScript codebase, leveraging web technologies with full system access.

**Project:** https://www.electronjs.org/

Electron powers the entire ligeon application, providing window management, IPC (Inter-Process Communication), file system access, and OS integration. The architecture uses a main process (Node.js) for backend operations and a renderer process (Chromium) for the UI.

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

### Chessground

**Purpose:** Professional chess board UI library
**Why:** Chessground provides an optimized, accessible, and beautiful chess board rendering with smooth animations and keyboard support—no custom implementation needed.

**Project:** https://github.com/lichess-org/chessground

Chessground renders the interactive chess board in ligeon, displaying the current game position via FEN notation. It provides smooth piece animations, square highlighting, and responsive touch support across both platforms.

---

## Chess Logic & Data

### chess.js

**Purpose:** JavaScript chess move validation and FEN generation
**Why:** chess.js handles all move validation, piece movement rules, and FEN position generation—ensuring correctness without reimplementing chess rules.

**Project:** https://github.com/jhlywa/chess.js

chess.js powers the ChessManager utility in ligeon, validating moves during replay, generating FEN strings at any position, and handling special moves (castling, en passant). The "sloppy mode" option accepts various PGN notation formats.

### pgn-parser

**Purpose:** PGN (Portable Game Notation) file parsing
**Why:** pgn-parser extracts game metadata (players, event, date) and move sequences from PGN files, abstracting the complexity of the PGN format.

**Project:** https://github.com/shortercode/pgn-parser

pgn-parser extracts game information during PGN import, parsing headers and moves from each game in a collection. This enables ligeon to index 60+ game files quickly.

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

### electron-builder

**Purpose:** Complete solution for packaging and distributing Electron apps
**Why:** electron-builder automates code signing, installer creation (.dmg for macOS, .exe for Windows), and notarization—eliminating manual build steps.

**Project:** https://www.electron.build/

electron-builder packages ligeon into production installers for both platforms. It handles code signing (macOS notarization), DMG creation with custom backgrounds, Windows NSIS installers, and portable executables.

---

## Testing & Quality

### Jest

**Purpose:** JavaScript testing framework
**Why:** Jest provides zero-config testing with built-in mocking, code coverage reporting, and watch mode—making test-driven development practical.

**Project:** https://jestjs.io/

Jest runs all unit and integration tests in ligeon—testing utilities (dateConverter, resultConverter, pgnParser), database operations, chess logic, and component behavior. Coverage reports track quality (target: >60%).

### React Testing Library

**Purpose:** React component testing utilities
**Why:** React Testing Library encourages testing components from a user's perspective rather than implementation details, resulting in more maintainable tests.

**Project:** https://testing-library.com/react

React Testing Library tests ligeon's UI components (BoardDisplay, MoveList, GameInfo) by rendering them and simulating user interactions—ensuring the UI works correctly without brittle implementation-specific tests.

---

## Runtime & Tooling

### Node.js

**Purpose:** JavaScript runtime for server-side and desktop application code
**Why:** Node.js enables JavaScript in the Electron main process, providing filesystem access, IPC handling, and database operations.

**Project:** https://nodejs.org/

Node.js runs ligeon's main process, handling window management, IPC communication, file dialogs, database operations, and PGN import streaming.

### npm

**Purpose:** Package manager for JavaScript
**Why:** npm manages all dependencies, build scripts, and provides a centralized way to run development and build commands.

**Project:** https://www.npmjs.com/

npm installs all dependencies (React, Electron, SQLite driver, testing libraries) and provides scripts for development (`npm run dev`), testing (`npm test`), and building (`npm run build`).

---

## Development Tools

### Lucide React

**Purpose:** Icon component library
**Why:** Lucide provides a consistent set of SVG icons as React components, reducing design work and maintaining visual consistency.

**Project:** https://lucide.dev/

Lucide icons are used throughout ligeon's UI for navigation buttons (⏮ ◀ ▶ ⏭), play/pause controls, and menu icons. The icons adapt to the dark theme and scale responsively.

### PostCSS & Autoprefixer

**Purpose:** CSS processing and vendor prefixing
**Why:** PostCSS transforms CSS (applying Tailwind), while Autoprefixer ensures compatibility across browser engines and macOS/Windows rendering engines.

**Project:** https://postcss.org/ | https://autoprefixer.github.io/

PostCSS + Autoprefixer processes Tailwind CSS at build time, converting utility classes into optimized CSS with vendor prefixes for cross-platform compatibility.

---

## Code Signing & Distribution

### Apple Notarization (@electron/notarize)

**Purpose:** Code signing and notarization for macOS distribution
**Why:** macOS requires notarization to ensure the app is from a trusted developer and hasn't been tampered with—this is a security requirement.

**Project:** https://github.com/electron/notarize

@electron/notarize automatically notarizes the ligeon macOS build with Apple, enabling users to run the app without "Unidentified Developer" warnings.

### electron-updater

**Purpose:** Auto-update framework for Electron apps
**Why:** electron-updater simplifies delivering updates to users, checking for new versions and installing them automatically.

**Project:** https://www.electron.build/auto-update

electron-updater enables ligeon to check for new versions on startup and notify users when updates are available, improving user experience without manual download hassles.

---

## Project Management & Documentation

### GitHub

**Purpose:** Version control and release hosting
**Why:** GitHub stores the codebase, tracks issues, and hosts releases (installers) for easy distribution to users.

**Project:** https://github.com/

ligeon is hosted on GitHub, with releases containing DMG (macOS) and EXE (Windows) installers. Builds are created locally on the developer's machine, then uploaded manually to GitHub Releases or other distribution platforms.

---

## Architecture Summary

**Three-Layer Architecture:**

1. **Main Process (Electron + Node.js):** Manages windows, IPC, file system, collections directory, database operations, and PGN import streaming.

2. **Renderer Process (React + Chessground):** Displays UI, manages game navigation, handles user interactions, plays sounds, and visualizes the chess board.

3. **Data Layer (SQLite):** Persists games, collections, and metadata with indexed full-text search for fast filtering.

**Key Design Patterns:**

- **IPC Bridge:** Security-hardened context isolation separates main process from renderer, preventing direct Node.js access.
- **Streaming Import:** Large PGN files are imported line-by-line with progress updates, avoiding memory bloat.
- **CDN Audio:** Sound effects stream from Lichess CDN at runtime and cache in memory, eliminating bundle size.
- **Component-Based UI:** React components are composable and testable, with clear separation of concerns.

---

## Why These Technologies?

**Electron** provides true native apps for macOS and Windows from a single codebase—ideal for desktop applications requiring OS-level features.

**React** offers a mature ecosystem, excellent tooling, and the ability to hire developers familiar with web frameworks.

**Tailwind** eliminates CSS friction and provides a consistent design system without custom styling.

**chess.js + Chessground** are battle-tested by Lichess (the world's largest free chess site), ensuring correctness and UX quality.

**SQLite** is proven, serverless, and requires zero deployment complexity—perfect for a personal library app.

**Vite** significantly speeds up development with hot reload and fast builds compared to older bundlers.

**Jest** provides comprehensive testing with minimal setup, ensuring code quality and preventing regressions.

---

## Performance Targets

- **Import:** 60 games in <5 seconds
- **Search:** Any query completes in <100ms
- **Navigation:** Move navigation <16ms (60fps smooth)
- **Audio:** Sound effects play without lag (Web Audio API)
- **Bundle:** macOS DMG <150MB, Windows EXE <120MB

---

## Cross-Platform Considerations

**macOS:** Native code signing, notarization, DMG installer, .icns icons, entitlements for file dialog access.

**Windows:** NSIS installer, portable EXE, .ico icons, SmartScreen compatibility.

**Shared Code:** Electron main process, React UI, and database logic work identically on both platforms.

---

**This stack provides a solid foundation for a performant, maintainable, and distributable desktop application.**
