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
    reporters: process.env.GITHUB_ACTIONS ? ['tap-flat', 'github-actions'] : ['default'],
    outputFile: {
      tap: 'dist/test-results.tap',
    },
    coverage: {
      provider: 'v8',
      reporter: process.env.COVERAGE_TO_FILE ? ['text-file', 'json', 'html'] : ['text', 'json', 'html'],
      exclude: coverageExcludes,
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
