import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: { alias: [
    { find: '../data/seedData', replacement: fileURLToPath(new URL('../../src/data/seedData.example.ts', import.meta.url)) },
    { find: './yeastCompanion.js', replacement: fileURLToPath(new URL('../../src/domain/yeastCompanion.ts', import.meta.url)) },
    { find: './brewerTools.js', replacement: fileURLToPath(new URL('../../src/domain/brewerTools.ts', import.meta.url)) },
    { find: './financeContext.js', replacement: fileURLToPath(new URL('../../src/domain/finance/assistantContext.ts', import.meta.url)) },
  ] },
  test: {
    env: {
      VITE_FIREBASE_API_KEY: 'demo-laffinee-tests',
      VITE_FIREBASE_PROJECT_ID: 'demo-laffinee-tests',
      VITE_FIREBASE_APP_ID: '1:123:web:test',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
      VITE_USE_FIREBASE_EMULATORS: 'true',
      VITE_RECAPTCHA_SITE_KEY: '',
      VITE_APPCHECK_DEBUG_TOKEN: '',
    },
    globals: true,
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/ux-mobile/fermentation*.test.tsx'],
  },
});
