import { defineConfig } from 'vitest/config'; // Use the vitest/config import
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

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
    reporters: process.env.GITHUB_ACTIONS ? ['tap-flat', 'github-actions'] : ['tap-flat'],
    outputFile: {
      tap: 'dist/test-results.tap',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '__tests__/', '*.config.*', 'dist/', 'dist-electron/'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
