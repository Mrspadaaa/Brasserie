// Read-only public Hosting verification; no auth, database, callable or test write.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const origin = 'https://brasserie-l-affinee.web.app';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { url: origin, checkedAt: new Date().toISOString(), mode: 'public GET only, no database access', assets: [] };
const html = fs.readFileSync('dist/index.html', 'utf8');
const initial = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match => match[1].slice(1));
const files = [...new Set(['index.html', 'brew-alerts-sw.js', ...initial,
  ...fs.readdirSync('dist/assets').filter(name => /^(App-|RecipePage-|BrewWizardEntry-|FinancesTab-|YeastRecipe|Fermentation|HopRecipe)/.test(name) && name.endsWith('.js')).map(name => `assets/${name}`)])];
for (const file of files) {
  const local = fs.readFileSync(`dist/${file}`);
  const response = await fetch(`${origin}/${file === 'index.html' ? '' : file}`, { headers: { 'Cache-Control': 'no-cache' } });
  assert.equal(response.status, 200, file);
  const remote = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(remote), hash(local), `Published hash differs: ${file}`);
  report.assets.push({ file, status: 200, sha256: hash(local), bytes: local.length });
}
fs.writeFileSync('work/recipe-open-performance/deploy-2026-09-27/production-check.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ url: origin, assetsChecked: report.assets.length, allHashesMatch: true }));
