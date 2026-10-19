// Lot 20 · contrôle 6 du brief, « honnêteté des chiffres » : chaque texte visible qui porte un chiffre
// est dans un élément qui porte data-source et data-niveau ; une valeur inconnue porte data-inconnu et le
// mot « inconnu », jamais 0. Joue aussi chaque état listé (requêtes ?lev=…, ?detail=…), pour les
// chiffres du plan 2.
// Usage : node controle-chiffres.mjs <page.html> [requête…] ; imprime CHIFFRES OK ou CHIFFRES ECHEC.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [f, ...requetes] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problemes = [];
let total = 0;
for (const q of ['', ...requetes]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.resolve(f)).href + (q ? '?' + q : ''), { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 200));
  const r = await page.evaluate(() => {
    const out = [], vus = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOT_TEXT || NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      // Les noms qui portent un chiffre (levures, composés, style, forme, fichiers) ne sont pas des valeurs.
      const t = n.textContent.trim();
      const sansNoms = t.replace(/US-05|Idaho 7|γ-GluCys-3SHol|G-3SHol|Cys-3SHol|G-3SH|3SHol|3SH|3MHA|3MH|3M4MP|4MMP|IRC7|OYE2|16D|T-90|CO₂|d[1-6]\/[\w.-]+|CAS-\d+|ID7-\d+/g, '');
      if (!/\d/.test(sansNoms)) continue;
      const e = n.parentElement; if (!e || e.closest('script, style, template, #fiche-racine, .leg')) continue;
      const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!b.width || !b.height || cs.visibility === 'hidden') continue;
      if (e.closest('[hidden]')) continue;
      vus.push(t);
      const porteur = e.closest('[data-source][data-niveau]');
      if (!porteur) out.push('sans source : « ' + t.slice(0, 30) + ' »');
    }
    for (const e of document.querySelectorAll('[data-inconnu]')) {
      const b = e.getBoundingClientRect(); if (!b.width) continue;
      if (!/inconnu|pas en stock|non détecté/.test(e.innerText)) out.push('inconnu sans le mot : « ' + e.innerText.slice(0, 30) + ' »');
      if (/(^|\s)0(\s|$|,(?!\d))/.test(e.innerText)) out.push('inconnu écrit 0 : « ' + e.innerText.slice(0, 30) + ' »');
    }
    return { out, n: vus.length };
  });
  total += r.n;
  for (const x of r.out) problemes.push((q || 'défaut') + ' : ' + x);
  await page.close();
}
await browser.close();
console.log(total + ' textes chiffrés vus sur ' + (requetes.length + 1) + ' état(s)');
if (problemes.length) { console.log('CHIFFRES ECHEC ' + problemes.length); for (const p of [...new Set(problemes)].slice(0, 30)) console.log('  ' + p); process.exit(1); }
console.log('CHIFFRES OK');
