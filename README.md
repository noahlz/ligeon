# Ligeon

Chess game viewer built with Electron, React, and SQLite. Import, browse and replay chess games from plaintext PGN game files.

## Development Setup

### Prerequisites

- Node.js 24+
- npm

### Install Dependencies

```bash
npm install
```

## Building & Running

### Run Locally

Launch the Electron app with hot-reload:

```bash
npm run dev
```

### Package 

```bash
npm run package
```

Creates distributable app bundles in `out/`.

## CLI Tool: PGN to SQLite

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

Browse the database with `sqlite3` or other SQLite compatible tool.

## Authors

[@noahlz](https://github.com/noahlz)  
[Claude](https://claude.com/product/claude-code)  

## License

[GPLv3](./LICENSE) (because it uses Chessground)

## Sample Games Attribution

Sample games sourced from [brianerdelyi/ChessPGN](https://github.com/brianerdelyi/ChessPGN)

## Sound Attribution

Sound files in `public/sounds/` copied from [Lichess](https://github.com/lichess-org/lila), licenced under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) by EdinburghCollective.

See: [lichess-org/lila/COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md)

