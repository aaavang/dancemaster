/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/dancemaster/',
  test: {
    environment: 'jsdom',
  },
})
