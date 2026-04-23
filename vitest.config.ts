import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      'payment-universal': new URL('./src/index.ts', import.meta.url).pathname,
      'payment-universal/react': new URL('./src/adapters/react/index.ts', import.meta.url).pathname,
      'payment-universal/vue': new URL('./src/adapters/vue/index.ts', import.meta.url).pathname,
      'payment-universal/angular': new URL('./src/adapters/angular/index.ts', import.meta.url).pathname,
      'payment-universal/vanilla': new URL('./src/adapters/vanilla/index.ts', import.meta.url).pathname,
    },
  },
});
