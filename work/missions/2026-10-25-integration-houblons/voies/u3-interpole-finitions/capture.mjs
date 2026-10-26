// u3 (D113) : l'étape Houblons sur la recette « neipa v3 » (fixture d'après son export : 22A, 24 L, OG 1,081, Verdant IPA), un houblon
// donné en JSON, photographiée à 390 × 844, légende du profil ouverte. Rien du dépôt n'est modifié : la requête du module de banc
// `apercuDev.ts` est interceptée et remplacée par la recette (même méthode que u2).
// Usage : node capture.mjs <port> <étiquette> '<json du houblon>'
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const [port, etiquette, houblonJson] = process.argv.slice(2);
const IMG = path.join(import.meta.dirname, 'img');
fs.mkdirSync(IMG, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const recette = {
  id: 'neipa-v3-u3', name: 'neipa v3', style: 'Double IPA', styleRef: { styleId: 'double-ipa' }, volumeL: 24, boilMin: 60, ogTarget: 1.081,
  fermentables: [
    { name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: "Flocons d'avoine", weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [{ name: 'Lotus', alpha: 15, weightG: 84, hopVarietyId: 'beermaverick-lotus', ...JSON.parse(houblonJson) }],
  yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
};
const module = `export function recetteApercuEtapeHoublons() { return ${JSON.stringify(recette)}; }\n`;

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, externe: 'laisser' });
await page.setRequestInterception(true);
page.on('request', (r) => {
  const u = r.url();
  if (/\/maBiere\/apercuDev\.ts/.test(u)) r.respond({ status: 200, contentType: 'text/javascript', body: module });
  else if (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(u) || /^(data|blob|about|file):/i.test(u)) r.continue();
  else r.abort('blockedbyclient');
});
const sortie = {};
try {
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-element="etape-profil"]', { timeout: 120000 });
  await dormir(2500);
  await page.click('[data-role="legende-bouton"][aria-controls="pq-ma-biere-legende-profil"]');
  await dormir(500);
  sortie.lecture = await page.evaluate(() => {
    const barres = [...document.querySelectorAll('[data-barre]')];
    const legende = document.querySelector('#pq-ma-biere-legende-profil');
    return {
      barres: barres.length,
      hachurees: barres.filter((b) => b.querySelector('.pq-hachure')).length,
      points: barres.filter((b) => b.querySelector('[data-biere-point]')).length,
      pointsInterpoles: document.querySelectorAll('[data-biere-point][data-interpole]').length,
      survolsHachurees: [...new Set(barres.filter((b) => b.querySelector('.pq-hachure')).map((b) => b.getAttribute('title')))],
      survolsPoints: [...new Set(barres.filter((b) => b.querySelector('[data-biere-point]')).map((b) => b.getAttribute('title')))],
      puce: !!legende?.querySelector('[data-role="puce-interpole"]'),
      legende: legende?.textContent.replace(/\s+/g, ' ').trim(),
    };
  });
  await page.evaluate(() => document.querySelector('[data-element="etape-profil"]')?.scrollIntoView({ block: 'start' }));
  await dormir(600);
  await page.screenshot({ path: path.join(IMG, `${etiquette}-profil.png`) });
  // Le rond de plus près : une capture zoomée (device scale ×3) sur la première barre située.
  const zone = await page.evaluate(() => {
    const p = document.querySelector('[data-biere-point]');
    const c = p?.closest('[data-famille-profil]')?.parentElement?.parentElement;
    const r = (c ?? document.querySelector('[data-element="etape-profil"]')).getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(390, r.width), height: Math.min(300, r.height) };
  });
  await page.screenshot({ path: path.join(IMG, `${etiquette}-recadre.png`), clip: zone });
} catch (e) { sortie.erreur = String(e?.message ?? e); }
sortie.pageErreurs = journal.erreurs.slice(0, 6);
console.log(JSON.stringify(sortie, null, 1));
await browser.close();
