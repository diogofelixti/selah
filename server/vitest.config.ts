import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Cada arquivo cria o próprio banco; o Postgres do Docker aguenta rodar em paralelo.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})
