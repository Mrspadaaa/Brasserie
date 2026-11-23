// L'app EN LIGNE au doigt (e2e/en-ligne) : aucun serveur, un seul onglet à la fois dans le Chrome de débogage (9222), jamais fermé.
//   PAQUET=index-XXXX.js npx playwright test -c playwright.en-ligne.config.ts <fichier>
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e/en-ligne',
  outputDir: 'e2e/resultats/en-ligne',
  timeout: 600_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']]
});
