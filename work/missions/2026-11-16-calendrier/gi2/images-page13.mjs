// page13 : capture g-d1 en cave (référence des captures cave), puis chaque image passe par surligner-ecarts (règle PAGE-ECARTS).
import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAP = path.join(HERE, 'cap'), IMG = path.join(HERE, '..', 'page13', 'img');
const SURL = path.join(HERE, '..', '..', '..', '..', 'scripts', 'agents', 'surligner-ecarts.mjs');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto('file:///' + path.join(HERE, '..', 'paliers', 'g-d1.html').split(path.sep).join('/'), { waitUntil: 'load' });
await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
await new Promise((r) => setTimeout(r, 200));
await p.screenshot({ path: path.join(CAP, 'g-d1-cave.png') });
await nav.close();
const ref = (n) => n.startsWith('r2-') ? (n.includes('cave') ? 'choisi-a-cave' : 'choisi-a') : (n.includes('cave') ? 'g-d1-cave' : 'g-d1');
const L = ['g-d1', 'g-d1-cave', 'choisi-a', 'choisi-a-cave', 'choisi-a-ajout', 'choisi-a-masque', 'choisi-a-masque-cave', 'choisi-a-semaine', 'choisi-a-retard',
  'choisi-b', 'choisi-b-cave', 'choisi-b-ajout', 'choisi-b-masque', 'r2-a', 'r2-a-cave', 'r2-c', 'r2-c-cave'];
for (const n of L) {
  const out = execFileSync('node', [SURL, path.join(CAP, ref(n) + '.png'), path.join(CAP, n + '.png'), path.join(IMG, n + '.webp')], { encoding: 'utf8' }).trim();
  console.log(n.padEnd(22), '← ' + ref(n).padEnd(14), out.split('\n').pop());
}
