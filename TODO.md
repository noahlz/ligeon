# Ligeon TODOs

## Bugs

- Running the app hits this bug (sqlite/node version related)

```
GameListSidebar.tsx:36 Uncaught (in promise) Error: Error invoking remote method 'search-games': Error: The module '/Users/noahlz/projects/ligeon/node_modules/better-sqlite3/build/Release/better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 141. This version of Node.js requires NODE_MODULE_VERSION 140. Please try re-compiling or re-installing the module (for instance, using `npm rebuild` or `npm install`).
```
  - Running `./node_modules/.bin/electron-rebuild` "fixed" it
  - See:
    - https://github.com/WiseLibs/better-sqlite3/issues/545
    - https://github.com/WiseLibs/better-sqlite3/issues/549

- chessManager.jsDo not try to parse moves 1-0, 0-1 or 1/2-1/2. It should not be a "move." Append it to the end of the moves display (but don't make it selectable).
- Viewport should not be "scrollable"

## UI

- Progressive search (rather than all games)
- Display moves as two columns
- Match style to Lichess light/dark styles.
- Add theme picker (light/dark/device)

## Game Import

- Make it a icon widget instead of text. Place it with games list on left side.
- If no name specified, use the file name (minus .pgn)
- Picker should default to resources/sample-games/ in dev mode
- Package game with sample-games pre-loaded

## Misc

- Improve test coverage (where relevant)

