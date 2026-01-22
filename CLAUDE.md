# Ligeon

Ligeon is an Electron.js desktop application for viewing chess games (PGN format data).

It is based on the JavaScript components used to build [Lichess](https://lichess.org). Example projects:

- [chessops](https://github.com/niklasf/chessops) - Logic for moving chess pieces
- [chessground](https://github.com/lichess-org/chessground) - Chess game UI
- [chessground examples](https://github.com/lichess-org/chessground-examples)

## Implementation Plan

Find the implementation plan under @.claude/plans/

**NOTE** these are a plan, not strict instructions. Be flexible in adjusting the plans as you proceed through the implementation. Use AskUserQuestion when you need a decision from the User.

The user will delete plan files after they are implemented.

## Dev Commands

```bash
npm run dev              # Start dev server and launch Electron window
npm run build            # Compile renderer + main process (no packaging)
npm run package          # Build + create distributable in out/
npm test                 # Run all tests (unit + integration)
npm run clean            # Remove all build outputs (dist, dist-electron, out)
npm run typecheck        # Check TypeScript types
```

## Technology Stack

See `package.json` for current versions.

- **Runtime:** Node.js
- **Language:** TypeScript
- **Main Application:** Electron, React, Tailwind CSS
- **Database:** SQLite with better-sqlite3
- **Chess Logic:** chessops
- **Board UI:** chessground
- **Package Manager:** npm
- **Build Tool:** Vite
- **Testing:** Vitest

## Project Structure

```
├── __tests__           # test suite
│   ├── integration
│   ├── performance
│   └── unit
├── dist/               # Renderer build output (React/Vite)
├── dist-electron/      # Main process build output (Electron)
├── out/                # Packaged applications (dmg, nsis, etc.)
├── electron/           # Main process source
│   ├── main.ts         # Electron app lifecycle, window creation, IPC
│   ├── preload.ts      # Context bridge for secure IPC
│   ├── ipc/            # IPC handler modules
│   └── tsconfig.json   # Main process TypeScript config
├── public/             # Static web assets (copied to dist/ by Vite)
├── resources/          # App packaging assets
│   ├── icons/          # App icons for electron-builder
│   └── sample-games/   # Example chess games (PGN format)
├── src/                # Renderer source (React app)
│   ├── components/     # React components
│   ├── hooks/          # React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── styles/         # Tailwind CSS files
├── tsconfig.json       # Renderer TypeScript config (extends tsconfig.base.json)
└── tsconfig.base.json  # Shared TypeScript settings
```

### Asset Directories

- **`public/`**: Static web assets served by Vite during dev, copied to `dist/` in production
- **`resources/`**: App packaging assets including icons and example files
  - `resources/icons/`: Application icons for electron-builder
  - `resources/sample-games/`: Example PGN chess game files
