# Ligeon

Chess game viewer built with Electron, React, and SQLite. Browse and replay PGN game files.

## Development Setup

### Prerequisites

- Node.js 24+
- npm

### Install Dependencies

```bash
npm install
```

## Building & Running

### Start Dev Server

Launch the Electron app with hot-reload:

```bash
npm run dev
```

This starts:
- Vite dev server on `localhost:5173`
- Electron window (auto-reloads on code changes)

### Build for Production

```bash
npm run build
```

Compiles TypeScript and bundles React. Output in `dist/` and `dist-electron/`.

### Package Application

```bash
npm run package
```

Creates distributable app bundle in `out/`.

## Import Script: PGN to SQLite

Convert PGN files to SQLite databases for exploration and testing.

### Basic Usage

```bash
npm run pgn-to-sqlite -- <pgn-file> [output-dir]
```

### Examples

Convert Fischer games to default output directory:
```bash
npm run pgn-to-sqlite -- resources/sample-games/fischer-60-memorable.pgn
```

Convert Tal games to specific output directory:
```bash
npm run pgn-to-sqlite -- resources/sample-games/tal-life-and-games.pgn ./output
```

### Query Generated Database

```bash
sqlite3 dist/fischer-60-memorable.db "SELECT COUNT(*) FROM games"
sqlite3 dist/fischer-60-memorable.db "SELECT white, black, event, result FROM games LIMIT 10"
```

## Authors

[@noahlz](https://github.com/noahlz)  
[Claude](https://claude.com/product/claude-code)  

## License

[GPLv3](./LICENSE) (because it uses Chessground)

## Sound Attribution

Sound files in `public/sounds/` copied from [Lichess](https://github.com/lichess-org/lila), licenced under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) by EdinburghCollective.

See: [lichess-org/lila/COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md)
