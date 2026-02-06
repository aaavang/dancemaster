/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
})
