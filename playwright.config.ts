// Tests de bout en bout (Playwright Test) : le Calendrier joué au doigt sur un build de test, avec la fixture des bancs du parcours.
// État de l'art et décision : dépôt Brasserie, work/missions/2026-11-23-calendrier-en-ligne/OUTILS.md.
//   npm run test:e2e                      → l'arbre de travail (reconstruit)
//   E2E_REF=en-ligne/2026-11-22-tour9 npm run test:e2e   → une version passée (preuve qu'un test sait échouer)
//   npx playwright show-report e2e/rapport
// Chrome installé (`channel: 'chrome'`) : aucun navigateur téléchargé.
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const REF = process.env.E2E_REF || '';
const NOM = REF ? REF.replace(/[^\w.-]+/g, '_') : 'arbre';
const BUILD = process.env.E2E_BUILD || path.join(os.tmpdir(), 'affinee-e2e', NOM);
const PORT = Number(process.env.E2E_PORT || 4319);
const CONFIG_VITE = 'scripts/parcours/vite.parcours.config.mjs';

export default defineConfig({
  testDir: 'e2e',
  outputDir: path.join('e2e', 'resultats', NOM),
  snapshotPathTemplate: '{testDir}/{testFileDir}/__captures__/{arg}-{projectName}{ext}',
  timeout: 120_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' } },
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 4,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { outputFolder: path.join('e2e', 'rapport', NOM), open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-CH',
    timezoneId: 'Europe/Zurich',
    colorScheme: 'light'
  },
  projects: [
    { name: 'android-390', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, channel: 'chrome' } },
    { name: 'paysage-844', use: { ...devices['Pixel 7 landscape'], viewport: { width: 844, height: 340 }, deviceScaleFactor: 1, channel: 'chrome' } },
    // la 3e taille du Carnet (CLAUDE.md : « 1280 peu ») : grand écran tactile, seulement les épreuves du Carnet
    { name: 'bureau-1280', testMatch: /e2e[\\/]carnet[\\/].*\.spec\.ts$/ /* ancré : un worktree « port-carnet » ne fait pas passer le Calendrier à 1280 */, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, hasTouch: true, deviceScaleFactor: 1, channel: 'chrome' } }
  ],
  webServer: {
    command: `node e2e/outils/preparer.mjs "${BUILD}" && npx vite preview --config ${CONFIG_VITE} --outDir "${BUILD}" --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: 'pipe',
    env: { E2E_REF: REF }
  }
});
