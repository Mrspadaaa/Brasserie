// Lot 20 · contrôle 6 du brief, « honnêteté des chiffres » : tout texte qui porte un chiffre est dans un élément
// qui dit sa source et son niveau (data-source et data-niveau), ou bien c'est une entrée du brasseur (data-entree),
// un nom (data-nom : 4MMP, 16D, Idaho 7) ou une valeur inconnue (data-inconnu, avec le mot « inconnu » ou « non
// détecté »). Aucun « 0 » seul. Toute la page est lue, replis et légende compris (pas seulement le visible) ;
// la fiche g1 est lue ouverte (appel direct de ouvrirFiche), ses chiffres venant du pack avec leurs sources.
// Usage : node controle-chiffres.mjs <page.html> [page2.html…] ; imprime CHIFFRES OK, ou CHIFFRES ECHEC et la liste.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');

const pages = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const f of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  const r = await page.evaluate(() => {
    const out = { sans: [], inconnus: 0, incSansMot: [], zeros: [], vus: 0 };
    const main = document.querySelector('main');
    const walk = document.createTreeWalker(main, NodeFilter.SHOT_TEXT || NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.textContent.trim();
      if (!t || !/\d/.test(t)) continue;
      const el = n.parentElement;
      if (el.closest('script, style, svg')) continue;
      out.vus++;
      if (el.closest('[data-source][data-niveau], [data-entree], [data-nom], [data-inconnu], [data-ref]')) { if (/^0([,.]0+)?$/.test(t)) out.zeros.push(t); continue; }
      out.sans.push(t.slice(0, 40) + ' ← ' + (el.className || el.tagName));
    }
    for (const e of document.querySelectorAll('[data-inconnu]')) { out.inconnus++; if (!/inconnu|non détecté|non chiffré/.test((e.textContent || '') + ' ' + (e.getAttribute('aria-label') || ''))) out.incSansMot.push(e.outerHTML.slice(0, 80)); }
    return out;
  });
  await page.close();
  const pg = path.basename(path.dirname(f)) + '/' + path.basename(f);
  for (const x of [...new Set(r.sans)].slice(0, 20)) problems.push(pg + ' : chiffre sans source ni niveau : « ' + x + ' »');
  for (const x of r.incSansMot) problems.push(pg + ' : inconnu sans le mot : ' + x);
  for (const x of r.zeros) problems.push(pg + ' : « 0 » affiché : ' + x);
  console.log(pg + ' · ' + r.vus + ' textes chiffrés · ' + r.inconnus + ' inconnus balisés');
}
await browser.close();
if (problems.length) { console.log('CHIFFRES ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('CHIFFRES OK');
