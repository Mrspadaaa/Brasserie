// D81 (19.10, soir) : un picto dont le sens n'est que dans l'info-bulle ne se lit pas au doigt. Les
// mots du brasseur, sur p4 du lot 15 : « c'est quoi ce double boul violette ? » (la pastille « levure »
// de la frise des moments : deux ronds violets et « 2 », le nom seulement dans title).
// Règle : tout élément visible qui porte un title et un picto (svg) montre aussi un mot (hors chiffres
// et signes) ; les pictos de famille (data-famille, la couleur et la forme du code des arômes) en
// sont exemptés, comme les boutons qui ont un aria-label et une action connue (data-role).
// Usage : node controle-sens-survol.mjs <dossier> [ids…] [--pages=etat-b.html,comparer.html] ;
// imprime SURVOL OK, ou SURVOL ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pages = ((args.find((a) => a.startsWith('--pages=')) || '').slice(8) || 'etat-b.html').split(',');
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => pages.some((p) => fs.existsSync(path.join(dir, d, p))))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) for (const pg of pages) {
  const f = path.join(dir, id, pg);
  if (!fs.existsSync(f)) continue;
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    return [...document.querySelectorAll('[title]')].filter((e) => vis(e) && (e.getAttribute('title') || '').trim() && (e.tagName.toLowerCase() === 'svg' || e.querySelector('svg')))
      .filter((e) => !e.closest('[data-famille]') && !e.querySelector('[data-famille]') && !(e.getAttribute('aria-label') && e.dataset.role))
      // Un mot visible : une lettre, ou une durée écrite (« 10′ », « 60′ »).
      .filter((e) => { const t = e.innerText || ''; return !/\d+\s*′/.test(t) && !t.replace(/[\d\s.,:;×x+\-−–=%()′'"«»?!/]/gi, '').trim(); })
      .map((e) => ({ title: e.getAttribute('title').slice(0, 40), texte: (e.innerText || '').trim().slice(0, 12) }));
  });
  await page.close();
  const vus = [...new Map(r.map((x) => [x.title, x])).values()];
  for (const x of vus) problems.push(id + ' ' + pg + ' : « ' + x.title + ' » au survol seulement (visible : « ' + x.texte + ' »)');
  console.log(id + ' ' + pg + ' · ' + r.length + ' picto(s) au sens caché');
}
await browser.close();
if (problems.length) { console.log('SURVOL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('SURVOL OK');
