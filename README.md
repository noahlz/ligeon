# Ligeon

Simple desktop chess game brower and study tool built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), and SQLite. Import, browse and replay chess games from plaintext PGN game files.

[![Node.js CI](https://github.com/noahlz/ligeon/actions/workflows/ci.yml/badge.svg)](https://github.com/noahlz/ligeon/actions/workflows/ci.yml)


<img src="./ligeon-screen.png" width="650" alt="Ligeon Screenshot">

## Motivation

My chess coach recommended reviewing master games, but existing free browsers are limited: ChessBase costs money, SCID is outdated. This app lets you import and browse unlimited PGN files locally.

Built as an experiment in using Claude Code to create a real desktop application. (Lichess studies are an alternative but limited to 64 chapters, and I always wanted to build an Electron app).

## Limitations

This app imports free PGN records only. Headers/moves are not copyright protected, but comments and annotations are.

**Design choices:**
- No nested variations (single-level branches only)
- Simple comments and basic annotations.
- No Stockfish engine integration - you really should analyze positions without an engine!

If you need the full feature set of Lichess studies, this is not it. But the game export feature allows you to easily get positions or full games over to Lichess for further analysis.

## Development

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
npm run app
```

### Package 

```bash
npm run package
```

Creates distributable app bundles in `release/`.

## CLI Tool: PGN to SQLite

Convert PGN files to SQLite databases for exploration and testing.

Usage:
```bash
npm run pgn-to-sqlite -- <pgn-file> [output-dir]
```

Example:
```bash
npm run pgn-to-sqlite -- resources/sample-games/tal-life-and-games.pgn ./release
```

## Authors

[@noahlz](https://github.com/noahlz)  
[@claude](https://github.com/claude)  

## License

[GPLv3](./LICENSE) (because it uses Chessground)

## Sample Games Attribution

Sample games sourced from [brianerdelyi/ChessPGN](https://github.com/brianerdelyi/ChessPGN)

## Sound Attribution

Sound files in `public/sounds/` copied from [Lichess](https://github.com/lichess-org/lila), licenced under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) by EdinburghCollective.

See: [lichess-org/lila/COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md)

