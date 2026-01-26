# Ligeon TODOs

## Game Replay / Navigation

- "View on Lichess" button use external-link lucide and is to right of move navigation
- Replay speed - no more pop up menu. Have slider to right of navigation. Replay speed: 1s[    | ]30s
- Sound on/off button.

## Style

- Add "light" theme and add theme picker (light/dark/system)

## Game Search

- Search by Name doesn't work...
- Search by Opening: ECO or Name from https://github.com/lichess-org/chess-openings
- Results game count: {x} games (of [{y max 100})

## Game Import / Picker

- If no name specified, use the file name (minus .pgn) NOT "Untitled"
- Add delete button next to list button in game picker (can't delete loaded game)
- Picker should default to resources/sample-games/ in dev mode, home directory when deployed
- Package game with sample-games pre-loaded
- Some game got imported as "? / ?" and only had the game result: 1/2-1/2 as the only "move." Track down this bug.

## Sqlite Bug

Running the app hits this bug (sqlite/node version related)

```
GameListSidebar.tsx:36 Uncaught (in promise) Error: Error invoking remote method 'search-games': Error: The module '/Users/noahlz/projects/ligeon/node_modules/better-sqlite3/build/Release/better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 141. This version of Node.js requires NODE_MODULE_VERSION 140. Please try re-compiling or re-installing the module (for instance, using `npm rebuild` or `npm install`).
```
  - Running `./node_modules/.bin/electron-rebuild` "fixed" it
  - See:
    - https://github.com/WiseLibs/better-sqlite3/issues/545
    - https://github.com/WiseLibs/better-sqlite3/issues/549

