import { existsSync } from 'node:fs';
// Firebase uploads the prebuilt lib/ folder, without the frontend repository.
// Locally always rebuild; in Cloud Build keep the bundle prepared by predeploy.
if (existsSync(new URL('../src/domain/brewerTools.ts', import.meta.url))) {
  await import('../scripts/build-brewer-tools.mjs');
} else if (!existsSync(new URL('./lib/brewerTools.js', import.meta.url)) || !existsSync(new URL('./lib/financeContext.js', import.meta.url)) || !existsSync(new URL('./lib/yeastCompanion.js', import.meta.url))) {
  throw Error(
    'Missing brewer tools bundle. Run the Firebase predeploy build from the complete repository.'
  );
}
