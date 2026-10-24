// Budgets de performance et de mémoire houblons (refonte #119, phase 4 ; #121).
//
// Besoins : « l'app est devenue très lente... Beaucoup d'info sont chargés pour rien »
// (#121) ; simulation en moins d'une seconde (brief, § 6). Budgets fixés le 18.10.2026,
// détail et raisons dans docs/qualite/garde-fous.md :
//   B1 démarrage : JavaScript chargé avant le premier écran ≤ 350 ko gzip ;
//   B2 étape Houblons : JavaScript ajouté à l'ouverture de l'étape ≤ 150 ko gzip ;
//   B3 classement : 5 houblons du stock visibles avec quantité ≤ 1 000 ms après l'arrivée
//      (ou après le toucher --tap), processeur bridé × 4 ;
//   B4 mémoire : tas JavaScript ≤ 120 Mo à l'étape Houblons.
//
// Usage :
//   node scripts/check-hop-budget.mjs --dist <dossier du build> [--boot index,App,firebase] [--step Host]
//   node scripts/check-hop-budget.mjs --adapter <adaptateur> [--tap "libellé"]
//   --witness : le sujet DOIT dépasser au moins un budget (témoin négatif).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const witness = process.argv.includes('--witness');
const BUDGET = { B1: 350_000, B2: 150_000, B3: 1000, B4: 120 * 1024 * 1024 };
const results = [];
const kb = (n) => `${Math.round(n / 1000)} ko`;

if (arg('dist')) {
  const dir = path.join(path.resolve(arg('dist')), 'assets');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  const find = (prefix) => files.find((f) => f.startsWith(prefix + '-'));
  const deps = (f) => [...fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/(?:^|[;\n}])\s*import\s*(?:[^'"()]*?from\s*)?["']\.\/([^"']+\.js)["']/g)].map((m) => m[1]);
  const close = (roots, seen = new Set()) => { const walk = (f) => { if (!f || seen.has(f)) return; seen.add(f); deps(f).forEach(walk); }; roots.forEach(walk); return seen; };
  const gz = (set) => [...set].reduce((s, f) => s + zlib.gzipSync(fs.readFileSync(path.join(dir, f)), { level: 9 }).length, 0);
  const boot = close(arg('boot', 'index,App,firebase').split(',').map(find));
  const bootGz = gz(boot);
  results.push({ id: 'B1', label: 'démarrage', value: bootGz, budget: BUDGET.B1, text: `${kb(bootGz)} gzip (${boot.size} fichiers)` });
  const step = close(arg('step', 'Host').split(',').map(find), new Set(boot));
  for (const f of boot) step.delete(f);
  const stepGz = gz(step);
  results.push({ id: 'B2', label: 'étape Houblons', value: stepGz, budget: BUDGET.B2, text: `${kb(stepGz)} gzip ajoutés (${step.size} fichiers)` });
}

if (arg('adapter')) {
  const repo = process.cwd();
  const require = createRequire(path.resolve(repo, 'package.json'));
  const puppeteer = require('puppeteer-core');
  const adapter = await import(pathToFileURL(path.resolve(arg('adapter'))).href);
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--enable-precise-memory-info'] });
  const ctx = await adapter.setup?.({ repo });
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await adapter.open(page, { ctx });
  const need = Math.min(5, adapter.stock.length);
  const t0 = Date.now();
  const tap = arg('tap');
  if (tap) await page.evaluate((label) => { const b = [...document.querySelectorAll('button, [role="button"], summary')].find((e) => (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').startsWith(label)); b?.click(); }, tap);
  // Classement visible : assez de houblons du stock, au premier plan, avec une quantité sur leur ligne.
  const ranked = await page.waitForFunction((stock, need) => {
    const vh = innerHeight; let n = 0;
    const leaves = [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
    for (const h of stock) {
      const re = new RegExp('(^|[^\\p{L}])' + (h.pattern ?? h.name) + '($|[^\\p{L}])', 'iu');
      const el = leaves.find((e) => { if (!re.test(e.textContent)) return false; const r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > vh || !r.width) return false; const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 30), r.top + r.height / 2); return hit && (hit === e || e.contains(hit) || hit.contains(e)); });
      if (!el) continue;
      let row = el; while (row.parentElement && row.parentElement.getBoundingClientRect().height <= 72) row = row.parentElement;
      if (/(^|[^\w])\d+(?:[.,]\d+)?\s?(?:g|kg)(?![\w])/.test(row.innerText)) n++;
    }
    return n >= need;
  }, { timeout: 10000, polling: 50 }, adapter.stock, need).then(() => Date.now() - t0).catch(() => null);
  results.push({ id: 'B3', label: 'classement visible (CPU × 4)', value: ranked ?? Infinity, budget: BUDGET.B3, text: ranked == null ? 'jamais en 10 s' : `${ranked} ms` });
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  results.push({ id: 'B4', label: 'tas JavaScript', value: metrics.JSHeapUsedSize, budget: BUDGET.B4, text: `${Math.round(metrics.JSHeapUsedSize / 1048576)} Mo` });
  await browser.close();
  await adapter.teardown?.(ctx);
}

if (!results.length) { console.error('--dist ou --adapter requis'); process.exit(2); }
const over = results.filter((r) => r.value > r.budget);
const line = results.map((r) => `${r.id} ${r.label} : ${r.text} (budget ${r.id === 'B3' ? r.budget + ' ms' : r.id === 'B4' ? Math.round(r.budget / 1048576) + ' Mo' : kb(r.budget)}) ${r.value > r.budget ? 'DÉPASSÉ' : 'tenu'}`).join(' ; ');
if (!over.length && !witness) console.log('BUDGET OK ' + line);
else if (over.length && witness) console.log(`WITNESS OK ${over.length} budget(s) dépassé(s) : ${line}`);
else { console.log((witness ? 'WITNESS FAILED (aucun budget dépassé) ' : 'BUDGET FAIL ') + line); process.exitCode = 1; }
