// Construit tour7 et tour9 (build de production minifié, config parcours de tour9, fixtures, sans seedData).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const B = 'C:/Users/mrspa/AppData/Local/Temp/lenteurs-22-11-b';
const cfg = path.join(B, 'tour9/scripts/parcours/vite.parcours.config.mjs');
for (const n of process.argv.slice(2)) {
  const racine = path.join(B, n);
  const t0 = Date.now();
  const r = spawnSync('npx', ['vite', 'build', '--config', cfg, '--outDir', path.join(B, `build-${n}`), '--emptyOutDir', '--logLevel', 'error', '--configLoader', 'runner'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  console.log(n, r.status, Math.round((Date.now() - t0) / 1000) + ' s', (r.stdout + r.stderr).slice(0,900));
}
