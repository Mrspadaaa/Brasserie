#!/usr/bin/env node
// D129 (24.10, soir) : « Fait attention aux header, footer, sur la continuité de l'app ect... ». Mesuré le même soir sur la
// maquette commune : la croix est à la même place partout, mais le titre des outils passe de 20 px (Substituer) à 15 px
// (Dryhopper, Levure), et le pied « Annuler · action » est en bas sur Substituer et Levure (788 px) quand celui de Dryhopper
// est à 666 px, au-dessus du rail.
//
// Joue chaque écran de la maquette (`<dossier>/<route>/etat.html`) à 390 × 844 et à 1280 × 800, sans geste, et refuse :
//   K1 la croix (`[data-role="retour"]`) d'un écran d'outil ailleurs qu'aux autres (2 px près), ou d'une autre taille ;
//   K2 l'en-tête (le bloc de la croix) d'une autre hauteur que les autres (2 px près) ;
//   K3 le titre de l'en-tête d'un outil (Substituer, Dryhopper, Levure) d'une autre taille que celui des autres outils ;
//   K4 un pied « Annuler · action » ailleurs qu'en bas de l'écran, ou d'une autre hauteur, ou Annuler pas à gauche de l'action.
// Les écrans à onglets (Ma bière, Suggestions, Comparer) n'ont pas de titre (D119 : le même en-tête) ; l'étape Houblons porte
// le fil d'étapes de l'app (D116), sans croix ; la fiche est une feuille (sa croix, D109, se juge à part).
// Usage : node controle-continuite.mjs <dossier construit>
// Sortie : une ligne par règle et largeur, puis « CONTINUITE OK » ou « CONTINUITE ECHEC (k) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dossier = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!dossier || !fs.existsSync(path.resolve(RACINE, dossier))) { console.log('Usage : node controle-continuite.mjs <dossier construit>'); process.exit(2); }
const ONGLETS = ['biere', 'suggerer', 'comparer'];
const OUTILS = ['substituer', 'dryhopper', 'levure'];

const MESURER = () => {
  const vu = (e) => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const bx = (e) => { const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height, bas: q.bottom }; };
  const croix = [...document.querySelectorAll('[data-role="retour"]')].find(vu);
  if (!croix) return { croix: null };
  const tete = croix.closest('header') || croix.parentElement;
  // Le titre : le premier texte de l'en-tête hors de la croix, hors des onglets.
  const titre = [...tete.querySelectorAll('h1, h2, h3, p, span, div')].find((e) => vu(e) && !e.closest('[role="tablist"], [data-role="retour"]')
    && (e.innerText || '').trim().length > 2 && ![...e.children].some((c) => (c.innerText || '').trim().length > 2));
  const boutons = [...document.querySelectorAll('button, a[href]')].filter(vu);
  const annuler = boutons.find((e) => /^\s*annuler\s*$/i.test(e.innerText || ''));
  let action = null;
  if (annuler) {
    const a = bx(annuler);
    action = boutons.filter((e) => e !== annuler).map((e) => ({ e, b: bx(e) })).filter(({ b }) => Math.abs(b.y - a.y) < 6 && b.x > a.x).sort((p, q) => p.b.x - q.b.x)[0]?.b ?? null;
  }
  return { croix: bx(croix), tete: bx(tete), titre: titre ? parseFloat(getComputedStyle(titre).fontSize) : null, annuler: annuler ? bx(annuler) : null, action, haut: innerHeight };
};

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
const mesures = {};
for (const [l, h] of [[390, 844], [1280, 800]]) {
  mesures[l] = {};
  for (const r of [...ONGLETS, ...OUTILS]) {
    const f = path.resolve(RACINE, dossier, r, 'etat.html');
    if (!fs.existsSync(f)) continue;
    const p = await navigateur.newPage();
    await p.setViewport({ width: l, height: h, deviceScaleFactor: 1, isMobile: l < 800, hasTouch: l < 800 });
    await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((x) => setTimeout(x, 400));
    mesures[l][r] = await p.evaluate(MESURER);
    await p.close();
  }
}
await navigateur.close();

const ecarts = [];
const proche = (a, b, t = 2) => Math.abs(a - b) <= t;
for (const l of Object.keys(mesures)) {
  const m = mesures[l];
  const routes = Object.keys(m);
  const sans = routes.filter((r) => !m[r].croix);
  if (sans.length) ecarts.push(`${l} K1 sans croix : ${sans.join(', ')}`);
  const avec = routes.filter((r) => m[r].croix);
  const ref = avec[0];
  for (const r of avec.slice(1)) {
    const a = m[ref].croix, b = m[r].croix;
    if (!proche(a.x, b.x) || !proche(a.y, b.y) || !proche(a.w, b.w) || !proche(a.h, b.h)) ecarts.push(`${l} K1 croix de ${r} (${Math.round(b.x)}, ${Math.round(b.y)}, ${Math.round(b.w)} px) ≠ ${ref} (${Math.round(a.x)}, ${Math.round(a.y)}, ${Math.round(a.w)} px)`);
    if (!proche(m[ref].tete.h, m[r].tete.h)) ecarts.push(`${l} K2 en-tête de ${r} : ${Math.round(m[r].tete.h)} px ≠ ${ref} : ${Math.round(m[ref].tete.h)} px`);
  }
  const titres = OUTILS.filter((r) => m[r]?.titre).map((r) => [r, m[r].titre]);
  if (new Set(titres.map(([, t]) => t)).size > 1) ecarts.push(`${l} K3 titres des outils : ${titres.map(([r, t]) => `${r} ${t} px`).join(', ')}`);
  const pieds = routes.filter((r) => m[r].annuler);
  for (const r of pieds) {
    const a = m[r].annuler, c = m[r].action;
    if (a.bas < m[r].haut - 64) ecarts.push(`${l} K4 pied de ${r} à ${Math.round(a.y)} px : pas en bas de l'écran (${m[r].haut} px)`);
    if (!c) ecarts.push(`${l} K4 pied de ${r} : aucune action à droite d'« Annuler »`);
    else if (!proche(a.h, c.h)) ecarts.push(`${l} K4 pied de ${r} : Annuler ${Math.round(a.h)} px, action ${Math.round(c.h)} px`);
  }
  const hauteurs = [...new Set(pieds.map((r) => Math.round(m[r].annuler.h)))];
  if (hauteurs.length > 1) ecarts.push(`${l} K4 pieds de hauteurs différentes : ${pieds.map((r) => `${r} ${Math.round(m[r].annuler.h)} px`).join(', ')}`);
}
for (const e of ecarts) console.log(`ECART ${e}`);
console.log(ecarts.length ? `CONTINUITE ECHEC (${ecarts.length})` : `CONTINUITE OK (${Object.keys(mesures['390']).length} écrans × 2 largeurs)`);
process.exit(ecarts.length ? 1 : 0);
