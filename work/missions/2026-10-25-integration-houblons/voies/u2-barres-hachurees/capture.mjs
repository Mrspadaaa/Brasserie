// u2 (26.10) : ouvre l'étape Houblons sur la recette « neipa v3 » du brasseur (export collé : 22A, 24 L, Pilsner 6,6 kg + flocons 2 kg,
// OG 1,081, Verdant IPA, Lotus 84 g 15 % α en ébullition) et la photographie à 390 × 844. Rien du dépôt n'est modifié : la requête du
// module de banc `apercuDev.ts` est interceptée et remplacée par cette recette (fixture, aucune donnée réelle).
// Usage : node capture.mjs <port> <étiquette> <minutes d'ébullition de Lotus>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const [port, etiquette, minutes = '40'] = process.argv.slice(2);
const IMG = path.join(import.meta.dirname, 'img');
fs.mkdirSync(IMG, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const recette = {
  id: 'neipa-v3-u2', name: 'neipa v3', style: 'Double IPA', styleRef: { styleId: 'double-ipa' }, volumeL: 24, boilMin: 60, ogTarget: 1.081,
  fermentables: [
    { name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: "Flocons d'avoine", weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [{ name: 'Lotus', alpha: 15, weightG: 84, stage: 'boil', timeMin: Number(minutes), hopVarietyId: 'beermaverick-lotus' }],
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
  sortie.lecture = await page.evaluate(() => {
    const barres = [...document.querySelectorAll('[data-barre]')];
    return {
      ajoutsAffiches: document.querySelectorAll('[data-role="ligne-houblon"]').length,
      barres: barres.length,
      hachurees: barres.filter((b) => b.querySelector('.pq-hachure')).length,
      raisons: [...new Set(barres.filter((b) => b.querySelector('.pq-hachure')).map((b) => b.getAttribute('title')))],
      points: barres.filter((b) => b.querySelector('[data-biere-point]')).length,
      lignes: [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => l.textContent.replace(/\s+/g, ' ').trim().slice(0, 140)),
    };
  });
  await page.evaluate(() => document.querySelector('[data-element="etape-profil"]')?.scrollIntoView({ block: 'center' }));
  await dormir(600);
  await page.screenshot({ path: path.join(IMG, `${etiquette}-profil.png`) });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.querySelector('[data-role="ligne-houblon"]')?.scrollIntoView({ block: 'start' }));
  await dormir(400);
  await page.screenshot({ path: path.join(IMG, `${etiquette}-ajout.png`) });
} catch (e) { sortie.erreur = String(e?.message ?? e); }
sortie.pageErreurs = journal.erreurs.slice(0, 6);
console.log(JSON.stringify(sortie, null, 1));
await browser.close();
