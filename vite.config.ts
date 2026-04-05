import { defineConfig } from 'vitest/config'; // Use the vitest/config import
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { coverageExcludes } from './vitest.coverage.excludes.js';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-radix': [
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          'vendor-chess': ['@lichess-org/chessground', 'chessops'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['**/node_modules/**', '.worktrees'],
    setupFiles: ['__tests__/setup/rtl.ts'],
    reporters: process.env.GITHUB_ACTIONS ? ['tap-flat', 'github-actions'] : ['default'],
    outputFile: {
      tap: 'dist/test-results.tap',
    },
    coverage: {
      provider: 'v8',
      exclude: coverageExcludes,
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      reportsDirectory: '.coverage',
      reporter: ['text', 'lcov']
    },
  },
});
