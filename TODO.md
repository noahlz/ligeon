# Ligeon TODOs

## PGN View on Lichess 
- Add note to readme: we don't support importing comments or annotations to games because they are copyrighted. Only the moves of the game and headers are copyright-free.

## Online Help
- Integrate driver.js to provide simple online help on first-open only.

## Code Quality
- Extract logic out of render/util classes - or at least make sure they are tested. 
- Full project code review / refactoring / delete unused code.

## Testing
- Improve coverage of render module with React Testing

## Packaging
- Update README.md with motivation, intentional limitations, FAQ.
- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.

## Style / UI
- Add "light" theme and add theme picker (light/dark/system) (on control strip)
