# Ligeon

Simple desktop chess game browser and study tool built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), and SQLite. Import, browse and replay chess games from plaintext PGN game files.

[![Node.js CI](https://github.com/noahlz/ligeon/actions/workflows/ci.yml/badge.svg)](https://github.com/noahlz/ligeon/actions/workflows/ci.yml)


<img src="./ligeon-screen.png" width="650" alt="Ligeon Screenshot">

## Motivation

My chess coach recommended reviewing master games, but existing free browsers are limited: ChessBase costs money, SCID is old and hard to use. So, I did what any reasonable person would do: build my own application.

(Mostly this is an experiment in using Claude Code to create a real desktop application. Lichess studies are great, but limited to 64 chapters – this can import nearly unlimited games. And I always wanted to build an Electron app.)

## Limitations

This app imports "plain" PGN data only – no comments, variations or annotations supported. 

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

### Run Tests

Run just the tests:
```bash
npm test
```

To run all TypeScript checks, ES linting, dead code detection (knip) and vitest coverage checks:
```bash
npm run check
```

### Run Dev App

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

## Piece Set Attribution

Chess piece SVGs in `public/pieces/` sourced from [lichess-org/lila](https://github.com/lichess-org/lila).

See: [lichess-org/lila/COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md)

| Set | Author | License |
|-----|--------|---------|
| **cburnett** | Colin M.L. Burnett | [GPLv2+](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) |
| **merida** | Armando Hernandez Marroquin | [GPLv2+](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) |
| **alpha** | Eric Bentzen | Free for personal non-commercial use |
| **companion** | David L. Brown | Freeware |
| **fresca** | sadsnake1 | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

