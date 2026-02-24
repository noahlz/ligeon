# Ligeon TODOs

## PGN View on Lichess 
- Extend buildFullPgn to include headers for "view on Lichess."
- Add "View PGN" so you can copy/paste into a Lichess study (since "view on lichess" uses Import Game)
- Add note to readme: we don't support importing comments or annotations to games because they are copyrighted. Only the moves of the game and headers are copyright-free.

## Online Help
- Integrate driver.js to provide simple online help on first-open only.

## Code Quality

- Extract business logic out of React components.
- Make sure all errors and warnings are surfaced to the user as toasts
- Full code review / refactoring / delete unused code.

## Style / UI

- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Testing

- Improve coverage of React/Electron files.
- Coverage for UI components with React Testing

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.
