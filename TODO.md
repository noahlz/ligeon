# Ligeon TODOs

## Testing
- Improve coverage of render module with React Testing

## Code Quality
- Full project code review / refactoring

## Issues

- CVEs - some packages have high and critical issues.
- This odd issue:
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

## Packaging
- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.

## Online Help
- Integrate driver.js to provide simple online help on first-open only.

