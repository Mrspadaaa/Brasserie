// s3 : lit le nombre d'« autres voies » du radar de la maquette construite (état etat-sugg-radar), pour actualiser l'attendu (D195).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { ouvrir } = await import(pathToFileURL(path.resolve('.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const page_ = pathToFileURL(path.resolve('prototypes/houblons-v4/maquettes/parcours/suggerer/etat.html')).href;
const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, externe: 'laisser' });
try {
  await page.goto(page_, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.querySelector('[data-etat="etat-sugg-radar"]')?.click());
  await new Promise((r) => setTimeout(r, 1500));
  const lu = await page.evaluate(() => [...document.querySelectorAll('button')].map((e) => (e.getAttribute('aria-label') || '') + '|' + e.textContent.trim()).filter((t) => /autres|[|]\+[0-9]+$/.test(t)));
  console.log(JSON.stringify(lu));
} finally { await browser.close(); }
