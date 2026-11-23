import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/ux-mobile/stock*.test.{ts,tsx}']
  }
});
