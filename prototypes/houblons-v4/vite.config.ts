/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Le moteur V5.5 est IMPORTÉ depuis l'app (src/ et functions/src), jamais recopié.
// Ces deux alias sont les seuls points d'entrée vers le code de l'app.
const repo = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@app\/(.*)$/, replacement: `${repo('src')}/$1` },
      { find: /^@functions\/(.*)$/, replacement: `${repo('functions/src')}/$1` },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
  },
});
