import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/core/**/*.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 85, functions: 85, branches: 85, statements: 85 },
    },
  },
})
