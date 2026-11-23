import base from '../../vitest.config';
import { defineConfig } from 'vitest/config';

const test = { ...base.test };
delete test.environmentMatchGlobs;

export default defineConfig({
  ...base,
  test: {
    ...test,
    environment: 'jsdom',
    include: ['tests/ux-mobile/finance*.test.tsx']
  }
});
