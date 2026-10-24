// check:engine — reconstruit les données depuis le dépôt (build-data, build-bands, déterministes),
// lance Vitest, puis imprime « ENGINE-V4 OK (<n> tests) » seulement si tous les tests passent et
// si au moins MIN_TESTS ont tourné. Sinon « ENGINE-V4 FAIL » et code de sortie 1.
//
// Témoin négatif documenté :
//   V4_TEMOIN_NEGATIF=bande npm run check:engine
// élargit la bande floral de 3A à 0–100 (src/style/scale.ts) ; le test « écart lager > IPA » et le
// test de cohérence du pack doivent alors échouer, et ce script imprimer ENGINE-V4 FAIL.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_TESTS = 15;
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const run = (cmd, args) => spawnSync(cmd, args, { cwd: here, encoding: 'utf8', shell: process.platform === 'win32', env: process.env });
const fail = (why, detail = '') => { console.log(`ENGINE-V4 FAIL : ${why}`); if (detail) console.log(detail.slice(-4000)); process.exit(1); };

for (const script of ['scripts/build-data.mjs', 'scripts/build-bands.mjs']) {
  const r = run('node', [script]);
  if (r.status !== 0) fail(`${script} a échoué`, r.stdout + r.stderr);
  process.stdout.write(r.stdout);
}
const out = path.join(here, 'test-results', 'vitest.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.rmSync(out, { force: true });
const r = run('npx', ['vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile.json=${out}`]);
if (!fs.existsSync(out)) fail('rapport Vitest absent', r.stdout + r.stderr);
const report = JSON.parse(fs.readFileSync(out, 'utf8'));
const n = report.numTotalTests, passed = report.numPassedTests;
const failed = report.testResults.flatMap((f) => f.assertionResults.filter((a) => a.status !== 'passed').map((a) => `  ✗ ${a.fullName}`));
if (r.status !== 0 || !report.success || passed !== n) fail(`${n - passed} test(s) en échec sur ${n}`, failed.join('\n'));
if (n < MIN_TESTS) fail(`${n} tests seulement (minimum ${MIN_TESTS})`);
console.log(`ENGINE-V4 OK (${n} tests)`);
