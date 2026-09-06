import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Tests unitaires et d'intégration.
 *
 * Deux environnements distincts, et c'est délibéré :
 *
 *   `tests/unit/**`        — logique métier pure. Pas de DOM, pas de React,
 *                            pas de Firebase. Ce sont des fonctions qui
 *                            prennent des nombres et en rendent d'autres :
 *                            elles doivent tourner en quelques millisecondes.
 *
 *   `tests/integration/**` — plusieurs pièces ensemble. La façade de stockage
 *                            avec un dépôt en mémoire, un écran monté avec ses
 *                            vraies dépendances. Environnement `jsdom`.
 *
 * La couverture ne vise QUE `src/domain` et `src/services` : c'est là que vit
 * ce qui rend de la bière ratée ou une déclaration fausse. Mettre les
 * composants dans le même seuil diluerait le signal.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    setupFiles: ['tests/setup.ts'],
    environmentMatchGlobs: [['tests/integration/**', 'jsdom']],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/domain/**', 'src/services/**'],
      // Les services qui ne font que parler au réseau ou au navigateur ne se
      // testent pas utilement en unitaire : on les couvre en intégration.
      exclude: [
        'src/services/firebase.ts',
        'src/services/firebaseAuth.ts',
        'src/services/firestoreRepo.ts',
        'src/services/aiClient.ts',
        'src/services/geminiScanner.ts',
        'src/services/googleDriveService.ts',
        'src/services/driveService.ts',
        'src/services/excelService.ts',
        'src/services/receiptService.ts',
        'src/services/swissQrBill.ts',
        'src/services/migration.ts'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
});
