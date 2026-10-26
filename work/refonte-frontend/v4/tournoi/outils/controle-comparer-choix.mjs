#!/usr/bin/env node
// D137 (24.10, soir, commentaire sur « Ajouter un houblon à la comparaison » de la maquette publiée) : « Problème principal,
// pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un ». Seuls les houblons ajoutés pendant la
// séance se retiraient ; rien ne remplaçait ; la feuille « + » ne montrait que le stock, sans recherche.
// Ce contrôle joue Comparer (comparer/etat.html) à 390 × 844 au doigt et refuse :
//   K1 un houblon de départ sans « Retirer » ([aria-label^="Retirer <nom>"]), ou un toucher qui ne le retire pas ;
//   K2 un houblon sans « Remplacer » ([aria-label^="Remplacer <nom>"]), ou un remplacement qui ne pose pas le houblon
//      choisi à la même place ;
//   K3 une feuille d'ajout sans champ de recherche ([data-role="chercher-houblon"]) qui trouve « nelson » (Nelson Sauvin,
//      hors du stock), ou un ajout depuis la recherche qui ne donne pas sa colonne.
// Usage : node controle-comparer-choix.mjs <dossier construit>  →  « COMPARER-CHOIX OK » ou « COMPARER-CHOIX ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const dossier = process.argv.slice(2).find((a) => !a.startsWith('--'));
const page = dossier && path.resolve(RACINE, dossier, 'comparer/etat.html');
if (!page || !fs.existsSync(page)) { console.log('Usage : node controle-comparer-choix.mjs <dossier construit>'); process.exit(2); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async () => {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(page).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 700));
  return p;
};
const colonnes = (p) => p.evaluate(() => [...document.querySelectorAll('[data-role="reglage"][data-col]')].map((e) => e.getAttribute('data-col')));
const toucher = async (p, sel) => {
  const h = await p.$(sel);
  if (!h) return false;
  await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  const b = await h.boundingBox();
  await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await new Promise((r) => setTimeout(r, 450));
  return true;
};
const ecarts = [];

// K1 : retirer un houblon de départ.
let p = await ouvrir();
const depart = await colonnes(p);
const nom1 = await p.evaluate((c) => document.querySelector(`[data-houblon-compare="${c}"]`)?.textContent?.trim() ?? '', depart[1] ?? depart[0]);
if (!(await toucher(p, `[aria-label^="Retirer ${nom1}"]`))) ecarts.push(`K1 pas de « Retirer ${nom1} »`);
else if ((await colonnes(p)).includes(depart[1] ?? depart[0])) ecarts.push(`K1 « Retirer ${nom1} » ne le retire pas`);
await p.close();

// K2 : remplacer le premier houblon par un houblon du stock, à la même place.
p = await ouvrir();
const nom0 = await p.evaluate((c) => document.querySelector(`[data-houblon-compare="${c}"]`)?.textContent?.trim() ?? '', depart[0]);
if (!(await toucher(p, `[aria-label^="Remplacer ${nom0}"]`))) ecarts.push(`K2 pas de « Remplacer ${nom0} »`);
else {
  const choix = await p.evaluate(() => document.querySelector('[data-ajouter]')?.getAttribute('data-ajouter') ?? null);
  if (!choix || !(await toucher(p, `[data-ajouter="${choix}"]`))) ecarts.push('K2 la feuille de remplacement ne propose aucun houblon');
  else {
    const apres = await colonnes(p);
    if (apres[0] !== choix || apres.includes(depart[0])) ecarts.push(`K2 ${choix} n'est pas à la place de ${depart[0]} (colonnes : ${apres.join(', ')})`);
  }
}
await p.close();

// K3 : chercher « nelson » dans la feuille d'ajout, et l'ajouter.
p = await ouvrir();
if (depart.length >= 3) await toucher(p, `[aria-label^="Retirer ${nom1}"]`);
if (!(await toucher(p, '[aria-label="Ajouter un houblon à la comparaison"]'))) ecarts.push('K3 pas de bouton « + »');
else {
  const champ = await p.$('[data-role="chercher-houblon"]');
  if (!champ) ecarts.push('K3 pas de champ de recherche dans la feuille d\'ajout');
  else {
    await champ.type('nelson');
    await new Promise((r) => setTimeout(r, 400));
    const trouve = await p.evaluate(() => [...document.querySelectorAll('[data-ajouter]')].map((e) => e.getAttribute('data-ajouter')).find((k) => /nelson/.test(k)) ?? null);
    if (!trouve) ecarts.push('K3 « nelson » ne trouve pas Nelson Sauvin');
    else if (!(await toucher(p, `[data-ajouter="${trouve}"]`)) || !(await colonnes(p)).includes(trouve)) ecarts.push('K3 Nelson Sauvin trouvé mais pas ajouté');
  }
}
await p.close();
await nav.close();
console.log(ecarts.length ? `COMPARER-CHOIX ECHEC (${ecarts.join(' ; ')})` : `COMPARER-CHOIX OK (retirer, remplacer à sa place, chercher « nelson » ; départ : ${depart.join(', ')})`);
process.exit(ecarts.length ? 1 : 0);
