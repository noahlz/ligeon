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
npm run build    # Full build
npm run dev      # Start dev server and launch Electron window
npm test         # Run all tests (unit + integration)
npm run clean    # Remove all build outputs (dist, dist-electron, compiled JS)
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
│   ├── integration
│   ├── performance
│   └── unit
│       └── components
├── dist                # Typescript javascript output
├── electron            # electron files
├── dist-electron       # electron application artifact
├── electron            # electron files
│   └── ipc
├── public
├── resources
│   └── sample-games    # example chess games (pgn format)
└── src                 # Project source code
    ├── components
    ├── hooks
    ├── styles          # tailwind css files
    └── utils
```

