import { defineConfig } from 'vitest/config'; // Use the vitest/config import
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { coverageExcludes } from './vitest.coverage.excludes.js';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['node_modules', '.worktrees'],
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
      reporter: process.env.GITHUB_ACTIONS ? ['text', 'clover'] : ['text', 'json', 'html', 'clover'],
    },
  },
});
