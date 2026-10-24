// D97 (20.10, nuit) : aucune valeur brute de catalogue ou de code à l'écran. Le défaut est revenu trois
// fois dans les maquettes : « low » sous la levure de d4 (lot 20), « medium » pour Pomona, puis
// « Esters : « low » » dans v1b (lot 21), alors que le brasseur lit en français (« Je veux aussi des
// vrais valeur », pas des codes). D14 couvrait déjà « null », « undefined » et « NaN ».
// Règle : aucun nœud de texte visible (page, états ouverts par les <details>, légende) dont tout le
// contenu, guillemets mis à part, est une valeur brute : low, medium, high, unknown, none, true, false,
// null, undefined, NaN, conditional, contextuallyRelevant. Une phrase citée en anglais (une citation de
// source, plusieurs mots) n'est pas visée.
// Usage : node controle-valeurs-brutes.mjs <dossier> [ids…] [--page=etat.html] ; imprime BRUTES OK, ou
// BRUTES ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    for (const d of document.querySelectorAll('details')) d.open = true;
    const BRUTE = /^(low|medium|high|unknown|none|true|false|null|undefined|nan|conditional|contextuallyrelevant)$/i;
    const trouves = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script, style, title')) continue;
      const t = n.textContent.replace(/[«»"“”'’()\[\]:;,.]/g, ' ').replace(/\s+/g, ' ').trim();
      if (t && BRUTE.test(t)) trouves.push(t + ' (dans « ' + (el.closest('[data-role], section, li, p, div') || el).textContent.replace(/\s+/g, ' ').trim().slice(0, 60) + ' »)');
    }
    return [...new Set(trouves)];
  });
  await page.close();
  for (const x of r.slice(0, 6)) problems.push(id + ' ' + pg + ' : valeur brute « ' + x);
  console.log(id + ' · ' + r.length + ' valeur(s) brute(s)');
}
await browser.close();
if (problems.length) { console.log('BRUTES ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('BRUTES OK');
