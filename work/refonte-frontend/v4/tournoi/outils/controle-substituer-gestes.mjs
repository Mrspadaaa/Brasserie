#!/usr/bin/env node
// D127 (24.10, soir), sur u4 (« u4 · ton choix ») : « bien mais trop centré ibu, il faudrait aussi pas que à 60' mais aussi
// en dry hop. SI non plutôt bien. Attention à toujours utilisé la baseline. Aussi ajouter à comparé doit être facile. Et le
// remplacement aussi. Ainsi que ferme la vue ». La maquette 24.10 suivait u4 : remplaçants « à 60′ » seulement (le score y
// pèse l'amertume à 0,6), aucun geste vers Comparer.
//
// Joue `<dossier construit>/substituer/<page>` à 390 × 844, au doigt, sans défiler, et refuse :
//   S1 pas de dry hop : au premier écran, un bouton « dry hop » (ou « à froid ») ; le toucher change la liste des remplaçants ;
//   S2 Comparer difficile : au premier écran, un bouton qui ajoute à Comparer (« Comparer », « + Comparer ») ; le toucher ouvre
//      Comparer ou fait monter son compteur (« Comparer (n) ») ;
//   S3 remplacement difficile : « Remplacer » visible sans défiler, actif au repos ou après un toucher sur un remplaçant ;
//   S4 pas de fermeture : la croix (`[data-role="retour"]`, ou « Fermer ») en haut, à 120 px au plus ; le toucher quitte la vue.
// Usage : node controle-substituer-gestes.mjs <dossier construit> [--page=etat.html]
// Sortie : une ligne par règle, puis « SUBSTITUER-GESTES OK » ou « SUBSTITUER-GESTES ECHEC (k/4) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const dossier = args.find((a) => !a.startsWith('--'));
const nomPage = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const fichier = dossier && path.resolve(RACINE, dossier, 'substituer', nomPage);
if (!fichier || !fs.existsSync(fichier)) { console.log('Usage : node controle-substituer-gestes.mjs <dossier construit> [--page=etat.html]'); process.exit(2); }

const attente = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
const ouvrir = async () => {
  const p = await navigateur.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await attente(500);
  return p;
};
// Le premier bouton affiché au premier écran dont le texte ou le libellé répond au motif.
const bouton = (p, source, haut = 844) => p.evaluateHandle((src, h) => {
  const re = new RegExp(src, 'i');
  const vus = [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="radio"]')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < h && getComputedStyle(e).visibility !== 'hidden';
  });
  return vus.find((e) => re.test(`${e.innerText ?? ''} ${e.getAttribute('aria-label') ?? ''} ${e.getAttribute('title') ?? ''}`)) ?? null;
}, source, haut).then((x) => x.asElement());
const toucher = async (p, h) => { const b = await h.boundingBox(); await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await attente(700); };
const texte = (p) => p.evaluate(() => document.body.innerText);

const regles = [];
const regle = async (nom, f) => {
  const p = await ouvrir();
  try { const k = await f(p); regles.push({ nom, ko: k }); } catch (e) { regles.push({ nom, ko: `erreur : ${String(e.message).split('\n')[0]}` }); } finally { await p.close(); }
};

await regle('S1 dry hop', async (p) => {
  const h = await bouton(p, 'dry\\s*hop|à froid');
  if (!h) return 'aucun bouton « dry hop » au premier écran : les remplaçants restent à un seul moment';
  const avant = await texte(p);
  await toucher(p, h);
  return (await texte(p)) === avant ? 'le toucher de « dry hop » ne change rien' : null;
});
await regle('S2 ajouter à Comparer', async (p) => {
  const h = await bouton(p, '(^|\\s|\\+)comparer');
  if (!h) return 'aucun bouton « Comparer » au premier écran';
  const compte = (t) => Number((/Comparer\s*\((\d+)\)/i.exec(t) ?? [])[1] ?? 0);
  const avant = compte(await texte(p));
  await toucher(p, h);
  const apres = await texte(p);
  return p.url().includes('comparer') || compte(apres) > avant ? null : 'le toucher n\'ouvre pas Comparer et ne fait pas monter son compteur';
});
await regle('S3 remplacer', async (p) => {
  const h = await bouton(p, '^\\s*remplacer');
  if (!h) return '« Remplacer » n\'est pas visible sans défiler';
  if (!(await h.evaluate((e) => e.disabled || e.getAttribute('aria-disabled') === 'true'))) return null;
  const rang = await p.$('[data-houblon], [data-role="candidat"]');
  if (!rang) return '« Remplacer » inactif, et aucun remplaçant à toucher';
  await toucher(p, rang);
  return (await h.evaluate((e) => e.disabled || e.getAttribute('aria-disabled') === 'true')) ? '« Remplacer » reste inactif après le toucher d\'un remplaçant' : null;
});
await regle('S4 fermer', async (p) => {
  const h = (await p.$('[data-role="retour"]')) ?? (await bouton(p, 'fermer', 120));
  if (!h) return 'aucune croix pour fermer';
  const b = await h.boundingBox();
  if (!b || b.y > 120) return `la croix est à ${b ? Math.round(b.y) : '?'} px du haut (120 au plus)`;
  await toucher(p, h);
  return p.url().includes('substituer') && (await p.evaluate(() => !!document.querySelector('[data-ecran="substituer"]'))) ? 'le toucher de la croix ne quitte pas la vue' : null;
});
await navigateur.close();

for (const r of regles) console.log(`${r.nom} : ${r.ko ? 'ECHEC — ' + r.ko : 'OK'}`);
const ko = regles.filter((r) => r.ko).length;
console.log(ko ? `SUBSTITUER-GESTES ECHEC (${ko}/${regles.length})` : 'SUBSTITUER-GESTES OK');
process.exit(ko ? 1 : 0);
